import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Text, Card } from "react-native-paper";
import { Colors } from "../theme/colors";
import {
  ChevronLeft,
  Layers,
  Navigation,
  TreeDeciduous,
  Wind,
  MapPin,
  Search,
  Leaf,
} from "lucide-react-native";
import * as Location from "expo-location";
import {
  updateLocationAQI,
  getCurrentAQI,
  PollutantComponents,
} from "../services/aqi.service";

const INITIAL_REGION = {
  latitude: 42.3601,
  longitude: -71.0589,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const STATIC_MARKERS = [
  { id: 1, lat: 42.3601, lng: -71.0589, emoji: "🌳", label: "Site A" },
  { id: 3, lat: 42.3651, lng: -71.052, emoji: "🏢", label: "EcoNGO" },
];

const getAQIColor = (aqi: number) => {
  if (aqi <= 50) return "#4CAF50"; // Good - green
  if (aqi <= 100) return "#FF9800"; // Moderate - orange
  if (aqi <= 150) return "#FF5722"; // Unhealthy sensitive - deep orange
  if (aqi <= 200) return "#F44336"; // Unhealthy - red
  return "#9C27B0"; // Very unhealthy / Hazardous - purple
};

export const Map = ({ onBack }: any) => {
  const [mapType, setMapType] = useState<"standard" | "satellite" | "hybrid">(
    "standard",
  );
  const [aqiData, setAqiData] = useState<{
    aqi: number;
    status: string;
    alert: boolean;
    components?: PollutantComponents;
  } | null>(null);
  const [aqiLoading, setAqiLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [region, setRegion] = useState(INITIAL_REGION);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn(
            "Location permission denied, falling back to city-based AQI",
          );
          // Fallback: fetch AQI by default city
          const fallback = await getCurrentAQI({ city: "delhi" });
          if (fallback) {
            setAqiData({
              aqi: fallback.aqiValue,
              status: fallback.status || "Unknown",
              alert: false,
              components: fallback.components,
            });
          }
          setAqiLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = location.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        // Center map on user location
        mapRef.current?.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          },
          1000,
        );

        // Fetch live AQI
        const result = await updateLocationAQI(latitude, longitude);
        if (result && result.success) {
          setAqiData({
            aqi: result.aqi,
            status: result.status,
            alert: result.alert,
            components: result.components,
          });
        } else {
          // Fallback to city-based
          const fallback = await getCurrentAQI();
          if (fallback) {
            setAqiData({
              aqi: fallback.aqiValue,
              status: fallback.status || "Unknown",
              alert: false,
              components: fallback.components,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching location/AQI:", error);
        // Final fallback
        const fallback = await getCurrentAQI();
        if (fallback) {
          setAqiData({
            aqi: fallback.aqiValue,
            status: fallback.status || "Unknown",
            alert: false,
            components: fallback.components,
          });
        }
      } finally {
        setAqiLoading(false);
      }
    })();
  }, []);

  const toggleGreenery = () => {
    setMapType((prev) => (prev === "standard" ? "hybrid" : "standard"));
  };

  const aqiValue = aqiData?.aqi ?? 0;
  const aqiStatus = aqiData?.status ?? "Loading...";
  const aqiColor = getAQIColor(aqiValue);

  return (
    <View style={styles.container}>
      {/* Header Overlay */}
      <View style={styles.overlayHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textSecondary} />
          <Text style={styles.searchPlaceholder}>
            Search for NGOs or Events...
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.layerBtn,
            mapType !== "standard" && styles.layerBtnActive,
          ]}
          onPress={toggleGreenery}
        >
          {mapType === "standard" ? (
            <Layers size={22} color={Colors.text} />
          ) : (
            <Leaf size={22} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Map View */}
      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          mapType={mapType}
          showsUserLocation={true}
          showsCompass={false}
        >
          {STATIC_MARKERS.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={{ latitude: marker.lat, longitude: marker.lng }}
            >
              <View style={styles.customMarker}>
                <View style={styles.markerBubble}>
                  <Text style={{ fontSize: 16 }}>{marker.emoji}</Text>
                </View>
                <Text style={styles.markerLabel}>{marker.label}</Text>
              </View>
            </Marker>
          ))}
          {/* AQI marker at user location */}
          {userLocation && aqiData && (
            <Marker
              coordinate={{
                latitude: userLocation.lat,
                longitude: userLocation.lng,
              }}
            >
              <View style={styles.customMarker}>
                <View style={[styles.markerBubble, { borderColor: aqiColor }]}>
                  <Text style={{ fontSize: 16 }}>💨</Text>
                </View>
                <Text style={[styles.markerLabel, { color: aqiColor }]}>
                  AQI {aqiValue}
                </Text>
              </View>
            </Marker>
          )}
        </MapView>

        {/* Floating Navigation Button */}
        <TouchableOpacity style={styles.locateBtn}>
          <Navigation size={22} color="#fff" />
        </TouchableOpacity>

        {/* Greenery Toggle Label (Optional) */}
        {mapType !== "standard" && (
          <View style={styles.greeneryBadge}>
            <Leaf size={14} color="#fff" />
            <Text style={styles.greeneryText}>Live Greenery View</Text>
          </View>
        )}
      </View>

      {/* Bottom Insight Card */}
      <Card style={styles.insightCard} elevation={5}>
        <View style={styles.dragHandle} />
        <View style={styles.insightHeader}>
          <View style={styles.insightTitleContainer}>
            <Text style={styles.insightTitle}>Your Location</Text>
            <Text style={styles.insightSubtitle}>
              {aqiLoading
                ? "Fetching air quality..."
                : `Air Quality: ${aqiStatus}`}
            </Text>
          </View>
          <View
            style={[
              styles.aqiBadge,
              { backgroundColor: aqiLoading ? Colors.primaryLight : aqiColor },
            ]}
          >
            {aqiLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Wind size={14} color="#fff" />
                <Text style={styles.aqiText}>{aqiValue} AQI</Text>
              </>
            )}
          </View>
        </View>

        {aqiData?.alert && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertText}>
              ⚠️ Air quality is unhealthy. Consider wearing a mask outdoors.
            </Text>
          </View>
        )}

        {/* Pollutant Breakdown */}
        {aqiData?.components && (
          <View style={styles.pollutantRow}>
            <PollutantChip
              label="PM2.5"
              value={aqiData.components.pm2_5}
              unit="μg/m³"
            />
            <PollutantChip
              label="PM10"
              value={aqiData.components.pm10}
              unit="μg/m³"
            />
            <PollutantChip
              label="O₃"
              value={aqiData.components.o3}
              unit="μg/m³"
            />
            <PollutantChip
              label="NO₂"
              value={aqiData.components.no2}
              unit="μg/m³"
            />
          </View>
        )}

        <View style={styles.statsRow}>
          <MiniStat
            icon={<TreeDeciduous size={16} color={Colors.primary} />}
            label="Sites"
            val="12"
          />
          <View style={styles.divider} />
          <MiniStat
            icon={<MapPin size={16} color="#0277BD" />}
            label="Events"
            val="5"
          />
          <View style={styles.divider} />
          <MiniStat
            icon={<Wind size={16} color="#EF6C00" />}
            label="Hotspots"
            val="2"
          />
        </View>
      </Card>
    </View>
  );
};

