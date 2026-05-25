import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { dbApi } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useReportCart } from '../../context/ReportCartContext';
import { LaporanHirarc } from '../../types';

const maklumatKeselamatan = [
  'Sentiasa pakai PPE lengkap dan ikut SOP semasa membuat pemeriksaan.',
  'Ambil gambar bukti yang jelas sebelum menghantar laporan HIRARC.',
  'Laporkan hazard risiko tinggi dengan segera kepada penyelia bertugas.',
  'Pastikan laluan penumpang, tangga bot dan kawasan tepi jeti diperiksa sebelum operasi.',
];

const peringatanKeselamatan = [
  'Semak PPE, radio komunikasi, dan kit kecemasan sebelum syif bermula.',
  'Pastikan permukaan jeti kering, anti-slip berfungsi, dan papan amaran dipasang.',
  'Uji laluan boarding: tangga bot, penghadang tepi, dan titik berkumpul kecemasan.',
  'Periksa keadaan cuaca dan hadkan operasi jika angin/ombak melebihi had selamat.',
  'Semak rekod hazard berulang, kemudian tetapkan tindakan pencegahan sebelum operasi.',
  'Ambil gambar bukti sebelum/selepas pembetulan supaya audit tindakan lebih jelas.',
  'Buat ringkasan mingguan risiko tinggi dan maklumkan isu kritikal kepada admin jeti.',
];

