import React, { useState, useMemo, useCallback } from "react";
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

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function formatCurrency(n: number) {
  return n.toLocaleString("en-US");
}

function StatCard({
  label,
  value,
  color,
  icon,
  isBig,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
  isBig?: boolean;
}) {
  return (
    <View style={[styles.statCard, isBig && styles.statCardBig]}>
      <View style={[styles.statIconWrap, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>
        {value < 0 ? "-" : ""}
        {formatCurrency(Math.abs(value))}
      </Text>
    </View>
  );
}

function CalendarDayCell({
  day,
  date,
  isToday,
  isOtherMonth,
  isMonday,
  isComplete,
  onPress,
}: {
  day: number | null;
  date: string;
  isToday: boolean;
  isOtherMonth: boolean;
  isMonday: boolean;
  isComplete: boolean;
  onPress: () => void;
}) {
  if (day === null) return <View style={styles.dayCell} />;

  if (isMonday) {
    return (
      <View style={[styles.dayCell, styles.dayCellMonday]}>
        <Text style={styles.dayTextMonday}>{day}</Text>
        <View style={styles.closedBadge}>
          <Text style={styles.closedBadgeText}>Off</Text>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.dayCell,
        isToday && styles.dayCellToday,
        isComplete && !isToday && styles.dayCellComplete,
        pressed && styles.dayCellPressed,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.dayText,
          isToday && styles.dayTextToday,
          isOtherMonth && styles.dayTextOther,
          isComplete && !isToday && styles.dayTextComplete,
        ]}
      >
        {day}
      </Text>
      {isComplete && (
        <Ionicons
          name="checkmark-circle"
          size={12}
          color={Colors.profitGreen}
          style={{ marginTop: 1 }}
        />
      )}
    </Pressable>
  );
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { entries, getMonthStats, currentYearMonth, archiveCurrentMonth } = useApp();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const yearMonth = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const stats = getMonthStats(yearMonth);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ day: number | null; date: string }> = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: null, date: "" });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, date: dateStr });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const navigateMonth = useCallback(
    (dir: -1 | 1) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      let m = viewMonth + dir;
      let y = viewYear;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      setViewMonth(m);
      setViewYear(y);
    },
    [viewMonth, viewYear]
  );

  const handleDayPress = useCallback(
    (date: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push({ pathname: "/daily-entry", params: { date } });
    },
    []
  );

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

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
          <View>
            <Text style={styles.headerTitle}>Nail By Yoon</Text>
            <Text style={styles.headerSub}>@make with love from Mg</Text>
          </View>
          <Pressable
            style={styles.archiveBtn}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await archiveCurrentMonth();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }}
          >
            <Ionicons name="archive-outline" size={20} color={Colors.primary} />
          </Pressable>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            label="Income"
            value={stats.totalIncome}
            color={Colors.primary}
            icon="trending-up-outline"
            isBig
          />
          <View style={styles.statsCol}>
            <StatCard
              label="Expense"
              value={stats.totalExpense}
              color={Colors.expenseRed}
              icon="trending-down-outline"
            />
            <StatCard
              label="Profit"
              value={stats.netProfit}
              color={stats.netProfit >= 0 ? Colors.profitGreen : Colors.expenseRed}
              icon="sparkles-outline"
            />
          </View>
        </View>

        {/* Month Nav */}
        <View style={styles.monthNav}>
          <Pressable onPress={() => navigateMonth(-1)} style={styles.navBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={20} color={Colors.primary} />
          </Pressable>
          <Text style={styles.monthTitle}>
            {MONTHS[viewMonth]} {viewYear}
          </Text>
          <Pressable onPress={() => navigateMonth(1)} style={styles.navBtn} hitSlop={12}>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
          </Pressable>
        </View>

        {/* Calendar */}
        <View style={styles.calendarCard}>
          {/* Day headers */}
          <View style={styles.weekRow}>
            {DAYS_SHORT.map((d, i) => (
              <Text
                key={d}
                style={[
                  styles.weekDayText,
                  i === 1 && styles.weekDayTextMonday,
                ]}
              >
                {d}
              </Text>
            ))}
          </View>
          {/* Day cells */}
          {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, rowIdx) => (
            <View key={rowIdx} style={styles.weekRow}>
              {calendarDays.slice(rowIdx * 7, rowIdx * 7 + 7).map((cell, colIdx) => {
                const entry = cell.date ? entries[cell.date] : undefined;
                const isMonday = colIdx === 1 && cell.day !== null;
                const isComplete = !!entry && (entry.income > 0 || entry.expense > 0);
                return (
                  <CalendarDayCell
                    key={colIdx}
                    day={cell.day}
                    date={cell.date}
                    isToday={cell.date === todayStr}
                    isOtherMonth={false}
                    isMonday={isMonday}
                    isComplete={isComplete}
                    onPress={() => cell.date && !isMonday && handleDayPress(cell.date)}
                  />
                );
              })}
            </View>
          ))}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.profitGreen} />
            <Text style={styles.legendText}>Entry saved</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendMondayDot} />
            <Text style={styles.legendText}>Shop closed</Text>
          </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontFamily: "DancingScript_700Bold",
    fontSize: 32,
    color: Colors.deepRose,
    letterSpacing: 0.5,
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  archiveBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightPink,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statsCol: {
    flex: 1,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.borderPink,
  },
  statCardBig: {
    justifyContent: "space-between",
    minHeight: 120,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    letterSpacing: -0.5,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.lightPink,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    fontFamily: "DancingScript_700Bold",
    fontSize: 22,
    color: Colors.deepRose,
  },
  calendarCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.borderPink,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 4,
  },
  weekDayText: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.textMuted,
    paddingVertical: 6,
  },
  weekDayTextMonday: {
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    margin: 1,
  },
  dayCellToday: {
    backgroundColor: Colors.lightPink,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  dayCellPressed: {
    backgroundColor: Colors.lightPink,
    opacity: 0.8,
  },
  dayCellMonday: {
    backgroundColor: "#F3F4F6",
  },
  dayCellComplete: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  dayText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text,
  },
  dayTextToday: {
    fontFamily: "Inter_700Bold",
    color: Colors.deepRose,
  },
  dayTextOther: {
    color: Colors.textMuted,
  },
  dayTextMonday: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#9CA3AF",
  },
  dayTextComplete: {
    fontFamily: "Inter_600SemiBold",
    color: "#166534",
  },
  closedBadge: {
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
    marginTop: 2,
  },
  closedBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 8,
    color: "#9CA3AF",
    letterSpacing: 0.3,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendMondayDot: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
  },
  legendText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
});