const MiniStat = ({ icon, label, val }: any) => (
  <View style={styles.miniStat}>
    <View style={styles.miniStatHeader}>
      {icon}
      <Text style={styles.miniStatVal}>{val}</Text>
    </View>
    <Text style={styles.miniStatLab}>{label}</Text>
  </View>
);

const PollutantChip = ({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) => (
  <View style={styles.pollutantChip}>
    <Text style={styles.pollutantLabel}>{label}</Text>
    <Text style={styles.pollutantValue}>{value.toFixed(1)}</Text>
    <Text style={styles.pollutantUnit}>{unit}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  overlayHeader: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchBar: {
    flex: 1,
    height: 48,
    backgroundColor: "#fff",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchPlaceholder: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  layerBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  layerBtnActive: {
    backgroundColor: Colors.primary,
  },

  mapArea: { flex: 1, position: "relative" },
  map: { ...StyleSheet.absoluteFillObject },

  customMarker: { alignItems: "center" },
  markerBubble: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
    elevation: 5,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: 4,
  },
  markerLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.text,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
    elevation: 2,
  },

  locateBtn: {
    position: "absolute",
    right: 20,
    bottom: 250,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  greeneryBadge: {
    position: "absolute",
    top: 90,
    left: 20,
    backgroundColor: "rgba(0, 200, 83, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    elevation: 4,
  },
  greeneryText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  insightCard: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingTop: 12,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#F0F2F5",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  insightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  insightTitleContainer: { flex: 1 },
  insightTitle: { fontSize: 20, fontWeight: "900", color: Colors.text },
  insightSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  aqiBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 8,
  },
  aqiText: { color: "#fff", fontSize: 13, fontWeight: "800" },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "#F8FAF5",
    borderRadius: 20,
    padding: 16,
    justifyContent: "space-around",
    alignItems: "center",
  },
  miniStat: { alignItems: "center" },
  miniStatHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  miniStatVal: { fontSize: 18, fontWeight: "900", color: Colors.text },
  miniStatLab: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginTop: 2,
  },
  divider: { width: 1, height: 24, backgroundColor: "#E0E4E8" },
  alertBanner: {
    backgroundColor: "#FFF3E0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  alertText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E65100",
    textAlign: "center",
  },
  pollutantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  pollutantChip: {
    flex: 1,
    backgroundColor: "#F0F4F8",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  pollutantLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  pollutantValue: {
    fontSize: 15,
    fontWeight: "900",
    color: Colors.text,
  },
  pollutantUnit: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 1,
  },
});
