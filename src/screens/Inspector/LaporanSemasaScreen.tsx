import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ImagePreviewModal } from '../../components/ImagePreviewModal';
import { dbApi } from '../../config/firebase';
import { warnaRisiko } from '../../constants/risk';
import { useAuth } from '../../context/AuthContext';
import { useReportCart } from '../../context/ReportCartContext';
import { maklumAdminRisikoTinggi } from '../../services/notificationHelper';
import { PenilaianHazard } from '../../types';
import { janaKodLaporan } from '../../utils/reportCode';

const formatTarikhMasa = (timestamp: number) =>
  new Date(timestamp).toLocaleString('ms-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const LaporanSemasaScreen = () => {
  const { user } = useAuth();
  const { cart, buangDariCart, kosongkanCart } = useReportCart();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [previewState, setPreviewState] = useState<{ visible: boolean; images: string[]; index: number }>({
    visible: false,
    images: [],
    index: 0,
  });

  const hasHighRisk = useMemo(() => cart.some((item) => item.riskScore >= 15), [cart]);
  const lokasiAsas = cart[0]?.locationName ?? '-';

  const ringkasanCadangan = useMemo(() => {
    const unique = Array.from(new Set(cart.map((item) => item.recommendation).filter(Boolean)));
    return unique.slice(0, 4).map((item, index) => `${index + 1}. ${item}`).join('\n');
  }, [cart]);

  const dapatkanImej = (item: PenilaianHazard) => item.buktiImejUrls?.length ? item.buktiImejUrls : item.buktiImejUrl ? [item.buktiImejUrl] : [];

  const sahkanBuangHazard = (id: string) => {
    Alert.alert('Buang Hazard?', 'Adakah anda pasti mahu buang hazard ini daripada senarai laporan?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Buang', style: 'destructive', onPress: () => buangDariCart(id) },
    ]);
  };

  const hantarLaporan = async () => {
    if (!user) {
      Alert.alert('Sesi tamat', 'Sila log masuk semula.');
      return;
    }

    if (cart.length === 0) {
      Alert.alert('Tiada hazard', 'Tambah hazard dahulu sebelum hantar laporan.');
      return;
    }

    const campurLokasi = cart.some((item) => item.locationName !== lokasiAsas);
    if (campurLokasi) {
      Alert.alert('Lokasi bercampur', 'Hantar satu laporan untuk satu jeti sahaja.');
      return;
    }

    setLoading(true);
    try {
      const submittedAt = Date.now();
      const reportCode = janaKodLaporan(cart[0].locationName, submittedAt);
      const reportId = await dbApi.hantarLaporan({
        reportCode,
        inspectorUid: user.uid,
        inspectorEmail: user.email ?? '-',
        locationId: cart[0].locationId,
        locationName: cart[0].locationName,
        hazards: cart,
        hasHighRisk,
        createdAt: submittedAt,
      });

      if (hasHighRisk) {
        const hazardTinggi = cart
          .filter((item) => item.riskScore >= 15)
          .map((item) => item.hazardName)
          .join(', ');
        if (reportId) {
          await maklumAdminRisikoTinggi(cart[0].locationName, hazardTinggi, reportId);
        }
      }

      kosongkanCart();

      if (hasHighRisk) {
        Alert.alert(
          'Risiko Tinggi Dikesan',
          `Laporan HIRARC telah dihantar kepada admin ${cart[0].locationName}.\n\nTarikh/Masa: ${formatTarikhMasa(submittedAt)}\n\nTindakan segera dicadangkan:\n${ringkasanCadangan}`,
          [{ text: 'Faham', onPress: () => router.back() }],
        );
        return;
      }

      Alert.alert('Laporan dihantar', `Tarikh/Masa: ${formatTarikhMasa(submittedAt)}\n\nCadangan tindakan:\n${ringkasanCadangan || 'Teruskan pemantauan berkala.'}`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Gagal hantar', error.message ?? 'Tidak dapat hantar laporan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F6F8]" edges={['top']}>
      <View className="flex-1 px-5 pt-3 pb-6">
        <View className="flex-row items-center">
          <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-white" onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#0E4457" />
          </Pressable>
          <View className="ml-3 flex-1">
            <Text className="text-2xl font-bold text-[#0E4457]">Senarai Laporan</Text>
            <Text className="text-sm text-[#607681]">Semak hazard sebelum hantar laporan HIRARC.</Text>
          </View>
          <Pressable
            className={`h-11 w-11 items-center justify-center rounded-full ${cart.length === 0 ? 'bg-[#9AA8B0]' : 'bg-[#0C7A72]'}`}
            disabled={cart.length === 0 || loading}
            onPress={() => void hantarLaporan()}
          >
            <Ionicons name="send" size={19} color="#FFFFFF" />
          </Pressable>
        </View>

        <View className="mt-5 flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-white p-4">
            <Ionicons name="boat-outline" size={21} color="#0C7A72" />
            <Text className="mt-2 text-xs text-[#607681]">Lokasi</Text>
            <Text className="text-base font-bold text-[#0E4457]">{lokasiAsas}</Text>
          </View>
          <View className="w-28 rounded-2xl bg-white p-4">
            <Ionicons name="list-outline" size={21} color="#D97706" />
            <Text className="mt-2 text-xs text-[#607681]">Hazard</Text>
            <Text className="text-base font-bold text-[#0E4457]">{cart.length}</Text>
          </View>
        </View>

        {hasHighRisk ? (
          <View className="mt-4 flex-row rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4">
            <Ionicons name="alert-circle" size={22} color="#B42318" />
            <Text className="ml-2 flex-1 text-sm font-semibold leading-5 text-[#B42318]">
              Laporan ini mengandungi risiko tinggi. Semak tindakan kawalan sebelum menghantar.
            </Text>
          </View>
        ) : null}

        <FlatList
          className="mt-4"
          data={cart}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 110 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                setTimeout(() => setRefreshing(false), 600);
              }}
            />
          }
          renderItem={({ item }) => {
            const images = dapatkanImej(item);
            return (
              <View className="mb-4 rounded-2xl border border-[#DCE7ED] bg-white p-4">
                <Pressable
                  className="absolute right-3 top-3 z-10 h-8 w-8 items-center justify-center rounded-full bg-[#FEE2E2]"
                  onPress={() => sahkanBuangHazard(item.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#B42318" />
                </Pressable>

                <View className="pr-9">
                  <Text className="text-base font-bold text-[#173B48]">{item.hazardName}</Text>
                  <Text className="mt-1 text-xs text-[#607681]">{item.locationName} - {item.activityName}</Text>
                </View>

                <View className="mt-3 flex-row items-center justify-between rounded-2xl bg-[#F6FAFB] p-3">
                  <View>
                    <Text className="text-xs text-[#607681]">Skor Risiko</Text>
                    <Text className="text-lg font-bold text-[#0E4457]">{item.riskScore}</Text>
                  </View>
                  <View className="rounded-full px-3 py-1" style={{ backgroundColor: warnaRisiko(item.riskScore) }}>
                    <Text className="text-xs font-bold text-white">{item.riskLevel}</Text>
                  </View>
                </View>

                <Text className="mt-3 text-sm leading-5 text-[#4B5F6C]">Cadangan: {item.recommendation}</Text>

                <View className="mt-3 flex-row flex-wrap gap-2">
                  {images.length > 0 ? (
                    images.map((uri) => (
                      <Pressable
                        key={uri}
                        onPress={() =>
                          setPreviewState({
                            visible: true,
                            images,
                            index: images.findIndex((img) => img === uri),
                          })
                        }
                      >
                        <Image source={{ uri }} className="h-16 w-16 rounded-xl bg-[#DCE7ED]" />
                      </Pressable>
                    ))
                  ) : (
                    <View className="h-16 w-16 items-center justify-center rounded-xl bg-[#EEF4F6]">
                      <Ionicons name="image-outline" size={22} color="#8A9AA5" />
                    </View>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="mt-12 items-center rounded-2xl bg-white p-6">
              <Ionicons name="clipboard-outline" size={34} color="#8A9AA5" />
              <Text className="mt-3 text-center font-semibold text-[#607681]">Belum ada hazard dalam senarai.</Text>
              <Pressable
                className="mt-4 rounded-xl bg-[#0C7A72] px-5 py-3"
                onPress={() => router.push('/(inspector)/pemeriksaan-hirarc')}
              >
                <Text className="font-semibold text-white">Tambah Hazard</Text>
              </Pressable>
            </View>
          }
        />

        <ImagePreviewModal
          visible={previewState.visible}
          images={previewState.images}
          initialIndex={previewState.index}
          onClose={() => setPreviewState((prev) => ({ ...prev, visible: false }))}
        />
      </View>
    </SafeAreaView>
  );
};
