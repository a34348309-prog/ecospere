import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
} from "react-native";
import { Provider as PaperProvider, Text } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  Splash,
  Login,
  Signup,
  Home,
  Calculator,
  Leaderboard,
  Profile,
  Map,
  Events,
  Journey,
  KnowledgeHub,
} from "./src/screens";
import { useAuthStore } from "./src/store/useAuthStore";
import { Colors } from "./src/theme/colors";
import { LinearGradient } from "expo-linear-gradient";
import {
  connectSocket,
  disconnectSocket,
  onAQIAlert,
  onAQIUpdate,
} from "./src/services/socket.service";
import {
  Home as HomeIcon,
  Calculator as CalcIcon,
  Trophy,
  User,
  BookOpen,
} from "lucide-react-native";

const TAB_ITEMS = [
  { key: "home", label: "Home", icon: HomeIcon },
  { key: "calculator", label: "Calculate", icon: CalcIcon },
  { key: "learn", label: "Learn", icon: BookOpen },
  { key: "leaderboard", label: "Ranking", icon: Trophy },
  { key: "profile", label: "Profile", icon: User },
];

const BottomTabBar = ({ activeTab, onTabPress, onMenuPress }: any) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  const handleMenuItemPress = (screen: string) => {
    setMenuOpen(false);
    onMenuPress(screen);
  };

  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", bottom: 0, width: "100%" }}
    >
      {/* Pop-up Menu */}
      {menuOpen && (
        <View style={tabStyles.menuContainer}>
          <TouchableOpacity
            onPress={() => handleMenuItemPress("journey")}
            style={[
              tabStyles.menuItem,
              { backgroundColor: "#00C853", marginBottom: 10 },
            ]}
          >
            <Image
              source={{
                uri: "https://img.icons8.com/?size=100&id=118916&format=png&color=FFFFFF",
              }}
              style={{ width: 24, height: 24, marginRight: 8 }}
            />
            <Text style={tabStyles.menuText}>Journey</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleMenuItemPress("events")}
            style={[
              tabStyles.menuItem,
              { backgroundColor: "#00BFA5", marginBottom: 10 },
            ]}
          >
            <Image
              source={{
                uri: "https://img.icons8.com/?size=100&id=84022&format=png&color=FFFFFF",
              }}
              style={{ width: 24, height: 24, marginRight: 8 }}
            />
            <Text style={tabStyles.menuText}>Events</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleMenuItemPress("map")}
            style={[tabStyles.menuItem, { backgroundColor: "#03A9F4" }]}
          >
            <Image
              source={{
                uri: "https://img.icons8.com/?size=100&id=7880&format=png&color=FFFFFF",
              }}
              style={{ width: 24, height: 24, marginRight: 8 }}
            />
            <Text style={tabStyles.menuText}>Map</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Action Button */}
      <View style={tabStyles.centerButtonContainer}>
        <TouchableOpacity
          onPress={handleMenuToggle}
          activeOpacity={0.9}
          style={tabStyles.centerButton}
        >
          <LinearGradient
            colors={["#00C853", "#009688"]}
            style={tabStyles.centerButtonGradient}
          >
            <View style={tabStyles.plusIcon}>
              <Text
                style={{
                  fontSize: 32,
                  color: "#fff",
                  fontWeight: "300",
                  marginTop: -4,
                }}
              >
                +
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        {/* No label for FAB to avoid clutter */}
      </View>

      {/* Tab Bar Background */}
      <View style={tabStyles.container}>
        {TAB_ITEMS.map((item, index) => {
          const isActive = activeTab === item.key;
          const IconComp = item.icon;
          return (
            <TouchableOpacity
              key={item.key}
              style={tabStyles.tab}
              onPress={() => onTabPress(item.key)}
              activeOpacity={0.7}
            >
              <IconComp
                size={24}
                color={isActive ? Colors.primary : Colors.textLight}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <Text
                style={[tabStyles.label, isActive && tabStyles.labelActive]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingBottom: 20,
    paddingTop: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    height: 80,
    alignItems: "center",
  },
  tab: { flex: 1, alignItems: "center" },
  label: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 4,
    fontWeight: "600",
  },
  labelActive: { color: Colors.primary, fontWeight: "800" },
  centerButtonContainer: {
    position: "absolute",
    bottom: 90, // Positioned ABOVE the tab bar (height 80)
    alignSelf: "center",
    alignItems: "center",
    zIndex: 10,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 10,
    shadowColor: "#00C853",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  centerButtonGradient: {
    flex: 1,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  plusIcon: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    position: "absolute",
    bottom: 160, // Above the FAB
    alignSelf: "center",
    alignItems: "center",
    zIndex: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 5,
    minWidth: 140,
    justifyContent: "center",
  },
  menuText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("splash");
  const [activeTab, setActiveTab] = useState("home");
  const { user, logout } = useAuthStore();
  const [alertData, setAlertData] = useState<{
    aqi: number;
    status: string;
    message: string;
  } | null>(null);
  const alertAnim = useRef(new Animated.Value(-100)).current;

  // Socket.io: connect on login, disconnect on logout
  useEffect(() => {
    if (user?.id) {
      connectSocket(user.id);

      // Personal unhealthy AQI alerts (orange banner)
      const unsubAlert = onAQIAlert((data) => {
        setAlertData({ ...data, type: "alert" } as any);
        Animated.sequence([
          Animated.timing(alertAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.delay(5000),
          Animated.timing(alertAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => setAlertData(null));
      });

      // Tile-based AQI updates (blue info banner — only show if noteworthy)
      const unsubUpdate = onAQIUpdate((data) => {
        if (data.usersInTile > 1) {
          setAlertData({
            aqi: data.aqi,
            status: data.status,
            message: `Someone nearby updated AQI: ${data.aqi} (${data.usersInTile} users in your area)`,
            type: "update",
          } as any);
          Animated.sequence([
            Animated.timing(alertAnim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.delay(4000),
            Animated.timing(alertAnim, {
              toValue: -100,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => setAlertData(null));
        }
      });

      return () => {
        unsubAlert();
        unsubUpdate();
        disconnectSocket();
      };
    }
  }, [user?.id]);

  const isTabScreen = [
    "home",
    "calculator",
    "learn",
    "leaderboard",
    "profile",
  ].includes(currentScreen);

  const goBack = () => {
    setCurrentScreen(activeTab);
  };

  const renderScreen = () => {
    if (!user) {
      switch (currentScreen) {
        case "splash":
          return <Splash onFinish={() => setCurrentScreen("login")} />;
        case "login":
          return <Login onGoToSignup={() => setCurrentScreen("signup")} />;
        case "signup":
          return <Signup onGoToLogin={() => setCurrentScreen("login")} />;
        default:
          return <Splash onFinish={() => setCurrentScreen("login")} />;
      }
    }

    switch (currentScreen) {
      case "home":
        return (
          <Home onNavigate={(screen: string) => setCurrentScreen(screen)} />
        );
      case "calculator":
        return <Calculator />;
      case "learn":
        return <KnowledgeHub />;
      case "leaderboard":
        return <Leaderboard />;
      case "profile":
        return (
          <Profile
            onLogout={() => {
              logout();
              setCurrentScreen("login");
            }}
          />
        );
      case "map":
        return <Map onBack={goBack} />;
      case "events":
        return <Events onBack={goBack} />;
      case "journey":
        return <Journey onBack={goBack} />;
      default:
        return (
          <Home onNavigate={(screen: string) => setCurrentScreen(screen)} />
        );
    }
  };

  React.useEffect(() => {
    if (
      user &&
      (currentScreen === "login" ||
        currentScreen === "signup" ||
        currentScreen === "splash")
    ) {
      setCurrentScreen("home");
      setActiveTab("home");
    }
  }, [user]);

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    setCurrentScreen(tab);
  };

  const handleMenuPress = (screen: string) => {
    setCurrentScreen(screen);
  };

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <SafeAreaView
          style={{ flex: 1, backgroundColor: Colors.background }}
          edges={currentScreen === "splash" ? ["left", "right"] : undefined}
        >
          <View style={{ flex: 1 }}>{renderScreen()}</View>
          {/* Real-time AQI Banner (orange = alert, blue = tile update) */}
          {alertData &&
            (() => {
              const isAlert = (alertData as any).type === "alert";
              return (
                <Animated.View
                  style={[
                    alertStyles.banner,
                    {
                      transform: [{ translateY: alertAnim }],
                      backgroundColor: isAlert ? "#FFF3E0" : "#E3F2FD",
                      borderColor: isAlert ? "#FFE0B2" : "#90CAF9",
                    },
                  ]}
                >
                  <Text style={alertStyles.alertIcon}>
                    {isAlert ? "⚠️" : "📡"}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        alertStyles.alertTitle,
                        { color: isAlert ? "#E65100" : "#0D47A1" },
                      ]}
                    >
                      {isAlert
                        ? `AQI Alert — ${alertData.status}`
                        : `Area Update — AQI ${alertData.aqi}`}
                    </Text>
                    <Text
                      style={[
                        alertStyles.alertMsg,
                        { color: isAlert ? "#BF360C" : "#1565C0" },
                      ]}
                    >
                      {alertData.message}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setAlertData(null);
                      alertAnim.setValue(-100);
                    }}
                  >
                    <Text
                      style={[
                        alertStyles.dismiss,
                        { color: isAlert ? "#E65100" : "#0D47A1" },
                      ]}
                    >
                      ✕
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })()}
          {user && isTabScreen && (
            <BottomTabBar
              activeTab={activeTab}
              onTabPress={handleTabPress}
              onMenuPress={handleMenuPress}
            />
          )}
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const alertStyles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: "#FFF3E0",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#FFE0B2",
    zIndex: 999,
    gap: 12,
  },
  alertIcon: { fontSize: 24 },
  alertTitle: { fontSize: 14, fontWeight: "800", color: "#E65100" },
  alertMsg: { fontSize: 12, color: "#BF360C", marginTop: 2 },
  dismiss: { fontSize: 18, color: "#E65100", fontWeight: "700", padding: 4 },
});
