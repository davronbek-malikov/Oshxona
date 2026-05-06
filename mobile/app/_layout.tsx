import "../global.css";
import { useEffect, useState } from "react";
import { Slot, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/lib/supabase";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/(tabs)/menu");
      } else {
        router.replace("/(auth)/login");
      }
      setChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.replace("/(tabs)/menu");
      }
      if (event === "SIGNED_OUT") {
        router.replace("/(auth)/login");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Slot />
    </>
  );
}
