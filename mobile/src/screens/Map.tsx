import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Text, Card } from 'react-native-paper';
import { Colors } from '../theme/colors';
import {
    ChevronLeft,
    Layers,
    Navigation,
    TreeDeciduous,
    Wind,
    MapPin,
    Search,
    Leaf
} from 'lucide-react-native';

const INITIAL_REGION = {
    latitude: 42.3601,
    longitude: -71.0589,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
};

const MARKERS = [
    { id: 1, lat: 42.3601, lng: -71.0589, emoji: "🌳", label: "Site A" },
    { id: 2, lat: 42.3551, lng: -71.0650, emoji: "💨", label: "AQI 42" },
    { id: 3, lat: 42.3651, lng: -71.0520, emoji: "🏢", label: "EcoNGO" },
];

export const Map = ({ onBack }: any) => {
    const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');

    const toggleGreenery = () => {
        setMapType(prev => prev === 'standard' ? 'hybrid' : 'standard');
    };

    return (
        <View style={styles.container}>
            {/* Header Overlay */}
            <View style={styles.overlayHeader}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <View style={styles.searchBar}>
                    <Search size={18} color={Colors.textSecondary} />
                    <Text style={styles.searchPlaceholder}>Search for NGOs or Events...</Text>
                </View>
                <TouchableOpacity style={[styles.layerBtn, mapType !== 'standard' && styles.layerBtnActive]} onPress={toggleGreenery}>
                    {mapType === 'standard' ? (
                        <Layers size={22} color={Colors.text} />
                    ) : (
                        <Leaf size={22} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>

            {/* Map View */}
            <View style={styles.mapArea}>
                <MapView
                    style={styles.map}
                    initialRegion={INITIAL_REGION}
                    mapType={mapType}
                    showsUserLocation={true}
                    showsCompass={false}
                >
                    {MARKERS.map((marker) => (
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
                </MapView>

                {/* Floating Navigation Button */}
                <TouchableOpacity style={styles.locateBtn}>
                    <Navigation size={22} color="#fff" />
                </TouchableOpacity>

                {/* Greenery Toggle Label (Optional) */}
                {mapType !== 'standard' && (
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
                        <Text style={styles.insightTitle}>Current Area: Boston</Text>
                        <Text style={styles.insightSubtitle}>High tree density • Good AQI</Text>
                    </View>
                    <View style={styles.aqiBadge}>
                        <Wind size={14} color="#fff" />
                        <Text style={styles.aqiText}>42 AQI</Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <MiniStat icon={<TreeDeciduous size={16} color={Colors.primary} />} label="Sites" val="12" />
                    <View style={styles.divider} />
                    <MiniStat icon={<MapPin size={16} color="#0277BD" />} label="Events" val="5" />
                    <View style={styles.divider} />
                    <MiniStat icon={<Wind size={16} color="#EF6C00" />} label="Hotspots" val="2" />
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.white },
    overlayHeader: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    backBtn: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8
    },
    searchBar: {
        flex: 1,
        height: 48,
        backgroundColor: '#fff',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 12,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8
    },
    searchPlaceholder: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
    layerBtn: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8
    },
    layerBtnActive: {
        backgroundColor: Colors.primary
    },

    mapArea: { flex: 1, position: 'relative' },
    map: { ...StyleSheet.absoluteFillObject },

    customMarker: { alignItems: 'center' },
    markerBubble: {
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 20,
        elevation: 5,
        borderWidth: 2,
        borderColor: Colors.primary,
        marginBottom: 4
    },
    markerLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.text,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
        elevation: 2
    },

    locateBtn: {
        position: 'absolute',
        right: 20,
        bottom: 250,
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
    },
    greeneryBadge: {
        position: 'absolute',
        top: 90,
        left: 20,
        backgroundColor: 'rgba(0, 200, 83, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        elevation: 4
    },
    greeneryText: { color: '#fff', fontSize: 12, fontWeight: '700' },

    insightCard: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingTop: 12,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#F0F2F5',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20
    },
    insightHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
    },
    insightTitleContainer: { flex: 1 },
    insightTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
    insightSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
    aqiBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 8
    },
    aqiText: { color: '#fff', fontSize: 13, fontWeight: '800' },

    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#F8FAF5',
        borderRadius: 20,
        padding: 16,
        justifyContent: 'space-around',
        alignItems: 'center'
    },
    miniStat: { alignItems: 'center' },
    miniStatHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    miniStatVal: { fontSize: 18, fontWeight: '900', color: Colors.text },
    miniStatLab: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },
    divider: { width: 1, height: 24, backgroundColor: '#E0E4E8' },
});
