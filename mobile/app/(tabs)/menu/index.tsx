import { useEffect, useState } from "react";
import {
  View, Text, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";

interface Restaurant {
  id: string;
  name_uz: string;
  name_en: string | null;
  description: string | null;
  address: string | null;
  opening_time: string | null;
  closing_time: string | null;
  distance_km?: number;
}

function isOpen(opening?: string | null, closing?: string | null) {
  if (!opening || !closing) return null;
  const now = new Date();
  const hhmm = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  return hhmm >= opening && hhmm <= closing;
}

export default function MenuScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setFetching(true);

    const { data, error } = await supabase.rpc("restaurants_near", {
      lat: 35.18, lng: 128.11, radius_km: 500,
    });

    if (!error && data && (data as Restaurant[]).length > 0) {
      setRestaurants(data as Restaurant[]);
    } else {
      const { data: all } = await supabase
        .from("restaurants")
        .select("id,name_uz,name_en,description,address,opening_time,closing_time")
        .eq("is_approved", true)
        .eq("is_active", true)
        .order("name_uz");
      setRestaurants((all ?? []) as Restaurant[]);
    }
    setFetching(false);
  }

  const filtered = search.trim()
    ? restaurants.filter(
        (r) =>
          r.name_uz.toLowerCase().includes(search.toLowerCase()) ||
          r.name_en?.toLowerCase().includes(search.toLowerCase())
      )
    : restaurants;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center mb-1">
          <Text className="text-3xl">🍽️</Text>
          <Text className="text-2xl font-bold ml-2">Oshxona</Text>
        </View>
        <Text className="text-gray-400 text-sm mb-3">Mazali halol taomlar</Text>

        {/* Search */}
        <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 h-12">
          <Text className="text-gray-400 mr-2">🔍</Text>
          <TextInput
            className="flex-1 text-base"
            placeholder="Search restaurants..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {fetching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
          <Text className="text-gray-400 mt-3">Finding restaurants...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-5xl">🍽️</Text>
          <Text className="font-semibold mt-3 text-lg">No restaurants found</Text>
          <TouchableOpacity onPress={load} className="mt-4">
            <Text className="text-primary font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: r }) => {
            const open = isOpen(r.opening_time, r.closing_time);
            return (
              <TouchableOpacity
                onPress={() => router.push(`/(tabs)/menu/${r.id}`)}
                className="bg-white rounded-3xl p-4 shadow-sm"
                activeOpacity={0.7}
              >
                <View className="w-full h-32 bg-orange-50 rounded-2xl items-center justify-center mb-3">
                  <Text className="text-5xl">🏪</Text>
                </View>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-2">
                    <Text className="font-bold text-lg">{r.name_uz}</Text>
                    {r.name_en && (
                      <Text className="text-gray-400 text-sm">{r.name_en}</Text>
                    )}
                    {r.address && (
                      <Text className="text-gray-400 text-sm mt-1" numberOfLines={1}>
                        📍 {r.address}
                      </Text>
                    )}
                    {r.description && (
                      <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
                        {r.description}
                      </Text>
                    )}
                  </View>
                  {open !== null && (
                    <View className={`px-3 py-1 rounded-full ${open ? "bg-green-100" : "bg-gray-100"}`}>
                      <Text className={`text-xs font-semibold ${open ? "text-green-700" : "text-gray-500"}`}>
                        {open ? "Open" : "Closed"}
                      </Text>
                    </View>
                  )}
                </View>
                {r.opening_time && r.closing_time && (
                  <Text className="text-gray-400 text-xs mt-2">
                    🕐 {r.opening_time} – {r.closing_time}
                  </Text>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
