import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from "react-native";
import { Text, Card } from "react-native-paper";
import { Colors } from "../theme/colors";
import {
  ChevronLeft,
  Leaf,
  TrendingDown,
  Lightbulb,
} from "lucide-react-native";
import {
  logActivity,
  getWeeklySummary,
  getEcoTips,
} from "../services/activity.service";

// ── Activity definitions ──
const ACTIVITY_OPTIONS = [
  {
    category: "transport",
    label: "🚗 Transport",
    color: "#1565C0",
    bgColor: "#E3F2FD",
    items: [
      { activity: "drove_car", label: "🚗 Car", unit: "km", icon: "🚗" },
      {
        activity: "public_transport",
        label: "🚌 Bus/Train",
        unit: "km",
        icon: "🚌",
      },
      { activity: "motorbike", label: "🏍️ Motorbike", unit: "km", icon: "🏍️" },
      {
        activity: "cycled_walked",
        label: "🚲 Cycle/Walk",
        unit: "km",
        icon: "🚲",
      },
    ],
  },
  {
    category: "food",
    label: "🍽️ Food",
    color: "#E65100",
    bgColor: "#FFF3E0",
    items: [
      { activity: "meat_meal", label: "🥩 Meat", unit: "meals", icon: "🥩" },
      {
        activity: "vegetarian_meal",
        label: "🥗 Veg",
        unit: "meals",
        icon: "🥗",
      },
      { activity: "vegan_meal", label: "🌱 Vegan", unit: "meals", icon: "🌱" },
    ],
  },
  {
    category: "energy",
    label: "⚡ Energy",
    color: "#F9A825",
    bgColor: "#FFFDE7",
    items: [
      { activity: "ac_usage", label: "❄️ AC", unit: "hrs", icon: "❄️" },
      { activity: "geyser_usage", label: "🚿 Geyser", unit: "hrs", icon: "🚿" },
      {
        activity: "washing_machine",
        label: "👕 Washer",
        unit: "loads",
        icon: "👕",
      },
    ],
  },
  {
    category: "waste",
    label: "♻️ Waste",
    color: "#2E7D32",
    bgColor: "#E8F5E9",
    items: [
      { activity: "recycled", label: "♻️ Recycle", unit: "kg", icon: "♻️" },
      { activity: "composted", label: "🪱 Compost", unit: "kg", icon: "🪱" },
    ],
  },
];

