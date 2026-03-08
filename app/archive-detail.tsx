import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useApp, EXPENSE_TAG_EN, EXPENSE_TAG_LABELS } from "@/context/AppContext";
import Colors from "@/constants/colors";

function formatCurrency(n: number) {
  return n.toLocaleString("en-US");
}

function formatDayDate(dateStr: string): { dayNum: string; dayName: string } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    dayNum: String(d),
    dayName: date.toLocaleDateString("en-US", { weekday: "short", month: "short" }),
  };
}

export default function ArchiveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { archivedMonths } = useApp();

  const archive = useMemo(
    () => archivedMonths.find((a) => a.id === id),
    [archivedMonths, id]
  );

  const topPadding = Platform.OS === "web" ? 67 : insets.top + 8;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 16;

  if (!archive) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <View style={styles.notFound}>
          <Ionicons name="archive-outline" size={48} color={Colors.borderPink} />
          <Text style={styles.notFoundText}>Archive not found</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <LinearGradient
        colors={["#FFF0F5", "#FDF2F8", "#FFF7FB"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Sticky Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backIconBtn} hitSlop={12}>
          <Ionicons name="chevron-down" size={22} color={Colors.deepRose} />
        </Pressable>
        <Text style={styles.headerTitle}>{archive.label}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary Banner */}
      <LinearGradient
        colors={[Colors.primary, Colors.deepRose]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.summaryBanner}
      >
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={styles.summaryValue}>{formatCurrency(archive.totalIncome)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Expense</Text>
          <Text style={[styles.summaryValue, { color: "#FECDD3" }]}>
            {formatCurrency(archive.totalExpense)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Profit</Text>
          <Text
            style={[
              styles.summaryValue,
              {
                color: archive.netProfit >= 0 ? "#A7F3D0" : "#FECDD3",
              },
            ]}
          >
            {archive.netProfit < 0 ? "-" : ""}
            {formatCurrency(Math.abs(archive.netProfit))}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding, paddingTop: 8 }}
      >
        {archive.entries.length === 0 ? (
          <View style={styles.emptyEntries}>
            <Ionicons name="calendar-outline" size={40} color={Colors.borderPink} />
            <Text style={styles.emptyEntriesText}>No daily records in this archive</Text>
          </View>
        ) : (
          <View style={styles.entriesList}>
            {archive.entries.map((entry) => {
              const { dayNum, dayName } = formatDayDate(entry.date);
              return (
                <View key={entry.date} style={styles.entryCard}>
                  {/* Day badge */}
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeNum}>{dayNum}</Text>
                    <Text style={styles.dayBadgeName}>{dayName}</Text>
                  </View>

                  <View style={styles.entryContent}>
                    {/* Income / Expense row */}
                    <View style={styles.entryAmounts}>
                      {entry.income > 0 && (
                        <View style={styles.amountChip}>
                          <Ionicons name="arrow-up" size={12} color={Colors.profitGreen} />
                          <Text style={[styles.amountChipText, { color: Colors.profitGreen }]}>
                            {formatCurrency(entry.income)}
                          </Text>
                        </View>
                      )}
                      {entry.expense > 0 && (
                        <View style={[styles.amountChip, styles.expenseChip]}>
                          <Ionicons name="arrow-down" size={12} color={Colors.expenseRed} />
                          <Text style={[styles.amountChipText, { color: Colors.expenseRed }]}>
                            {formatCurrency(entry.expense)}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Tags */}
                    {entry.tags && entry.tags.length > 0 && (
                      <View style={styles.tagsRow}>
                        {entry.tags.map((tag) => (
                          <View key={tag} style={styles.tagChip}>
                            <Text style={styles.tagChipText}>{EXPENSE_TAG_EN[tag]}</Text>
                            <Text style={styles.tagChipMm}> · {EXPENSE_TAG_LABELS[tag]}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Receipt photo */}
                    {entry.photoUri && (
                      <Image
                        source={{ uri: entry.photoUri }}
                        style={styles.receiptThumb}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                </View>
              );
            })}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  backIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightPink,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "DancingScript_700Bold",
    fontSize: 24,
    color: Colors.deepRose,
  },
  summaryBanner: {
    marginHorizontal: 16,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  summaryLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  summaryValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#fff",
    letterSpacing: -0.3,
  },
  entriesList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  entryCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    gap: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderPink,
  },
  dayBadge: {
    width: 44,
    height: 52,
    backgroundColor: Colors.lightPink,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBadgeNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.deepRose,
    lineHeight: 24,
  },
  dayBadgeName: {
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  entryContent: {
    flex: 1,
    gap: 8,
  },
  entryAmounts: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  amountChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#D1FAE5",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  expenseChip: {
    backgroundColor: "#FEE2E2",
  },
  amountChipText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightPink,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.deepRose,
  },
  tagChipMm: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.textMuted,
  },
  receiptThumb: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderPink,
  },
  emptyEntries: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyEntriesText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.textMuted,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFoundText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.textMuted,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.lightPink,
    borderRadius: 12,
  },
  backBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.deepRose,
  },
});
