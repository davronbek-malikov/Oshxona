import { useEffect, useState } from "react";
import {
  View, Text, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/store/cart";

interface MenuItem {
  id: string;
  name_uz: string;
  name_en: string | null;
  description: string | null;
  category: string | null;
  price_krw: number;
  is_available: boolean;
  sold_out_today: boolean;
}

interface Restaurant {
  id: string;
  name_uz: string;
  address: string | null;
  opening_time: string | null;
  closing_time: string | null;
}

const CATEGORIES = [
  { value: "all",      label: "All" },
  { value: "tovuq",   label: "🍗 Tovuq" },
  { value: "kabob",   label: "🥩 Kabob" },
  { value: "somsa",   label: "🥟 Somsa" },
  { value: "osh",     label: "🍚 Osh" },
  { value: "salat",   label: "🥗 Salat" },
  { value: "ichimlik",label: "🥤 Drink" },
  { value: "shirinlik",label: "🍰 Dessert" },
];

export default function RestaurantMenuScreen() {
  const { restaurantId } = useLocalSearchParams<{ restaurantId: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const { addItem, clearCart, itemCount, restaurantId: cartRestId } = useCartStore();

  useEffect(() => {
    async function load() {
      const { data: r } = await supabase
        .from("restaurants").select("*").eq("id", restaurantId).single();
      setRestaurant(r);

      const { data: m } = await supabase
        .from("menu_items").select("*")
        .eq("restaurant_id", restaurantId)
        .order("category").order("name_uz");
      setItems((m ?? []) as MenuItem[]);
      setLoading(false);
    }
    load();

    // Realtime availability
    const channel = supabase
      .channel(`menu-${restaurantId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "menu_items",
        filter: `restaurant_id=eq.${restaurantId}`,
      }, (payload) => {
        setItems((prev) =>
          prev.map((i) => i.id === (payload.new as MenuItem).id ? { ...i, ...(payload.new as MenuItem) } : i)
        );
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurantId]);

  function handleAdd(item: MenuItem) {
    if (!restaurant) return;
    const added = addItem(restaurant.id, restaurant.name_uz, {
      id: item.id, name_uz: item.name_uz, price_krw: item.price_krw,
    });
    if (!added) {
      Alert.alert("Clear cart?", "You have items from another restaurant. Clear cart and add this item?", [
        { text: "Cancel", style: "cancel" },
        { text: "Clear & Add", style: "destructive", onPress: () => {
          clearCart();
          addItem(restaurant.id, restaurant.name_uz, {
            id: item.id, name_uz: item.name_uz, price_krw: item.price_krw,
          });
        }},
      ]);
    }
  }

  const usedCategories = CATEGORIES.filter(
    (c) => c.value === "all" || items.some((i) => i.category === c.value)
  );

  const visible = items.filter((item) => {
    const matchCat = activeCategory === "all" || item.category === activeCategory;
    const matchSearch = !search.trim() ||
      item.name_uz.toLowerCase().includes(search.toLowerCase()) ||
      item.name_en?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  const cartCount = itemCount();
  const total = useCartStore.getState().total();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-3 border-b border-gray-100">
        <View className="flex-row items-center gap-3 mb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="font-bold text-lg" numberOfLines={1}>{restaurant?.name_uz}</Text>
            {restaurant?.address && (
              <Text className="text-gray-400 text-xs" numberOfLines={1}>{restaurant.address}</Text>
            )}
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 h-11">
          <Text className="text-gray-400 mr-2">🔍</Text>
          <TextInput
            className="flex-1 text-base"
            placeholder="Search dishes..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-100"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      >
        {usedCategories.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            onPress={() => setActiveCategory(cat.value)}
            className={`px-4 h-9 rounded-full items-center justify-center ${
              activeCategory === cat.value ? "bg-primary" : "bg-gray-100"
            }`}
          >
            <Text className={`text-sm font-semibold ${
              activeCategory === cat.value ? "text-white" : "text-gray-500"
            }`}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Items */}
      <FlatList
        data={visible}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: cartCount > 0 ? 100 : 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-4xl">🍽️</Text>
            <Text className="text-gray-400 mt-3">No dishes found</Text>
          </View>
        }
        renderItem={({ item }) => {
          const unavailable = !item.is_available || item.sold_out_today;
          return (
            <View className={`bg-white rounded-2xl p-3 flex-row gap-3 ${unavailable ? "opacity-50" : ""}`}>
              <View className="w-24 h-24 bg-orange-50 rounded-xl items-center justify-center flex-shrink-0">
                <Text className="text-3xl">🍽️</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-base">{item.name_uz}</Text>
                {item.name_en && <Text className="text-gray-400 text-xs">{item.name_en}</Text>}
                {item.description && (
                  <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>{item.description}</Text>
                )}
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="font-bold text-lg text-primary">
                    ₩{item.price_krw.toLocaleString()}
                  </Text>
                  {unavailable ? (
                    <View className="bg-gray-100 px-3 py-1 rounded-full">
                      <Text className="text-gray-500 text-xs font-medium">
                        {item.sold_out_today ? "Sold out" : "Unavailable"}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleAdd(item)}
                      className="w-10 h-10 bg-primary rounded-xl items-center justify-center"
                      activeOpacity={0.7}
                    >
                      <Text className="text-white text-xl font-bold">+</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Floating cart button */}
      {cartCount > 0 && cartRestId === restaurantId && (
        <View className="absolute bottom-6 left-4 right-4">
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/cart")}
            className="bg-primary rounded-2xl h-14 flex-row items-center justify-between px-5 shadow-lg"
            activeOpacity={0.8}
          >
            <View className="bg-white/20 rounded-lg w-8 h-8 items-center justify-center">
              <Text className="text-white font-bold text-sm">{cartCount}</Text>
            </View>
            <Text className="text-white font-bold text-base">View Cart</Text>
            <Text className="text-white font-bold">₩{total.toLocaleString()}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
