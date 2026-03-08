import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "@/context/AppContext";
import Colors from "@/constants/colors";

function formatCurrency(n: number) {
  return n.toLocaleString("en-US");
}

function ArchiveCard({ archive }: { archive: ReturnType<typeof useApp>["archivedMonths"][0] }) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/archive-detail", params: { id: archive.id } });
  };

  const archivedDate = new Date(archive.archivedAt);
  const archivedLabel = `Saved ${archivedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.archiveCard,
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
      onPress={handlePress}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <Ionicons name="archive" size={22} color={Colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.cardMonth}>{archive.label}</Text>
          <Text style={styles.cardSaved}>{archivedLabel}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.borderPink} />
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Income</Text>
          <Text style={[styles.statValue, { color: Colors.primary }]}>
            {formatCurrency(archive.totalIncome)}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Expense</Text>
          <Text style={[styles.statValue, { color: Colors.expenseRed }]}>
            {formatCurrency(archive.totalExpense)}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Profit</Text>
          <Text
            style={[
              styles.statValue,
              {
                color:
                  archive.netProfit >= 0 ? Colors.profitGreen : Colors.expenseRed,
              },
            ]}
          >
            {archive.netProfit < 0 ? "-" : ""}
            {formatCurrency(Math.abs(archive.netProfit))}
          </Text>
        </View>
      </View>

      <View style={styles.entriesCount}>
        <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
        <Text style={styles.entriesCountText}>
          {archive.entries.length} day{archive.entries.length !== 1 ? "s" : ""} recorded
        </Text>
      </View>
    </Pressable>
  );
}

export default function ArchiveScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { archivedMonths } = useApp();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : tabBarHeight;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <LinearGradient
        colors={["#FFF0F5", "#FDF2F8", "#FFF7FB"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding + 16 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Monthly Archive</Text>
          <Text style={styles.headerSub}>Your business history</Text>
        </View>

        {archivedMonths.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="archive-outline" size={48} color={Colors.borderPink} />
            </View>
            <Text style={styles.emptyTitle}>No Archives Yet</Text>
            <Text style={styles.emptySubText}>
              Tap the archive button on the Calendar screen to save this month's records
            </Text>
            <View style={styles.tipCard}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.tipText}>
                You can archive a month from the top-right button on the Calendar tab
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.list}>
            {archivedMonths.map((archive) => (
              <ArchiveCard key={archive.id} archive={archive} />
            ))}
          </View>
        )}
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
    paddingBottom: 20,
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
  list: {
    paddingHorizontal: 16,
    gap: 14,
  },
  archiveCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.borderPink,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightPink,
    alignItems: "center",
    justifyContent: "center",
  },
  cardMonth: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.text,
  },
  cardSaved: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderPink,
    marginVertical: 14,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.borderPink,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    letterSpacing: -0.3,
  },
  entriesCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
  },
  entriesCountText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  emptyState: {
    paddingHorizontal: 32,
    paddingTop: 40,
    alignItems: "center",
    gap: 10,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.lightPink,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
  },
  emptySubText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
  },
  tipCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: Colors.lightPink,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    alignItems: "flex-start",
  },
  tipText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.deepRose,
    flex: 1,
    lineHeight: 19,
  },
});
