import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, Alert } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function ProfileScreen() {
  const { user, loading } = useCurrentUser();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  async function handleSaveName() {
    if (!user || !name.trim()) return;
    setSaving(true);
    await supabase.from("users").update({ name }).eq("id", user.id);
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSignOut() {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: async () => {
        await supabase.auth.signOut();
        router.replace("/(auth)/login");
      }},
    ]);
  }

  if (loading) {
    return <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center"><Text className="text-gray-400">Loading...</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold">Profile</Text>
      </View>

      <View className="mx-4 mt-2 gap-3">
        {/* Avatar card */}
        <View className="bg-white rounded-2xl p-5 items-center">
          <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-3">
            <Text className="text-4xl">👤</Text>
          </View>
          <Text className="font-bold text-lg">{user?.name || "No name set"}</Text>
          <Text className="text-gray-400 text-sm mt-1">{user?.phone}</Text>
        </View>

        {/* Name edit */}
        <View className="bg-white rounded-2xl p-4 gap-3">
          <Text className="font-semibold">Name</Text>
          {editing ? (
            <View className="gap-2">
              <TextInput
                className="border border-gray-200 rounded-xl px-4 h-12 text-base"
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                autoFocus
              />
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={handleSaveName}
                  disabled={saving || !name.trim()}
                  className={`flex-1 h-11 rounded-xl items-center justify-center ${saving || !name.trim() ? "bg-orange-200" : "bg-primary"}`}
                >
                  <Text className="text-white font-semibold">{saving ? "Saving..." : "Save"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setEditing(false)}
                  className="flex-1 h-11 border border-gray-200 rounded-xl items-center justify-center"
                >
                  <Text className="text-gray-500 font-semibold">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-500">{saved ? "✓ Saved!" : (user?.name || "Not set")}</Text>
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text className="text-primary font-semibold text-sm">Edit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Links */}
        <View className="bg-white rounded-2xl divide-y divide-gray-100">
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/orders")}
            className="flex-row items-center justify-between px-4 py-4"
          >
            <View className="flex-row items-center gap-3">
              <Text>📋</Text>
              <Text className="text-base">My orders</Text>
            </View>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="border border-red-300 h-12 rounded-xl items-center justify-center mt-2"
        >
          <Text className="text-red-500 font-semibold">Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
