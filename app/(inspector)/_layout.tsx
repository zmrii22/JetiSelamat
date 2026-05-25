import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { TabIcon } from '../../src/components/navigation/TabIcon';

export default function InspectorLayout() {
  const { user, profile, loading } = useAuth();
  const insets = useSafeAreaInsets();

  if (loading) {
    return null;
  }

  if (!user || !profile) {
    return <Redirect href="/log-masuk" />;
  }

  if (profile.role === 'admin') {
    return <Redirect href="/(admin)/dashboard" />;
  }

  if (profile.role === 'master_admin') {
    return <Redirect href="/(master)/dashboard" />;
  }

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#0B7D75',
        tabBarInactiveTintColor: '#6D8794',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          paddingBottom: 4,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 18,
          right: 18,
          bottom: Math.max(insets.bottom, 10) + 12,
          height: 68,
          borderTopWidth: 0,
          borderRadius: 22,
          paddingTop: 7,
          paddingBottom: 9,
          paddingHorizontal: 6,
          backgroundColor: '#FFFFFFF4',
          shadowColor: '#0A4052',
          shadowOpacity: 0.16,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 5 },
          elevation: 11,
        },
        tabBarItemStyle: {
          borderRadius: 14,
          marginHorizontal: 1,
          marginVertical: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon activeName="grid" inactiveName="grid-outline" color={color} focused={focused} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="sejarah-laporan"
        options={{
          title: 'Sejarah',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon activeName="time" inactiveName="time-outline" color={color} focused={focused} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="ruang-pengumuman"
        options={{
          title: 'Pengumuman',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon
              activeName="megaphone"
              inactiveName="megaphone-outline"
              color={color}
              focused={focused}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon
              activeName="person-circle"
              inactiveName="person-circle-outline"
              color={color}
              focused={focused}
              size={size + 1}
            />
          ),
        }}
      />
      <Tabs.Screen name="pemeriksaan-hirarc" options={{ href: null }} />
      <Tabs.Screen name="laporan-semasa" options={{ href: null }} />
      <Tabs.Screen name="sejarah-harian" options={{ href: null }} />
      <Tabs.Screen name="laporan-detail" options={{ href: null }} />
      <Tabs.Screen name="ruang-utama" options={{ href: null }} />
    </Tabs>
  );
}