export const EcoTracker = ({ onBack }: any) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<{
    category: string;
    activity: string;
    label: string;
    unit: string;
  } | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [summary, setSummary] = useState<any>(null);
  const [tips, setTips] = useState<any[]>([]);
  const [tipsLoading, setTipsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, tipsRes] = await Promise.all([
        getWeeklySummary(),
        getEcoTips(),
      ]);
      if (summaryRes?.data) setSummary(summaryRes.data);
      if (tipsRes?.data?.tips) setTips(tipsRes.data.tips);
    } catch (err) {
      console.warn("Error fetching eco data:", err);
    } finally {
      setTipsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogActivity = async () => {
    if (!selectedActivity) return;
    const value = parseFloat(inputValue);
    if (isNaN(value) || value <= 0) {
      Alert.alert("Invalid Value", "Please enter a positive number.");
      return;
    }

    setLoading(true);
    try {
      const result = await logActivity({
        category: selectedActivity.category,
        activity: selectedActivity.activity,
        value,
      });
      Alert.alert(
        result.isOffset ? "🌿 Offset Logged!" : "📊 Activity Logged!",
        result.message,
      );
      setSelectedActivity(null);
      setInputValue("");
      fetchData(); // Refresh summary
    } catch (error: any) {
      Alert.alert(
        "Error",
        typeof error === "string" ? error : "Failed to log activity",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingTop: 20,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#F0F2F5",
        }}
      >
        <TouchableOpacity onPress={onBack} style={{ marginRight: 12 }}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: "900", color: Colors.text }}>
            Eco Tracker
          </Text>
          <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
            Track daily habits, get personalized tips
          </Text>
        </View>
        <Leaf size={28} color={Colors.primary} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }}
          />
        }
      >
        {/* ── Weekly Summary Card ── */}
        {summary && (
          <Card
            style={{
              backgroundColor: "#fff",
              borderRadius: 20,
              marginBottom: 20,
              elevation: 3,
            }}
          >
            <View style={{ padding: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <TrendingDown size={20} color={Colors.primary} />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: Colors.text,
                  }}
                >
                  This Week
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#FFEBEE",
                    borderRadius: 14,
                    padding: 14,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "900",
                      color: "#D32F2F",
                    }}
                  >
                    {summary.totalCarbon.toFixed(1)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: "#D32F2F",
                      marginTop: 2,
                    }}
                  >
                    kg CO₂ emitted
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#E8F5E9",
                    borderRadius: 14,
                    padding: 14,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "900",
                      color: "#2E7D32",
                    }}
                  >
                    {summary.totalOffset.toFixed(1)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: "#2E7D32",
                      marginTop: 2,
                    }}
                  >
                    kg CO₂ offset
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#F3E5F5",
                    borderRadius: 14,
                    padding: 14,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "900",
                      color: "#7B1FA2",
                    }}
                  >
                    {summary.totalLogs}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: "#7B1FA2",
                      marginTop: 2,
                    }}
                  >
                    activities
                  </Text>
                </View>
              </View>

              {/* Net carbon */}
              <View
                style={{
                  marginTop: 14,
                  backgroundColor:
                    summary.netCarbon <= 0 ? "#E8F5E9" : "#FFF3E0",
                  borderRadius: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    color: summary.netCarbon <= 0 ? "#2E7D32" : "#E65100",
                    fontSize: 13,
                  }}
                >
                  Net Carbon
                </Text>
                <Text
                  style={{
                    fontWeight: "900",
                    color: summary.netCarbon <= 0 ? "#2E7D32" : "#E65100",
                    fontSize: 16,
                  }}
                >
                  {summary.netCarbon <= 0 ? "🌿 " : "📊 "}
                  {summary.netCarbon.toFixed(1)} kg CO₂
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* ── Quick Log ── */}
        <Text
          style={{
            fontSize: 16,
            fontWeight: "800",
            color: Colors.text,
            marginBottom: 12,
          }}
        >
          📝 Log Activity
        </Text>

        {ACTIVITY_OPTIONS.map((group) => (
          <View key={group.category} style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: group.color,
                marginBottom: 8,
              }}
            >
              {group.label}
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {group.items.map((item) => {
                const isSelected = selectedActivity?.activity === item.activity;
                return (
                  <TouchableOpacity
                    key={item.activity}
                    style={{
                      backgroundColor: isSelected ? group.color : group.bgColor,
                      borderRadius: 14,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderWidth: isSelected ? 0 : 1.5,
                      borderColor: group.color + "40",
                      minWidth: 80,
                      alignItems: "center",
                    }}
                    onPress={() =>
                      setSelectedActivity(
                        isSelected
                          ? null
                          : {
                              category: group.category,
                              activity: item.activity,
                              label: item.label,
                              unit: item.unit,
                            },
                      )
                    }
                  >
                    <Text style={{ fontSize: 22, marginBottom: 4 }}>
                      {item.icon}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "800",
                        color: isSelected ? "#fff" : group.color,
                      }}
                    >
                      {item.label.split(" ")[1]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Value input + Submit */}
        {selectedActivity && (
          <Card
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              marginBottom: 20,
              elevation: 2,
            }}
          >
            <View style={{ padding: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: Colors.text,
                  marginBottom: 10,
                }}
              >
                {selectedActivity.label} — How much?
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <TextInput
                  style={{
                    flex: 1,
                    height: 48,
                    backgroundColor: "#F8FAF5",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    fontSize: 16,
                    fontWeight: "700",
                    borderWidth: 1,
                    borderColor: "#E0E4E8",
                  }}
                  placeholder={`Enter ${selectedActivity.unit}`}
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  value={inputValue}
                  onChangeText={setInputValue}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: Colors.textSecondary,
                  }}
                >
                  {selectedActivity.unit}
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.primary,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                  marginTop: 12,
                }}
                onPress={handleLogActivity}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}
                  >
                    Log Activity
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* ── Eco Tips ── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
            marginTop: 4,
          }}
        >
          <Lightbulb size={20} color="#F9A825" />
          <Text style={{ fontSize: 16, fontWeight: "800", color: Colors.text }}>
            Your Eco Tips
          </Text>
        </View>

        {tipsLoading ? (
          <ActivityIndicator
            size="large"
            color={Colors.primary}
            style={{ padding: 30 }}
          />
        ) : tips.length === 0 ? (
          <Card
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              elevation: 1,
            }}
          >
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 32,
                  marginBottom: 8,
                }}
              >
                📝
              </Text>
              <Text
                style={{
                  color: Colors.textSecondary,
                  textAlign: "center",
                  fontSize: 13,
                }}
              >
                Start logging activities to get personalized eco tips!
              </Text>
            </View>
          </Card>
        ) : (
          tips.map((tip, index) => (
            <Card
              key={index}
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                marginBottom: 10,
                elevation: 1,
                borderLeftWidth: 4,
                borderLeftColor:
                  tip.savingsKg > 0
                    ? "#4CAF50"
                    : tip.icon === "🏆"
                      ? "#FFD700"
                      : "#E3F2FD",
              }}
            >
              <View
                style={{
                  padding: 16,
                  flexDirection: "row",
                  gap: 12,
                }}
              >
                <Text style={{ fontSize: 28 }}>{tip.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "800",
                      color: Colors.text,
                      marginBottom: 4,
                    }}
                  >
                    {tip.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: Colors.textSecondary,
                      lineHeight: 18,
                    }}
                  >
                    {tip.description}
                  </Text>
                  {tip.savingsKg > 0 && (
                    <View
                      style={{
                        marginTop: 8,
                        backgroundColor: "#E8F5E9",
                        borderRadius: 8,
                        paddingVertical: 4,
                        paddingHorizontal: 10,
                        alignSelf: "flex-start",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "800",
                          color: "#2E7D32",
                        }}
                      >
                        💚 Save ~{tip.savingsKg.toFixed(1)} kg CO₂
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
};
