import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dbApi } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { eksportLaporanHarianCsv, eksportLaporanHarianPdf } from '../../services/reportPdf';
import { LaporanHirarc } from '../../types';
import { dapatkanKodLaporan } from '../../utils/reportCode';

const formatTarikh = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'long',
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

const keyFor = (timestamp: number) => {
  const d = new Date(timestamp);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

interface Props {
  scope: 'staff' | 'admin';
}

export const SejarahLaporanHarianScreen = ({ scope }: Props) => {
  const { dateKey, risk } = useLocalSearchParams<{ dateKey: string; risk?: string }>();
  const { user, profile } = useAuth();
  const [laporan, setLaporan] = useState<LaporanHirarc[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [carian, setCarian] = useState('');

  useEffect(() => {
    const unsubscribe = dbApi.subscribeLaporan((items) => setLaporan(items));
    return () => unsubscribe();
  }, []);

  const reports = useMemo(() => {
    let base = laporan;
    if (scope === 'staff') {
      base = base.filter((item) => item.inspectorUid === user?.uid);
    } else {
      const bahagian = normalizeJetty(profile?.bahagian);
      base = base.filter((item) => normalizeJetty(item.locationName) === bahagian);
    }
    return base
      .filter((item) => keyFor(item.createdAt) === dateKey)
      .filter((item) => {
        if (!carian.trim()) {
          return true;
        }
        const q = carian.trim().toLowerCase();
        const reportCode = dapatkanKodLaporan({
          id: item.id,
          locationName: item.locationName,
          createdAt: item.createdAt,
          reportCode: item.reportCode,
        }).toLowerCase();
        const hazardText = item.hazards
          .map((hazard) => `${hazard.hazardName} ${hazard.activityName} ${hazard.clusterName}`)
          .join(' ')
          .toLowerCase();
        return reportCode.includes(q) || item.locationName.toLowerCase().includes(q) || hazardText.includes(q);
      })
      .filter((item) => {
        if (!risk) return true;
        const riskValue = risk.toString().toLowerCase();
        if (riskValue === 'tinggi') {
          return item.hazards.some((hazard) => hazard.riskScore >= 15);
        }
        if (riskValue === 'sederhana') {
          return item.hazards.some((hazard) => hazard.riskScore >= 5 && hazard.riskScore <= 12);
        }
        if (riskValue === 'rendah') {
          return item.hazards.some((hazard) => hazard.riskScore <= 4);
        }
        return true;
      })
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [carian, dateKey, laporan, profile?.bahagian, risk, scope, user?.uid]);

  const routeDetail = scope === 'staff' ? '/(inspector)/laporan-detail' : '/(admin)/laporan-detail';
  const dateTitle = reports.length > 0 ? formatTarikh(reports[0].createdAt) : dateKey;

  const eksportPdf = async () => {
    if (reports.length === 0) {
      Alert.alert('Tiada data', 'Tiada laporan untuk dieksport.');
      return;
    }

    setExportingPdf(true);
    try {
      await eksportLaporanHarianPdf(reports, dateTitle);
    } catch (error: any) {
      Alert.alert('Gagal eksport PDF', error.message ?? 'Tidak dapat jana PDF laporan harian.');
    } finally {
      setExportingPdf(false);
    }
  };

  const eksportCsv = async () => {
    if (reports.length === 0) {
      Alert.alert('Tiada data', 'Tiada laporan untuk dieksport.');
      return;
    }

    setExportingCsv(true);
    try {
      await eksportLaporanHarianCsv(reports, dateTitle);
    } catch (error: any) {
      Alert.alert('Gagal eksport CSV', error.message ?? 'Tidak dapat jana CSV laporan harian.');
    } finally {
      setExportingCsv(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F6F8]" edges={['top']}>
      <FlatList
        className="flex-1 px-5 pt-3"
        data={reports}
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
        ListHeaderComponent={
          <View className="mb-4">
            <View className="flex-row items-center">
              <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-white" onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="#0E4457" />
              </Pressable>
              <View className="ml-3 flex-1">
                <Text className="text-2xl font-bold text-[#0E4457]">{dateTitle}</Text>
                <Text className="text-sm text-[#607681]">
                  {risk ? `Laporan risiko ${risk.toString().toLowerCase()} pada tarikh ini.` : 'Laporan pada tarikh ini.'}
                </Text>
              </View>
            </View>

            <View className="mt-3 flex-row gap-2">
              <Pressable
                className="flex-1 flex-row items-center justify-center rounded-xl border border-[#CFE4EA] bg-white py-3"
                disabled={exportingPdf || reports.length === 0}
                onPress={() => void eksportPdf()}
              >
                <Ionicons name="document-text-outline" size={16} color="#0E4457" />
                <Text className="ml-2 text-xs font-bold text-[#0E4457]">{exportingPdf ? 'Menjana PDF...' : 'Eksport PDF'}</Text>
              </Pressable>
              <Pressable
                className="flex-1 flex-row items-center justify-center rounded-xl border border-[#CFE4EA] bg-white py-3"
                disabled={exportingCsv || reports.length === 0}
                onPress={() => void eksportCsv()}
              >
                <Ionicons name="grid-outline" size={16} color="#0E4457" />
                <Text className="ml-2 text-xs font-bold text-[#0E4457]">{exportingCsv ? 'Menjana CSV...' : 'Eksport CSV'}</Text>
              </Pressable>
            </View>

            <View className="mt-3 flex-row items-center rounded-xl border border-[#CFE4EA] bg-white px-3 py-2">
              <Ionicons name="search-outline" size={16} color="#607681" />
              <TextInput
                value={carian}
                onChangeText={setCarian}
                placeholder="Cari ID laporan, lokasi atau hazard"
                placeholderTextColor="#8A9AA5"
                className="ml-2 flex-1 text-sm text-[#173B48]"
              />
              {carian ? (
                <Pressable onPress={() => setCarian('')}>
                  <Ionicons name="close-circle" size={18} color="#8A9AA5" />
                </Pressable>
              ) : null}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            className="mb-3 rounded-2xl border border-[#DCE7ED] bg-white p-4"
            onPress={() =>
              router.push({
                pathname: routeDetail as any,
                params: { id: item.id },
              })
            }
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="font-bold text-[#173B48]">{item.locationName}</Text>
                <Text className="mt-1 text-[11px] font-semibold text-[#0C7A72]">
                  ID: {dapatkanKodLaporan({ id: item.id, locationName: item.locationName, createdAt: item.createdAt, reportCode: item.reportCode })}
                </Text>
                <Text className="mt-1 text-xs text-[#607681]">{item.hazards.length} hazard</Text>
              </View>
              <View className={`rounded-full px-2 py-1 ${item.reviewedAt ? 'bg-[#DCFCE7]' : 'bg-[#FEE2E2]'}`}>
                <Text className={`text-[10px] font-bold ${item.reviewedAt ? 'text-[#15803D]' : 'text-[#B42318]'}`}>
                  {item.reviewedAt ? 'Telah Disemak' : 'Belum Disemak'}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="mt-12 items-center rounded-2xl bg-white p-6">
            <Ionicons name="file-tray-outline" size={34} color="#8A9AA5" />
            <Text className="mt-3 text-center font-semibold text-[#607681]">Tiada laporan untuk tarikh ini.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </SafeAreaView>
  );
};
