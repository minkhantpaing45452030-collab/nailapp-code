import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useApp, ExpenseTag, EXPENSE_TAG_LABELS, EXPENSE_TAG_EN } from "@/context/AppContext";
import Colors from "@/constants/colors";

const ALL_TAGS: ExpenseTag[] = ["food", "shop_expenses", "shop_rent", "staff_salary"];

function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function TagButton({
  tag,
  selected,
  onToggle,
}: {
  tag: ExpenseTag;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tagBtn,
        selected && styles.tagBtnSelected,
        pressed && { opacity: 0.8 },
      ]}
      onPress={onToggle}
    >
      {selected && (
        <Ionicons name="checkmark-circle" size={14} color={Colors.primary} style={{ marginRight: 4 }} />
      )}
      <View>
        <Text style={[styles.tagLabel, selected && styles.tagLabelSelected]}>
          {EXPENSE_TAG_EN[tag]}
        </Text>
        <Text style={[styles.tagMm, selected && styles.tagMmSelected]}>
          {EXPENSE_TAG_LABELS[tag]}
        </Text>
      </View>
    </Pressable>
  );
}

export default function DailyEntryScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const insets = useSafeAreaInsets();
  const { getEntry, setEntry } = useApp();

  const existing = date ? getEntry(date) : undefined;

  const [income, setIncome] = useState(existing ? String(existing.income || "") : "");
  const [expense, setExpense] = useState(existing ? String(existing.expense || "") : "");
  const [selectedTags, setSelectedTags] = useState<ExpenseTag[]>(existing?.tags ?? []);
  const [photoUri, setPhotoUri] = useState<string | undefined>(existing?.photoUri);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);

  const toggleTag = useCallback((tag: ExpenseTag) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handlePickImage = useCallback(async (fromCamera: boolean) => {
    try {
      setIsPickingImage(true);
      let result;
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Camera Permission", "Camera permission is required to take photos.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          quality: 0.7,
          allowsEditing: false,
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Gallery Permission", "Gallery permission is required to select photos.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          quality: 0.7,
          allowsEditing: false,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });
      }
      if (!result.canceled && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      Alert.alert("Error", "Could not access camera or gallery.");
    } finally {
      setIsPickingImage(false);
    }
  }, []);

  const handlePhotoAction = useCallback(() => {
    if (Platform.OS === "web") {
      handlePickImage(false);
      return;
    }
    Alert.alert("Add Receipt Photo", "Choose a source", [
      { text: "Camera", onPress: () => handlePickImage(true) },
      { text: "Gallery", onPress: () => handlePickImage(false) },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [handlePickImage]);

  const handleSave = useCallback(async () => {
    if (!date) return;
    const incomeNum = parseFloat(income.replace(/,/g, "")) || 0;
    const expenseNum = parseFloat(expense.replace(/,/g, "")) || 0;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    try {
      await setEntry({
        date,
        income: incomeNum,
        expense: expenseNum,
        tags: selectedTags,
        photoUri,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      Alert.alert("Error", "Failed to save entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [date, income, expense, selectedTags, photoUri, setEntry]);

  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      {/* Pill/handle area */}
      <View style={styles.topArea}>
        <View style={styles.grabberLine} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: bottomPadding + 24 }}
      >
        {/* Date Header */}
        <View style={styles.dateHeader}>
          <View style={styles.dateIconWrap}>
            <Ionicons name="calendar" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.dateText}>{date ? formatDateDisplay(date) : ""}</Text>
        </View>

        {/* Income Input */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: Colors.profitGreen }]} />
            <Text style={styles.sectionTitle}>Daily Income</Text>
          </View>
          <View style={styles.amountInputWrap}>
            <Text style={styles.amountPrefix}>MMK</Text>
            <TextInput
              style={styles.amountInput}
              value={income}
              onChangeText={setIncome}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Expense Input */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: Colors.expenseRed }]} />
            <Text style={styles.sectionTitle}>Daily Expense</Text>
          </View>
          <View style={[styles.amountInputWrap, styles.expenseInputWrap]}>
            <Text style={[styles.amountPrefix, { color: Colors.expenseRed }]}>MMK</Text>
            <TextInput
              style={[styles.amountInput, { color: Colors.expenseRed }]}
              value={expense}
              onChangeText={setExpense}
              placeholder="0"
              placeholderTextColor="#FECACA"
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Expense Tags */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: Colors.primary }]} />
            <Text style={styles.sectionTitle}>Expense Category</Text>
          </View>
          <View style={styles.tagsGrid}>
            {ALL_TAGS.map((tag) => (
              <TagButton
                key={tag}
                tag={tag}
                selected={selectedTags.includes(tag)}
                onToggle={() => toggleTag(tag)}
              />
            ))}
          </View>
        </View>

        {/* Receipt Photo */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: Colors.deepRose }]} />
            <Text style={styles.sectionTitle}>Receipt Photo</Text>
          </View>

          {photoUri ? (
            <View style={styles.photoPreviewWrap}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <Pressable
                style={styles.removePhotoBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPhotoUri(undefined);
                }}
              >
                <Ionicons name="close-circle" size={28} color={Colors.expenseRed} />
              </Pressable>
              <Pressable
                style={styles.changePhotoBtn}
                onPress={handlePhotoAction}
              >
                <Ionicons name="camera" size={16} color={Colors.white} />
                <Text style={styles.changePhotoBtnText}>Change</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.photoPickerBtn,
                pressed && { opacity: 0.8 },
                isPickingImage && styles.photoPickerBtnDisabled,
              ]}
              onPress={handlePhotoAction}
              disabled={isPickingImage}
            >
              {isPickingImage ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <View style={styles.photoPickerIcon}>
                    <Ionicons name="camera-outline" size={28} color={Colors.primary} />
                  </View>
                  <Text style={styles.photoPickerText}>Add Receipt Photo</Text>
                  <Text style={styles.photoPickerSub}>Camera or Gallery</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.saveButtonWrap, { paddingBottom: Math.max(bottomPadding, 16) }]}>
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            isSaving && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.deepRose]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButtonGradient}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Entry</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7FB",
  },
  topArea: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  grabberLine: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderPink,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderPink,
    marginBottom: 4,
  },
  dateIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.lightPink,
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.deepRose,
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  amountInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 60,
    borderWidth: 1.5,
    borderColor: "#D1FAE5",
    shadowColor: Colors.profitGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  expenseInputWrap: {
    borderColor: "#FECACA",
    shadowColor: Colors.expenseRed,
  },
  amountPrefix: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.profitGreen,
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: Colors.profitGreen,
    padding: 0,
  },
  tagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.borderPink,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  tagBtnSelected: {
    backgroundColor: Colors.lightPink,
    borderColor: Colors.primary,
  },
  tagLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  tagLabelSelected: {
    color: Colors.deepRose,
  },
  tagMm: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  tagMmSelected: {
    color: Colors.primary,
  },
  photoPickerBtn: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.borderPink,
    borderStyle: "dashed",
    padding: 20,
    alignItems: "center",
    gap: 6,
  },
  photoPickerBtnDisabled: {
    opacity: 0.7,
  },
  photoPickerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.lightPink,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  photoPickerText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  photoPickerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  photoPreviewWrap: {
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  photoPreview: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    resizeMode: "cover",
  },
  removePhotoBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: Colors.white,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  changePhotoBtn: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changePhotoBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.white,
  },
  saveButtonWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "#FFF7FB",
    borderTopWidth: 1,
    borderTopColor: Colors.borderPink,
  },
  saveButton: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
