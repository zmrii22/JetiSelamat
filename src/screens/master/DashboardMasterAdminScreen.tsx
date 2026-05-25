import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { dbApi } from '../../config/firebase';
import { PermohonanAdmin } from '../../types';

const formatTarikhMasa = (timestamp?: number) =>
  timestamp
    ? new Date(timestamp).toLocaleString('ms-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

export const DashboardMasterAdminScreen = () => {
  const { user, logKeluar } = useAuth();
  const [permohonan, setPermohonan] = useState<PermohonanAdmin[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    const unsub = dbApi.subscribePermohonanAdmin((list) => setPermohonan(list));
    return () => unsub();
  }, []);

  const pending = useMemo(() => permohonan.filter((item) => item.status === 'pending'), [permohonan]);
  const approved = useMemo(() => permohonan.filter((item) => item.status === 'approved'), [permohonan]);
  const rejected = useMemo(() => permohonan.filter((item) => item.status === 'rejected'), [permohonan]);
  const approvedCount = useMemo(() => permohonan.filter((item) => item.status === 'approved').length, [permohonan]);
  const rejectedCount = useMemo(() => permohonan.filter((item) => item.status === 'rejected').length, [permohonan]);
  const filtered = useMemo(() => {
    if (filterStatus === 'approved') {
      return approved;
    }

    if (filterStatus === 'rejected') {
      return rejected;
    }

    return pending;
  }, [approved, pending, rejected, filterStatus]);

  const labelFilter =
    filterStatus === 'approved' ? 'Senarai Diluluskan' : filterStatus === 'rejected' ? 'Senarai Ditolak' : 'Permohonan Admin';

  const lulus = async (uid: string) => {
    if (!user) {
      return;
    }

    try {
      await dbApi.luluskanAdmin(uid, user.uid);
      Alert.alert('Berjaya', 'Pengguna telah diluluskan sebagai admin.');
    } catch (error: any) {
      Alert.alert('Gagal luluskan', error.message ?? 'Sila cuba lagi.');
    }
  };

  const tolak = async (uid: string) => {
    if (!user) {
      return;
    }

    try {
      await dbApi.tolakAdmin(uid, user.uid);
      Alert.alert('Selesai', 'Permohonan telah ditolak.');
    } catch (error: any) {
      Alert.alert('Gagal tolak', error.message ?? 'Sila cuba lagi.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F6F8]" edges={['top']}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.uid}
        className="flex-1 px-5 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 600);
            }}
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            <View className="mb-3 flex-row justify-end">
              <Pressable
                className="flex-row items-center rounded-xl bg-[#B42318] px-4 py-2.5"
                onPress={() => {
                  void logKeluar();
                  router.replace('/log-masuk');
                }}
              >
                <Ionicons name="log-out-outline" size={16} color="#FFFFFF" />
                <Text className="ml-1 text-xs font-semibold text-white">Log Keluar</Text>
              </Pressable>
            </View>

            <View className="overflow-hidden rounded-[30px] bg-[#0E4457] p-5">
              <View className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#86D9D2]/20" />
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <Ionicons name="shield-checkmark-outline" size={24} color="#FFFFFF" />
              </View>
              <Text className="mt-4 text-2xl font-bold text-white">Master Admin</Text>
              <Text className="mt-1 text-sm leading-5 text-[#D7EEF2]">
                Semak dan luluskan permohonan pentadbir untuk semua jeti.
              </Text>
            </View>

            <View className="mt-4 flex-row gap-3">
              <Pressable
                className={`flex-1 rounded-2xl p-4 ${filterStatus === 'pending' ? 'bg-[#FFF4E5] border border-[#FED7AA]' : 'bg-white'}`}
                onPress={() => setFilterStatus('pending')}
              >
                <Ionicons name="time-outline" size={21} color="#D97706" />
                <Text className="mt-2 text-2xl font-bold text-[#0E4457]">{pending.length}</Text>
                <Text className="text-xs font-semibold text-[#607681]">Menunggu</Text>
              </Pressable>
              <Pressable
                className={`flex-1 rounded-2xl p-4 ${filterStatus === 'approved' ? 'bg-[#ECFDF3] border border-[#86EFAC]' : 'bg-white'}`}
                onPress={() => setFilterStatus('approved')}
              >
                <Ionicons name="checkmark-circle-outline" size={21} color="#16A34A" />
                <Text className="mt-2 text-2xl font-bold text-[#0E4457]">{approvedCount}</Text>
                <Text className="text-xs font-semibold text-[#607681]">Diluluskan</Text>
              </Pressable>
              <Pressable
                className={`flex-1 rounded-2xl p-4 ${filterStatus === 'rejected' ? 'bg-[#FEF2F2] border border-[#FECACA]' : 'bg-white'}`}
                onPress={() => setFilterStatus('rejected')}
              >
                <Ionicons name="close-circle-outline" size={21} color="#DC2626" />
                <Text className="mt-2 text-2xl font-bold text-[#0E4457]">{rejectedCount}</Text>
                <Text className="text-xs font-semibold text-[#607681]">Ditolak</Text>
              </Pressable>
            </View>

            <View className="mt-5 mb-2 flex-row items-center">
              <Ionicons name="people-outline" size={20} color="#0E4457" />
              <Text className="ml-2 text-lg font-bold text-[#0E4457]">{labelFilter}</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View className="mb-3 rounded-2xl border border-[#DCE7ED] bg-white p-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-base font-bold text-[#173B48]">{item.email}</Text>
                <Text className="mt-1 text-xs text-[#607681]">Mohon pada: {formatTarikhMasa(item.requestedAt)}</Text>
              </View>
              <View
                className={`rounded-full px-3 py-1 ${
                  item.status === 'approved' ? 'bg-[#DCFCE7]' : item.status === 'rejected' ? 'bg-[#FEE2E2]' : 'bg-[#FFF4E5]'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    item.status === 'approved' ? 'text-[#15803D]' : item.status === 'rejected' ? 'text-[#B42318]' : 'text-[#B45309]'
                  }`}
                >
                  {item.status === 'approved' ? 'DILULUSKAN' : item.status === 'rejected' ? 'DITOLAK' : 'PENDING'}
                </Text>
              </View>
            </View>

            {item.status === 'pending' ? (
              <View className="mt-4 flex-row gap-2">
                <Pressable className="flex-1 flex-row items-center justify-center rounded-xl bg-[#16A34A] py-3" onPress={() => void lulus(item.uid)}>
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  <Text className="ml-1 font-semibold text-white">Lulus</Text>
                </Pressable>
                <Pressable className="flex-1 flex-row items-center justify-center rounded-xl bg-[#DC2626] py-3" onPress={() => void tolak(item.uid)}>
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                  <Text className="ml-1 font-semibold text-white">Tolak</Text>
                </Pressable>
              </View>
            ) : item.status === 'approved' ? (
              <View className="mt-4">
                <Pressable className="flex-row items-center justify-center rounded-xl bg-[#DC2626] py-3" onPress={() => void tolak(item.uid)}>
                  <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
                  <Text className="ml-1 font-semibold text-white">Tukar ke Ditolak</Text>
                </Pressable>
              </View>
            ) : (
              <View className="mt-4">
                <Pressable className="flex-row items-center justify-center rounded-xl bg-[#16A34A] py-3" onPress={() => void lulus(item.uid)}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  <Text className="ml-1 font-semibold text-white">Luluskan Semula</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View className="mt-10 items-center rounded-2xl bg-white p-6">
            <Ionicons name="checkmark-done-outline" size={34} color="#8A9AA5" />
            <Text className="mt-3 text-center font-semibold text-[#607681]">
              {filterStatus === 'approved'
                ? 'Tiada rekod diluluskan.'
                : filterStatus === 'rejected'
                  ? 'Tiada rekod ditolak.'
                  : 'Tiada permohonan admin menunggu.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};