const toDateKey = (timestamp: number) => {
  const d = new Date(timestamp);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

export const StaffDashboardScreen = () => {
  const { user, profile } = useAuth();
  const { cart } = useReportCart();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [laporan, setLaporan] = useState<LaporanHirarc[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const todayKey = toDateKey(Date.now());

  useEffect(() => {
    const initialIndex = Math.abs(Math.floor(Date.now() / 1000)) % peringatanKeselamatan.length;
    setQuoteIndex(initialIndex);

    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % peringatanKeselamatan.length);
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = dbApi.subscribeLaporan((items) => setLaporan(items));
    return () => unsubscribe();
  }, []);

  const laporanStaff = useMemo(
    () => laporan.filter((item) => item.inspectorUid === user?.uid),
    [laporan, user?.uid],
  );

  const laporanHariIni = useMemo(() => {
    return laporanStaff.filter((item) => toDateKey(item.createdAt) === todayKey);
  }, [laporanStaff, todayKey]);

  const jumlahHazard = useMemo(
    () => laporanHariIni.reduce((total, item) => total + item.hazards.length, 0),
    [laporanHariIni],
  );

  const risikoTinggi = useMemo(
    () =>
      laporanHariIni.reduce(
        (total, item) => total + item.hazards.filter((hazard) => hazard.riskScore >= 15).length,
        0,
      ),
    [laporanHariIni],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F2F6F8]" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: tabBarHeight + Math.max(insets.bottom, 10) + 22,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 600);
            }}
          />
        }
      >
        <View className="overflow-hidden rounded-[30px] bg-[#0E4457] p-5">
          <View className="absolute -right-12 -top-10 h-32 w-32 rounded-full bg-[#86D9D2]/20" />
          <View className="absolute -bottom-14 left-10 h-28 w-28 rounded-full bg-[#FFB703]/20" />
          <View className="flex-row items-center">
            <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-white/50 bg-white/15">
              {profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} className="h-full w-full" />
              ) : (
                <Ionicons name="person" size={34} color="#FFFFFF" />
              )}
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm font-semibold text-[#BFE4E0]">Dashboard Staff</Text>
              <Text className="mt-1 text-xl font-bold text-white">{profile?.namaPenuh || 'Staff JetiSelamat'}</Text>
              <Text className="mt-1 text-sm text-[#D7EEF2]">{profile?.bahagian ?? 'Bahagian belum dikemaskini'}</Text>
            </View>
          </View>
        </View>

        <View className="mt-4 flex-row gap-3">
          <Pressable
            className="flex-1 rounded-2xl border-2 border-[#0C7A72] bg-white p-4"
            onPress={() =>
              router.push({
                pathname: '/(inspector)/sejarah-harian',
                params: { dateKey: todayKey },
              })
            }
          >
            <View className="flex-row items-center justify-between">
              <Ionicons name="document-text-outline" size={23} color="#0C7A72" />
              <Ionicons name="chevron-forward-circle" size={21} color="#0C7A72" />
            </View>
            <Text className="mt-3 text-2xl font-bold text-[#0E4457]">{laporanHariIni.length}</Text>
            <Text className="text-xs font-semibold text-[#0C7A72]">Laporan Hari Ini</Text>
            <Text className="mt-1 text-[10px] text-[#607681]">Tekan untuk lihat laporan hari ini</Text>
          </Pressable>

          <View className="flex-1 rounded-2xl border border-[#DCE7ED] bg-white p-4">
            <Ionicons name="warning-outline" size={23} color="#D97706" />
            <Text className="mt-3 text-2xl font-bold text-[#0E4457]">{jumlahHazard}</Text>
            <Text className="text-xs text-[#607681]">Jumlah Hazard</Text>
          </View>

          <Pressable
            className="flex-1 rounded-2xl border-2 border-[#FCA5A5] bg-[#FFF7F7] p-4"
            onPress={() =>
              router.push({
                pathname: '/(inspector)/sejarah-harian',
                params: { dateKey: todayKey, risk: 'tinggi' },
              })
            }
          >
            <View className="flex-row items-center justify-between">
              <Ionicons name="alert-circle" size={23} color="#DC2626" />
              <Ionicons name="chevron-forward-circle" size={19} color="#DC2626" />
            </View>
            <Text className="mt-3 text-2xl font-bold text-[#0E4457]">{risikoTinggi}</Text>
            <Text className="text-xs font-semibold text-[#B42318]">Risiko Tinggi Hari Ini</Text>
            <Text className="mt-1 text-[10px] text-[#B42318]">Tekan untuk lihat semua risiko tinggi</Text>
          </Pressable>
        </View>

        <View className="mt-4 rounded-2xl border border-[#DCE7ED] bg-white p-4">
          <View className="flex-row items-center">
            <Ionicons name="bulb-outline" size={18} color="#0C7A72" />
            <Text className="ml-2 text-sm font-bold text-[#0E4457]">Peringatan Keselamatan</Text>
          </View>
          <Text className="mt-3 text-sm leading-6 text-[#4B5F6C]">{peringatanKeselamatan[quoteIndex]}</Text>
          <View className="mt-3 flex-row items-center">
            {peringatanKeselamatan.map((_, idx) => (
              <View key={`quote-dot-${idx}`} className={`mr-1.5 h-1.5 w-1.5 rounded-full ${idx === quoteIndex ? 'bg-[#0C7A72]' : 'bg-[#C6D4DB]'}`} />
            ))}
          </View>
        </View>

        {cart.length > 0 ? (
          <View className="mt-4 rounded-2xl border border-[#FCD34D] bg-[#FFFBEB] p-4">
            <View className="flex-row items-center">
              <Ionicons name="document-attach-outline" size={20} color="#B45309" />
              <Text className="ml-2 text-sm font-bold text-[#92400E]">Sesi Draf Aktif</Text>
            </View>
            <Text className="mt-2 text-xs text-[#78350F]">
              Anda ada {cart.length} hazard belum dihantar. Sambung semula pemeriksaan sekarang.
            </Text>
            <Pressable
              className="mt-3 flex-row items-center justify-center rounded-xl bg-[#D97706] py-3"
              onPress={() => router.push('/(inspector)/laporan-semasa')}
            >
              <Ionicons name="play-circle-outline" size={18} color="#FFFFFF" />
              <Text className="ml-2 text-sm font-semibold text-white">Resume Draft</Text>
            </Pressable>
          </View>
        ) : null}

        <View className="mt-5 rounded-2xl border border-[#DCE7ED] bg-white p-4">
          <Text className="text-lg font-bold text-[#0E4457]">Maklumat Keselamatan</Text>
          {maklumatKeselamatan.map((item) => (
            <View key={item} className="mt-3 flex-row">
              <Ionicons name="checkmark-circle" size={18} color="#0C7A72" />
              <Text className="ml-2 flex-1 text-sm leading-5 text-[#4B5F6C]">{item}</Text>
            </View>
          ))}
        </View>

        <Pressable
          className="mt-5 flex-row items-center justify-center rounded-2xl bg-[#0C7A72] py-4"
          onPress={() => router.push('/(inspector)/pemeriksaan-hirarc')}
        >
          <Ionicons name="shield-checkmark-outline" size={21} color="#FFFFFF" />
          <View className="ml-2">
            <Text className="text-center text-base font-semibold text-white">Mulakan Pemeriksaan Keselamatan</Text>
            <Text className="text-center text-xs text-white/80">Borang HIRARC digital</Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};
