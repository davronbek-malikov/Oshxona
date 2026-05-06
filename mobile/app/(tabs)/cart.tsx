import { View, Text, FlatList, TouchableOpacity, SafeAreaView } from "react-native";
import { router } from "expo-router";
import { useCartStore } from "@/store/cart";

export default function CartScreen() {
  const { items, restaurantName, updateQty, removeItem, total, itemCount, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-6xl">🛒</Text>
        <Text className="text-xl font-bold mt-4">Cart is empty</Text>
        <Text className="text-gray-400 mt-2">Add items from a restaurant</Text>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/menu")}
          className="mt-6 bg-primary px-8 h-12 rounded-xl items-center justify-center"
        >
          <Text className="text-white font-bold">Browse restaurants</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <Text className="text-2xl font-bold">Cart</Text>
        <TouchableOpacity onPress={() => { if (items.length > 0) clearCart(); }}>
          <Text className="text-red-400 text-sm font-semibold">Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Restaurant name */}
      <View className="mx-4 mb-3 bg-white rounded-2xl px-4 py-3">
        <Text className="text-gray-400 text-xs">From</Text>
        <Text className="font-bold text-base">{restaurantName}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl p-4 flex-row items-center gap-3">
            <View className="flex-1">
              <Text className="font-semibold">{item.name_uz}</Text>
              <Text className="text-primary font-bold mt-1">
                ₩{(item.price_krw * item.quantity).toLocaleString()}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => updateQty(item.id, item.quantity - 1)}
                className="w-9 h-9 bg-gray-100 rounded-xl items-center justify-center"
              >
                <Text className="text-xl font-bold text-gray-600">−</Text>
              </TouchableOpacity>
              <Text className="text-base font-bold w-6 text-center">{item.quantity}</Text>
              <TouchableOpacity
                onPress={() => updateQty(item.id, item.quantity + 1)}
                className="w-9 h-9 bg-primary rounded-xl items-center justify-center"
              >
                <Text className="text-xl font-bold text-white">+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => removeItem(item.id)} className="ml-1">
              <Text className="text-gray-300 text-xl">✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Bottom summary */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-4 pb-8">
        <View className="flex-row justify-between mb-4">
          <Text className="text-gray-500">{itemCount()} items</Text>
          <Text className="font-bold text-lg text-primary">₩{total().toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/checkout")}
          className="bg-primary h-14 rounded-2xl items-center justify-center"
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-lg">Go to Checkout →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
