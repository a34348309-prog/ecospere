import React from "react";
import { View, StyleSheet, TouchableOpacity, Share, Alert } from "react-native";
import { Text } from "react-native-paper";
import { Colors } from "../theme/colors";
import { Share2 } from "lucide-react-native";

interface SharePlanProps {
  treesNeeded: number;
  treesReduced: number;
  co2Reduced: number;
  yearlySavings: number;
  completionPercent: number;
}

export const SharePlan = ({
  treesNeeded,
  treesReduced,
  co2Reduced,
  yearlySavings,
  completionPercent,
}: SharePlanProps) => {
  const handleShare = async () => {
    try {
      const message =
        `🌍 My EcoSphere Eco Plan Progress!\n\n` +
        `🌳 Tree Debt: ${treesNeeded} trees\n` +
        `✅ Trees Offset: ${Math.round(treesReduced)} through lifestyle changes\n` +
        `📉 CO₂ Reduced: ${co2Reduced.toLocaleString()} kg annually\n` +
        `💰 Yearly Savings: ₹${yearlySavings.toLocaleString()}\n` +
        `📊 Progress: ${completionPercent}% complete\n\n` +
        `Join EcoSphere and create your own eco plan! 🌿`;

      await Share.share({
        message,
        title: "My EcoSphere Eco Plan",
      });
    } catch (error: any) {
      if (error.message !== "User did not share") {
        Alert.alert("Error", "Could not share plan");
      }
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleShare}
      activeOpacity={0.7}
    >
      <Share2 size={18} color={Colors.primary} />
      <Text style={styles.text}>Share My Eco Plan</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0F2F1",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "#B2DFDB",
  },
  text: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
});
