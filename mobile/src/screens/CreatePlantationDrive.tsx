import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { Colors } from "../theme/colors";
import {
  ChevronLeft,
  TreeDeciduous,
  FileText,
  User,
  Calendar,
  MapPin,
  Hash,
  Plus,
  Trash2,
  Navigation,
  Crosshair,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { createPlantationEvent } from "../services/event.service";
import { useAuthStore } from "../store/useAuthStore";
import * as Location from "expo-location";

interface BoundaryPoint {
  lat: string;
  lng: string;
}

export const CreatePlantationDrive = ({ onBack }: { onBack: () => void }) => {
  const { user } = useAuthStore();
  const [creating, setCreating] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    organizerName: user?.name || "",
    date: "",
    locationName: "",
    treesGoal: "100",
  });

  const [boundaryPoints, setBoundaryPoints] = useState<BoundaryPoint[]>([
    { lat: "", lng: "" },
    { lat: "", lng: "" },
    { lat: "", lng: "" },
    { lat: "", lng: "" },
  ]);

  const updateBoundaryPoint = (
    index: number,
    field: "lat" | "lng",
    value: string,
  ) => {
    const updated = [...boundaryPoints];
    updated[index][field] = value;
    setBoundaryPoints(updated);
  };

  const addBoundaryPoint = () => {
    setBoundaryPoints([...boundaryPoints, { lat: "", lng: "" }]);
  };

  const removeBoundaryPoint = (index: number) => {
    if (boundaryPoints.length <= 4) {
      Alert.alert("Minimum Points", "A polygon requires at least 4 points.");
      return;
    }
    setBoundaryPoints(boundaryPoints.filter((_, i) => i !== index));
  };

  const getCurrentPosition = async (): Promise<{
    lat: number;
    lng: number;
  } | null> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Needed",
        "Location access is required to use GPS features.",
      );
      return null;
    }
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return { lat: loc.coords.latitude, lng: loc.coords.longitude };
  };

  const addMyLocation = async () => {
    setGpsLoading(true);
    try {
      const pos = await getCurrentPosition();
      if (pos) {
        setBoundaryPoints([
          ...boundaryPoints,
          { lat: pos.lat.toFixed(6), lng: pos.lng.toFixed(6) },
        ]);
      }
    } finally {
      setGpsLoading(false);
    }
  };

  const autoGenerateBoundary = async () => {
    setGpsLoading(true);
    try {
      const pos = await getCurrentPosition();
      if (!pos) return;

      // Create ~100m square around current position
      const offset = 0.0009; // ~100m in degrees
      const points: BoundaryPoint[] = [
        {
          lat: (pos.lat + offset).toFixed(6),
          lng: (pos.lng - offset).toFixed(6),
        },
        {
          lat: (pos.lat + offset).toFixed(6),
          lng: (pos.lng + offset).toFixed(6),
        },
        {
          lat: (pos.lat - offset).toFixed(6),
          lng: (pos.lng + offset).toFixed(6),
        },
        {
          lat: (pos.lat - offset).toFixed(6),
          lng: (pos.lng - offset).toFixed(6),
        },
      ];
      setBoundaryPoints(points);
      Alert.alert(
        "Boundary Generated ✓",
        `Created a ~100m square boundary around your location (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}).`,
      );
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!form.title || !form.description || !form.date || !form.locationName) {
      Alert.alert(
        "Missing Fields",
        "Please fill in title, description, date, and location name.",
      );
      return;
    }

    if (form.title.length < 3) {
      Alert.alert("Invalid Title", "Title must be at least 3 characters.");
      return;
    }

    if (form.description.length < 10) {
      Alert.alert(
        "Invalid Description",
        "Description must be at least 10 characters.",
      );
      return;
    }

    // Validate boundary points
    const validPoints = boundaryPoints.filter(
      (p) => p.lat.trim() !== "" && p.lng.trim() !== "",
    );
    if (validPoints.length < 4) {
      Alert.alert(
        "Insufficient Boundary",
        "Please provide at least 4 boundary coordinate points.",
      );
      return;
    }

    const boundary: number[][] = validPoints.map((p) => [
      parseFloat(p.lng),
      parseFloat(p.lat),
    ]);

    // Check for NaN values
    if (boundary.some((coord) => isNaN(coord[0]) || isNaN(coord[1]))) {
      Alert.alert(
        "Invalid Coordinates",
        "Some boundary coordinates are invalid numbers.",
      );
      return;
    }

    setCreating(true);
    try {
      await createPlantationEvent({
        title: form.title.trim(),
        description: form.description.trim(),
        organizerName: form.organizerName.trim() || user?.name || "Anonymous",
        date: form.date.trim(),
        locationName: form.locationName.trim(),
        treesGoal: parseInt(form.treesGoal) || 100,
        boundary,
      });

      Alert.alert(
        "Plantation Drive Created! 🌳",
        "Your plantation drive is now live and ready for volunteers!",
        [{ text: "OK", onPress: onBack }],
      );
    } catch (error: any) {
      const msg =
        typeof error === "string"
          ? error
          : error?.message || "Failed to create plantation drive";
      Alert.alert("Create Failed", msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <ChevronLeft size={24} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.title}>Create Plantation Drive</Text>
              <Text style={styles.subtitle}>
                Organize a tree planting event
              </Text>
            </View>
          </View>

          {/* Hero Banner */}
          <LinearGradient
            colors={["#2E7D32", "#1B5E20"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            <TreeDeciduous size={32} color="#A5D6A7" />
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={styles.heroTitle}>Plant Trees, Save Earth</Text>
              <Text style={styles.heroSubtitle}>
                Every tree planted offsets ~21.77 kg CO₂/year
              </Text>
            </View>
          </LinearGradient>

          {/* ── Form Fields ── */}
          <Text style={styles.sectionTitle}>Event Details</Text>

          <FormField
            label="Drive Title *"
            icon={<FileText size={16} color={Colors.textSecondary} />}
            placeholder="e.g. Green Belt Plantation Drive"
            value={form.title}
            onChangeText={(v: string) => setForm({ ...form, title: v })}
          />

          <Text style={styles.formLabel}>Description *</Text>
          <TextInput
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
            placeholder="Describe the drive goals, activities, what to bring..."
            placeholderTextColor={Colors.textLight}
            multiline
            numberOfLines={4}
            mode="flat"
            style={styles.textArea}
            underlineColor="transparent"
            activeUnderlineColor={Colors.primary}
          />

          <FormField
            label="Organizer Name *"
            icon={<User size={16} color={Colors.textSecondary} />}
            placeholder={user?.name || "Your name"}
            value={form.organizerName}
            onChangeText={(v: string) => setForm({ ...form, organizerName: v })}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <FormField
                label="Date *"
                icon={<Calendar size={16} color={Colors.textSecondary} />}
                placeholder="2026-03-15"
                value={form.date}
                onChangeText={(v: string) => setForm({ ...form, date: v })}
              />
            </View>
            <View style={styles.halfField}>
              <FormField
                label="Trees Goal"
                icon={<Hash size={16} color={Colors.textSecondary} />}
                placeholder="100"
                value={form.treesGoal}
                onChangeText={(v: string) => setForm({ ...form, treesGoal: v })}
                keyboardType="numeric"
              />
            </View>
          </View>

          <FormField
            label="Location Name *"
            icon={<MapPin size={16} color={Colors.textSecondary} />}
            placeholder="e.g. Central Park, Delhi"
            value={form.locationName}
            onChangeText={(v: string) => setForm({ ...form, locationName: v })}
          />

          {/* ── Boundary Section ── */}
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>Site Boundary</Text>
          <Text style={styles.sectionHint}>
            Define the planting area polygon. Minimum 4 coordinate points
            required.
          </Text>

          {/* GPS Shortcut Buttons */}
          <View style={styles.gpsButtonRow}>
            <TouchableOpacity
              style={styles.gpsButton}
              onPress={autoGenerateBoundary}
              disabled={gpsLoading}
            >
              {gpsLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Crosshair size={16} color="#fff" />
              )}
              <Text style={styles.gpsButtonText}>Auto-generate Boundary</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.gpsButton, styles.gpsButtonSecondary]}
              onPress={addMyLocation}
              disabled={gpsLoading}
            >
              <Navigation size={16} color={Colors.primary} />
              <Text style={styles.gpsButtonSecondaryText}>Add My Location</Text>
            </TouchableOpacity>
          </View>

          {/* Boundary Points List */}
          {boundaryPoints.map((point, index) => (
            <View key={index} style={styles.boundaryRow}>
              <Text style={styles.pointLabel}>P{index + 1}</Text>
              <View style={styles.coordField}>
                <TextInput
                  value={point.lat}
                  onChangeText={(v) => updateBoundaryPoint(index, "lat", v)}
                  placeholder="Latitude"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="numeric"
                  mode="flat"
                  style={styles.coordInput}
                  underlineColor="transparent"
                  activeUnderlineColor={Colors.primary}
                />
              </View>
              <View style={styles.coordField}>
                <TextInput
                  value={point.lng}
                  onChangeText={(v) => updateBoundaryPoint(index, "lng", v)}
                  placeholder="Longitude"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="numeric"
                  mode="flat"
                  style={styles.coordInput}
                  underlineColor="transparent"
                  activeUnderlineColor={Colors.primary}
                />
              </View>
              <TouchableOpacity
                onPress={() => removeBoundaryPoint(index)}
                style={styles.removePointBtn}
              >
                <Trash2 size={16} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addPointBtn}
            onPress={addBoundaryPoint}
          >
            <Plus size={16} color={Colors.primary} />
            <Text style={styles.addPointText}>Add Point</Text>
          </TouchableOpacity>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>
              🌳 Each verified attendee contributes{" "}
              <Text style={{ fontWeight: "800", color: Colors.primary }}>
                1 tree
              </Text>{" "}
              and earns{" "}
              <Text style={{ fontWeight: "800", color: Colors.primary }}>
                +10 eco score
              </Text>
              !
            </Text>
          </View>

          {/* Submit */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={creating}
            disabled={creating}
            buttonColor="#2E7D32"
            style={styles.submitBtn}
            contentStyle={{ height: 56 }}
            labelStyle={{ fontSize: 16, fontWeight: "800" }}
          >
            🌱 Create Plantation Drive
          </Button>

          <TouchableOpacity onPress={onBack} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

/* ─── Reusable Form Field ─── */
const FormField = ({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType,
}: any) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={styles.formLabel}>{label}</Text>
    <View style={styles.inputWrapper}>
      {icon}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textLight}
        mode="flat"
        style={styles.inputField}
        underlineColor="transparent"
        activeUnderlineColor="transparent"
        keyboardType={keyboardType || "default"}
      />
    </View>
  </View>
);

/* ─── Styles ─── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 60 },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  headerText: { flex: 1, marginLeft: 15 },
  title: { fontSize: 22, fontWeight: "900", color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  // Hero Banner
  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  heroTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  heroSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 3,
  },

  // Sections
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 14,
  },
  sectionHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 14,
    marginTop: -8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },

  // Form
  formLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputField: {
    flex: 1,
    backgroundColor: "transparent",
    fontSize: 14,
    height: 46,
    marginLeft: 8,
  },
  textArea: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 14,
    paddingHorizontal: 14,
    minHeight: 90,
    textAlignVertical: "top",
    marginBottom: 14,
  },
  row: { flexDirection: "row", gap: 12 },
  halfField: { flex: 1 },

  // Boundary
  gpsButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  gpsButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  gpsButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  gpsButtonSecondary: {
    backgroundColor: Colors.primaryLight,
  },
  gpsButtonSecondaryText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  boundaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  pointLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.textSecondary,
    width: 26,
  },
  coordField: { flex: 1 },
  coordInput: {
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 13,
    height: 42,
    paddingHorizontal: 10,
  },
  removePointBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  addPointBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    marginBottom: 20,
    gap: 6,
  },
  addPointText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },

  // Info
  infoBanner: {
    backgroundColor: "#E8F5E9",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  infoText: {
    fontSize: 13,
    color: "#2E7D32",
    textAlign: "center",
    lineHeight: 20,
  },

  // Buttons
  submitBtn: {
    borderRadius: 16,
    marginBottom: 12,
    elevation: 4,
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontWeight: "700",
    fontSize: 14,
  },
});
