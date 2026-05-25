import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dbApi } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { LaporanHirarc } from '../../types';

const formatTarikh = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const normalizeJetty = (value?: string) => {
  if (!value) {
    return '';
  }
  const v = value.trim().toLowerCase();
  if (v.includes('besut')) return 'besut';
  if (v.includes('setiu')) return 'setiu';
  if (v.includes('tti')) return 'tti';
  return v;
};

const toDateKey = (timestamp: number) => {
  const d = new Date(timestamp);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

export const DashboardAdminScreen = () => {
  const { user, profile } = useAuth();
  const [laporan, setLaporan] = useState<LaporanHirarc[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [riskFilter, setRiskFilter] = useState<'all' | 'Rendah' | 'Sederhana' | 'Tinggi'>('all');
  const todayKey = toDateKey(Date.now());

  useEffect(() => {
    const unsub = dbApi.subscribeLaporan((items) => setLaporan(items));
    return () => unsub();
  }, []);

  const laporanDitapis = useMemo(() => {
    if (profile?.role === 'master_admin' || !profile?.bahagian) {
      return laporan;
    }

    const bahagian = normalizeJetty(profile.bahagian);
    return laporan.filter((item) => normalizeJetty(item.locationName) === bahagian);
  }, [laporan, profile?.bahagian, profile?.role]);

  const laporanHariIni = useMemo(() => {
    return laporanDitapis.filter((item) => toDateKey(item.createdAt) === todayKey);
  }, [laporanDitapis, todayKey]);

  const laporanBelumDisemakHariIni = useMemo(
    () => laporanHariIni.filter((item) => !item.reviewedAt),
    [laporanHariIni],
  );

  const laporanTerkini = useMemo(() => {
    const list = laporanBelumDisemakHariIni
      .filter((item) => {
        if (riskFilter === 'all') {
          return true;
        }

        if (riskFilter === 'Tinggi') {
          return item.hazards.some((hazard) => hazard.riskScore >= 15);
        }

        if (riskFilter === 'Sederhana') {
          return item.hazards.some((hazard) => hazard.riskScore >= 5 && hazard.riskScore <= 12);
        }

        return item.hazards.some((hazard) => hazard.riskScore <= 4);
      })
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(0, 8);

    return list;
  }, [laporanBelumDisemakHariIni, riskFilter]);

  const statistik = useMemo(() => {
    let rendah = 0;
    let sederhana = 0;
    let tinggi = 0;

    laporanBelumDisemakHariIni.forEach((report) => {
      report.hazards.forEach((hazard) => {
        if (hazard.riskScore >= 15) {
          tinggi += 1;
        } else if (hazard.riskScore >= 5) {
          sederhana += 1;
        } else {
          rendah += 1;
        }
      });
    });

    return { rendah, sederhana, tinggi };
  }, [laporanBelumDisemakHariIni]);

  const todayCount = laporanHariIni.length;

  const routeDetail = profile?.role === 'master_admin' ? '/(master)/laporan-detail' : '/(admin)/laporan-detail';

  return (
    <SafeAreaView className="flex-1 bg-[#F2F6F8]" edges={['top']}>
      <FlatList
        data={laporanTerkini}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 600);
            }}
          />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            <View className="overflow-hidden rounded-[30px] bg-[#0E4457] p-5">
              <View className="absolute -right-14 -top-10 h-32 w-32 rounded-full bg-[#86D9D2]/20" />
              <View className="flex-row items-center">
                <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-white/50 bg-white/15">
                  {profile?.avatarUrl ? (
                    <Image source={{ uri: profile.avatarUrl }} className="h-full w-full" />
                  ) : (
                    <Ionicons name="person" size={34} color="#FFFFFF" />
                  )}
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-semibold text-[#BFE4E0]">Dashboard Admin</Text>
                  <Text className="mt-1 text-xl font-bold text-white">{profile?.namaPenuh || user?.email || 'Admin JetiSelamat'}</Text>
                  <Text className="mt-1 text-sm text-[#D7EEF2]">
                    {profile?.role === 'master_admin' ? 'Semua Jeti' : profile?.bahagian ?? 'Bahagian belum dikemaskini'}
                  </Text>
                </View>
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <Ionicons name="shield-checkmark-outline" size={22} color="#FFFFFF" />
                </View>
              </View>
            </View>

            <View className="mt-4 rounded-2xl border border-[#DCE7ED] bg-white p-4">
              <Pressable
                className="flex-row items-center justify-between"
                onPress={() =>
                  router.push({
                    pathname: '/(admin)/sejarah-harian',
                    params: { dateKey: todayKey },
                  })
                }
              >
                <View>
                  <Text className="text-xs text-[#607681]">Jumlah Laporan Hari Ini</Text>
                  <Text className="mt-1 text-3xl font-bold text-[#0E4457]">{todayCount}</Text>
                  <Text className="mt-1 text-[10px] font-semibold text-[#607681]">{new Date().toLocaleString('ms-MY')}</Text>
                  <Text className="mt-1 text-[10px] font-semibold text-[#0C7A72]">Tekan untuk lihat semua laporan hari ini</Text>
                </View>
                <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#E5F5F3]">
                  <Ionicons name="documents-outline" size={27} color="#0C7A72" />
                </View>
              </Pressable>
            </View>

            <View className="mt-4 flex-row gap-3">
              <Pressable
                className={`flex-1 rounded-2xl p-4 ${riskFilter === 'Rendah' ? 'bg-[#D1FAE5] border border-[#86EFAC]' : 'bg-[#ECFDF3]'}`}
                onPress={() => setRiskFilter((prev) => (prev === 'Rendah' ? 'all' : 'Rendah'))}
              >
                <Ionicons name="checkmark-circle-outline" size={22} color="#16A34A" />
                <Text className="mt-2 text-2xl font-bold text-[#166534]">{statistik.rendah}</Text>
                <Text className="text-xs font-semibold text-[#166534]">Risiko Rendah</Text>
              </Pressable>
              <Pressable
                className={`flex-1 rounded-2xl p-4 ${riskFilter === 'Sederhana' ? 'bg-[#FEF3C7] border border-[#FCD34D]' : 'bg-[#FFFBEB]'}`}
                onPress={() => setRiskFilter((prev) => (prev === 'Sederhana' ? 'all' : 'Sederhana'))}
              >
                <Ionicons name="warning-outline" size={22} color="#D97706" />
                <Text className="mt-2 text-2xl font-bold text-[#B45309]">{statistik.sederhana}</Text>
                <Text className="text-xs font-semibold text-[#B45309]">Risiko Sederhana</Text>
              </Pressable>
              <Pressable
                className={`flex-1 rounded-2xl p-4 ${riskFilter === 'Tinggi' ? 'bg-[#FEE2E2] border border-[#FCA5A5]' : 'bg-[#FEF2F2]'}`}
                onPress={() => setRiskFilter((prev) => (prev === 'Tinggi' ? 'all' : 'Tinggi'))}
              >
                <Ionicons name="alert-circle-outline" size={22} color="#DC2626" />
                <Text className="mt-2 text-2xl font-bold text-[#B42318]">{statistik.tinggi}</Text>
                <Text className="text-xs font-semibold text-[#B42318]">Risiko Tinggi</Text>
              </Pressable>
            </View>

            <View className="mt-5 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-[#0E4457]">
                {riskFilter === 'all' ? 'Laporan Hari Ini (Belum Disemak)' : `Laporan Hari Ini - Risiko ${riskFilter} (Belum Disemak)`}
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <Pressable
            className="mt-3 rounded-2xl border border-[#DCE7ED] bg-white p-4"
            onPress={() => router.push({ pathname: routeDetail as any, params: { id: item.id } })}
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-base font-bold text-[#173B48]">{item.locationName}</Text>
                <Text className="mt-1 text-xs text-[#607681]">Pemeriksa: {item.inspectorEmail}</Text>
                <Text className="mt-1 text-xs text-[#607681]">{formatTarikh(item.createdAt)} - {item.hazards.length} hazard</Text>
              </View>
              <View className={`rounded-full px-3 py-1 ${item.reviewedAt ? 'bg-[#DCFCE7]' : 'bg-[#FEE2E2]'}`}>
                <Text className={`text-[10px] font-bold ${item.reviewedAt ? 'text-[#15803D]' : 'text-[#B42318]'}`}>
                  {item.reviewedAt ? 'TELAH DISEMAK' : 'BELUM DISEMAK'}
                </Text>
              </View>
            </View>

            <View className="mt-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name={item.hasHighRisk ? 'alert-circle' : 'checkmark-circle'} size={17} color={item.hasHighRisk ? '#DC2626' : '#16A34A'} />
                <Text className={`ml-2 text-xs font-bold ${item.hasHighRisk ? 'text-[#B42318]' : 'text-[#15803D]'}`}>
                  {item.hasHighRisk ? 'Laporan Keutamaan Tinggi' : 'Laporan Normal'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8A9AA5" />
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="mt-10 items-center rounded-2xl bg-white p-6">
            <Ionicons name="file-tray-outline" size={34} color="#8A9AA5" />
            <Text className="mt-3 text-center font-semibold text-[#607681]">
              {riskFilter === 'all' ? 'Tiada laporan hari ini.' : `Tiada laporan risiko ${riskFilter.toLowerCase()} hari ini.`}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};
