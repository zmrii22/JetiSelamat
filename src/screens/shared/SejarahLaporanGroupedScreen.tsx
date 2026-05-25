import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dbApi } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { TempohEksportLevel, eksportLaporanTempohCsv, eksportLaporanTempohPdf } from '../../services/reportPdf';
import { LaporanHirarc } from '../../types';

type LevelView = 'tahun' | 'bulan' | 'hari';

const keyHari = (timestamp: number) => {
  const d = new Date(timestamp);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

const keyBulan = (timestamp: number) => {
  const d = new Date(timestamp);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${month}`;
};

const labelHari = (key: string) => {
  const date = new Date(`${key}T00:00:00`);
  return date.toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' });
};

const labelBulan = (key: string) => {
  const [year, month] = key.split('-').map((item) => Number(item));
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' });
};

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

const kiraStat = (list: LaporanHirarc[]) => {
  let rendah = 0;
  let sederhana = 0;
  let tinggi = 0;

  list.forEach((laporan) => {
    laporan.hazards.forEach((hazard) => {
      if (hazard.riskScore >= 15) {
        tinggi += 1;
      } else if (hazard.riskScore >= 5) {
        sederhana += 1;
      } else {
        rendah += 1;
      }
    });
  });

  return {
    laporan: list.length,
    hazard: list.reduce((sum, item) => sum + item.hazards.length, 0),
    disemak: list.filter((item) => item.reviewedAt).length,
    rendah,
    sederhana,
    tinggi,
  };
};

interface GroupedProps {
  scope: 'staff' | 'admin';
}

export const SejarahLaporanGroupedScreen = ({ scope }: GroupedProps) => {
  const { user, profile } = useAuth();
  const [laporan, setLaporan] = useState<LaporanHirarc[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [level, setLevel] = useState<LevelView>('tahun');
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [exportingKey, setExportingKey] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = dbApi.subscribeLaporan((items) => setLaporan(items));
    return () => unsubscribe();
  }, []);

  const filteredReports = useMemo(() => {
    if (scope === 'staff') {
      return laporan.filter((item) => item.inspectorUid === user?.uid);
    }

    if (!profile?.bahagian) {
      return [];
    }

    const bahagian = normalizeJetty(profile.bahagian);
    return laporan.filter((item) => normalizeJetty(item.locationName) === bahagian);
  }, [laporan, profile?.bahagian, scope, user?.uid]);

  const tahunGroups = useMemo(() => {
    const map = new Map<string, LaporanHirarc[]>();
    filteredReports.forEach((item) => {
      const year = String(new Date(item.createdAt).getFullYear());
      const list = map.get(year) ?? [];
      list.push(item);
      map.set(year, list);
    });

    return Array.from(map.entries())
      .map(([key, reports]) => ({
        key,
        label: key,
        reports,
        stat: kiraStat(reports),
      }))
      .sort((a, b) => Number(b.key) - Number(a.key));
  }, [filteredReports]);

  const bulanGroups = useMemo(() => {
    if (!selectedYear) {
      return [] as { key: string; label: string; reports: LaporanHirarc[]; stat: ReturnType<typeof kiraStat> }[];
    }

    const map = new Map<string, LaporanHirarc[]>();
    filteredReports
      .filter((item) => String(new Date(item.createdAt).getFullYear()) === selectedYear)
      .forEach((item) => {
        const key = keyBulan(item.createdAt);
        const list = map.get(key) ?? [];
        list.push(item);
        map.set(key, list);
      });

    return Array.from(map.entries())
      .map(([key, reports]) => ({
        key,
        label: labelBulan(key),
        reports,
        stat: kiraStat(reports),
      }))
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [filteredReports, selectedYear]);

  const hariGroups = useMemo(() => {
    if (!selectedMonth) {
      return [] as { key: string; label: string; reports: LaporanHirarc[]; stat: ReturnType<typeof kiraStat> }[];
    }

    const map = new Map<string, LaporanHirarc[]>();
    filteredReports
      .filter((item) => keyBulan(item.createdAt) === selectedMonth)
      .forEach((item) => {
        const key = keyHari(item.createdAt);
        const list = map.get(key) ?? [];
        list.push(item);
        map.set(key, list);
      });

    return Array.from(map.entries())
      .map(([key, reports]) => ({
        key,
        label: labelHari(key),
        reports,
        stat: kiraStat(reports),
      }))
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [filteredReports, selectedMonth]);

  const data = level === 'tahun' ? tahunGroups : level === 'bulan' ? bulanGroups : hariGroups;
  const routeDaily = scope === 'staff' ? '/(inspector)/sejarah-harian' : '/(admin)/sejarah-harian';

  const title =
    level === 'tahun'
      ? 'Sejarah Laporan'
      : level === 'bulan'
        ? `Tahun ${selectedYear}`
        : `Bulan ${selectedMonth ? labelBulan(selectedMonth) : '-'}`;

  const subtitle =
    level === 'tahun'
      ? 'Pilih tahun untuk lihat rekod laporan.'
      : level === 'bulan'
        ? 'Pilih bulan untuk lihat ringkasan laporan.'
        : 'Pilih hari untuk lihat laporan terperinci.';

  const onBack = () => {
    if (level === 'hari') {
      setLevel('bulan');
      setSelectedMonth(null);
      return;
    }

    if (level === 'bulan') {
      setLevel('tahun');
      setSelectedYear(null);
      return;
    }

    router.back();
  };

  const bukaLevelSeterusnya = (key: string) => {
    if (level === 'tahun') {
      setSelectedYear(key);
      setLevel('bulan');
      return;
    }

    if (level === 'bulan') {
      setSelectedMonth(key);
      setLevel('hari');
      return;
    }

    router.push({
      pathname: routeDaily as any,
      params: { dateKey: key },
    });
  };

  const eksport = async (
    key: string,
    label: string,
    reports: LaporanHirarc[],
    mode: 'pdf' | 'csv',
    exportLevel: TempohEksportLevel,
  ) => {
    if (reports.length === 0) {
      Alert.alert('Tiada data', 'Tiada laporan untuk dieksport.');
      return;
    }

    setExportingKey(`${key}-${mode}`);
    try {
      if (mode === 'pdf') {
        await eksportLaporanTempohPdf(reports, label, exportLevel);
      } else {
        await eksportLaporanTempohCsv(reports, label, exportLevel);
      }
    } catch (error: any) {
      Alert.alert(`Gagal eksport ${mode.toUpperCase()}`, error?.message ?? 'Sila cuba semula.');
    } finally {
      setExportingKey(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F6F8]" edges={['top']}>
      <FlatList
        className="flex-1 px-5 pt-3"
        data={data}
        keyExtractor={(item) => item.key}
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
              <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-white" onPress={onBack}>
                <Ionicons name="chevron-back" size={24} color="#0E4457" />
              </Pressable>
              <View className="ml-3 flex-1">
                <Text className="text-2xl font-bold text-[#0E4457]">{title}</Text>
                <Text className="text-sm text-[#607681]">{subtitle}</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View className="mb-3 rounded-2xl border border-[#DCE7ED] bg-white p-4">
            <Pressable onPress={() => bukaLevelSeterusnya(item.key)}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-base font-bold text-[#173B48]">{item.label}</Text>
                  <Text className="mt-1 text-xs text-[#607681]">
                    {item.stat.laporan} laporan | {item.stat.hazard} hazard | {item.stat.disemak} telah disemak
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#607681" />
              </View>
            </Pressable>

            <View className="mt-3 flex-row gap-2">
              <Pressable
                className="flex-1 flex-row items-center justify-center rounded-xl border border-[#CFE4EA] bg-white py-2.5"
                onPress={() => void eksport(item.key, item.label, item.reports, 'pdf', level)}
                disabled={exportingKey === `${item.key}-pdf`}
              >
                <Ionicons name="document-text-outline" size={15} color="#0E4457" />
                <Text className="ml-2 text-xs font-bold text-[#0E4457]">
                  {exportingKey === `${item.key}-pdf` ? 'Menjana...' : 'Eksport PDF'}
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 flex-row items-center justify-center rounded-xl border border-[#CFE4EA] bg-white py-2.5"
                onPress={() => void eksport(item.key, item.label, item.reports, 'csv', level)}
                disabled={exportingKey === `${item.key}-csv`}
              >
                <Ionicons name="grid-outline" size={15} color="#0E4457" />
                <Text className="ml-2 text-xs font-bold text-[#0E4457]">
                  {exportingKey === `${item.key}-csv` ? 'Menjana...' : 'Eksport CSV'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="mt-12 items-center rounded-2xl bg-white p-6">
            <Ionicons name="file-tray-outline" size={34} color="#8A9AA5" />
            <Text className="mt-3 text-center font-semibold text-[#607681]">Tiada sejarah laporan.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </SafeAreaView>
  );
};
