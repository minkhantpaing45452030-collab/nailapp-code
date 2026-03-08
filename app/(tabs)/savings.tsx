import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { useApp } from "@/context/AppContext";
import Colors from "@/constants/colors";

function formatCurrency(n: number) {
  return n.toLocaleString("en-US");
}

function SavingsHistoryItem({ amount, date }: { amount: number; date: string }) {
  const d = new Date(date);
  const label = `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  return (
    <View style={styles.historyItem}>
      <View style={styles.historyIconWrap}>
        <Ionicons name="add-circle" size={20} color={Colors.profitGreen} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.historyAmount}>+{formatCurrency(amount)}</Text>
        <Text style={styles.historyDate}>{label}</Text>
      </View>
    </View>
  );
}

export default function SavingsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { savings, totalSavings, addSavings } = useApp();
  const [inputValue, setInputValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const piggyScale = useSharedValue(1);
  const piggyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: piggyScale.value }],
  }));

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : tabBarHeight;

  const handleAdd = async () => {
    const amount = parseFloat(inputValue.replace(/,/g, ""));
    if (!inputValue || isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAdding(true);
    await addSavings(amount);
    piggyScale.value = withSequence(
      withSpring(1.15, { duration: 200 }),
      withSpring(0.95, { duration: 150 }),
      withSpring(1.0, { duration: 200 })
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setInputValue("");
    setIsAdding(false);
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <LinearGradient
        colors={["#FFF0F5", "#FDF2F8", "#FFF7FB"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding + 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Savings Vault</Text>
          <Text style={styles.headerSub}>Your little treasure box</Text>
        </View>

        {/* Big Savings Card */}
        <View style={styles.savingsCardWrap}>
          <LinearGradient
            colors={[Colors.primary, Colors.deepRose]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.savingsCard}
          >
            <Animated.View style={[styles.piggyIconWrap, piggyStyle]}>
              <Ionicons name="wallet" size={52} color="rgba(255,255,255,0.9)" />
            </Animated.View>
            <Text style={styles.savingsLabel}>Total Accumulated Savings</Text>
            <Text style={styles.savingsTotal}>{formatCurrency(totalSavings)}</Text>
            <Text style={styles.savingsCurrency}>MMK</Text>
            <View style={styles.sparkles}>
              <Ionicons name="sparkles" size={14} color="rgba(255,255,255,0.6)" />
              <Ionicons name="sparkles" size={10} color="rgba(255,255,255,0.4)" />
              <Ionicons name="sparkles" size={16} color="rgba(255,255,255,0.5)" />
            </View>
          </LinearGradient>
        </View>

        {/* Add Savings Input */}
        <View style={styles.addSection}>
          <Text style={styles.addLabel}>Add to Savings</Text>
          <View style={styles.addRow}>
            <View style={styles.inputWrap}>
              <Text style={styles.inputPrefix}>MMK</Text>
              <TextInput
                style={styles.input}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={handleAdd}
              />
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.fab,
                pressed && { transform: [{ scale: 0.92 }], opacity: 0.85 },
                isAdding && styles.fabDisabled,
              ]}
              onPress={handleAdd}
              disabled={isAdding}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.deepRose]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fabGradient}
              >
                <Ionicons name="add" size={26} color="#fff" />
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        {/* History */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>History</Text>
          {savings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={40} color={Colors.borderPink} />
              <Text style={styles.emptyText}>No savings added yet</Text>
              <Text style={styles.emptySubText}>Start adding to your vault above</Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {[...savings].reverse().map((s) => (
                <SavingsHistoryItem key={s.id} amount={s.amount} date={s.addedAt} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.blush,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: "DancingScript_700Bold",
    fontSize: 32,
    color: Colors.deepRose,
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  savingsCardWrap: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  savingsCard: {
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    overflow: "hidden",
  },
  piggyIconWrap: {
    marginBottom: 12,
  },
  savingsLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  savingsTotal: {
    fontFamily: "Inter_700Bold",
    fontSize: 48,
    color: "#fff",
    letterSpacing: -1,
    lineHeight: 56,
  },
  savingsCurrency: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  sparkles: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    alignItems: "center",
  },
  addSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  addLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  addRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.borderPink,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  inputPrefix: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textMuted,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
    padding: 0,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
    overflow: "hidden",
  },
  fabGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fabDisabled: {
    opacity: 0.5,
  },
  historySection: {
    marginHorizontal: 16,
  },
  historyTitle: {
    fontFamily: "DancingScript_700Bold",
    fontSize: 22,
    color: Colors.deepRose,
    marginBottom: 12,
  },
  historyList: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.borderPink,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderPink,
    gap: 12,
  },
  historyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  historyAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.profitGreen,
  },
  historyDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.textMuted,
  },
  emptySubText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.borderPink,
  },
});
