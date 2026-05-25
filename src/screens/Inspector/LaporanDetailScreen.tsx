import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ImagePreviewModal } from '../../components/ImagePreviewModal';
import { formatTarikhPendek } from '../../components/DatePickerModal';
import { dbApi } from '../../config/firebase';
import { warnaRisiko } from '../../constants/risk';
import { useAuth } from '../../context/AuthContext';
import { eksportLaporanPdf } from '../../services/reportPdf';
import { LaporanHirarc, SemakanFeedback } from '../../types';
import { dapatkanKodLaporan } from '../../utils/reportCode';

const formatMasa = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString('ms-MY', {
    hour: '2-digit',
    minute: '2-digit',
  });

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

const FEEDBACK_PRESET = [
  'Sila perkemaskan kawalan hazard sebelum syif seterusnya.',
  'Bukti imej jelas dan lengkap. Teruskan amalan ini.',
  'Tindakan pembetulan perlu diselesaikan dalam tempoh 24 jam.',
  'Sila tambah papan tanda amaran di lokasi hazard.',
];

export const LaporanDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();
  const [laporan, setLaporan] = useState<LaporanHirarc[]>([]);
  const [previewState, setPreviewState] = useState<{ visible: boolean; images: string[]; index: number }>({
    visible: false,
    images: [],
    index: 0,
  });
  const [saving, setSaving] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const unsubscribe = dbApi.subscribeLaporan((items) => setLaporan(items));
    return () => unsubscribe();
  }, []);

  const detail = useMemo(() => laporan.find((item) => item.id === id), [id, laporan]);
  const feedbacks = useMemo(() => {
    const raw = detail?.feedbacks;
    if (!raw) {
      return [];
    }
    return (Array.isArray(raw) ? raw : Object.values(raw as any)) as SemakanFeedback[];
  }, [detail?.feedbacks]);

  const kodLaporan = useMemo(
    () =>
      detail
        ? dapatkanKodLaporan({
            id: detail.id,
            locationName: detail.locationName,
            createdAt: detail.createdAt,
            reportCode: detail.reportCode,
          })
        : '-',
    [detail],
  );

  const role = profile?.role;
  const bolehSemak = (role === 'admin' || role === 'master_admin') && !!detail && !detail.reviewedAt;

  const sahkanSemakan = async () => {
    if (!detail || !user) {
      return;
    }
    const mesej = feedbackInput.trim();
    if (!mesej) {
      setFeedbackError('Maklum balas wajib diisi sebelum semakan disahkan.');
      Alert.alert('Maklum balas diperlukan', 'Sila isi maklum balas sebelum sahkan semakan.');
      return;
    }
    setFeedbackError('');

    setSaving(true);
    try {
      await dbApi.tambahFeedbackLaporan(detail.id, {
        adminUid: user.uid,
        adminEmail: user.email ?? '-',
        mesej,
      });
      await dbApi.sahkanSemakanLaporan(detail.id, user.uid, user.email ?? '-', { wajibFeedback: true });
      setFeedbackInput('');
      setFeedbackError('');
      Alert.alert('Semakan disahkan', 'Status laporan telah dikemaskini.');
    } catch (error: any) {
      Alert.alert('Gagal sahkan', error.message ?? 'Sila cuba semula.');
    } finally {
      setSaving(false);
    }
  };

  const eksportPdf = async () => {
    if (!detail) {
      return;
    }

    setExporting(true);
    try {
      await eksportLaporanPdf(detail, profile?.namaPenuh);
    } catch (error: any) {
      Alert.alert('Gagal eksport PDF', error.message ?? 'Tidak dapat jana PDF laporan.');
    } finally {
      setExporting(false);
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
            <Text className="text-2xl font-bold text-[#0E4457]">Detail Laporan</Text>
            <Text className="text-sm text-[#607681]">Butiran lengkap laporan HIRARC.</Text>
          </View>
        </View>

        {!detail ? (
          <View className="mt-12 items-center rounded-2xl bg-white p-6">
            <Ionicons name="file-tray-outline" size={34} color="#8A9AA5" />
            <Text className="mt-3 font-semibold text-[#607681]">Laporan tidak dijumpai.</Text>
          </View>
        ) : (
          <FlatList
            className="mt-5"
            data={detail.hazards}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
              <View className="mb-4 rounded-[28px] bg-[#0E4457] p-5">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-sm font-semibold text-[#BFE4E0]">Lokasi Jeti</Text>
                    <Text className="mt-1 text-2xl font-bold text-white">{detail.locationName}</Text>
                    <Text className="mt-1 text-xs font-semibold text-[#BFE4E0]">ID Laporan: {kodLaporan}</Text>
                    <Text className="mt-2 text-xs text-[#D7EEF2]">Pemeriksa: {detail.inspectorEmail}</Text>
                  </View>
                  <View className={`rounded-full px-3 py-1 ${detail.reviewedAt ? 'bg-[#DCFCE7]' : 'bg-[#FEE2E2]'}`}>
                    <Text className={`text-[10px] font-bold ${detail.reviewedAt ? 'text-[#15803D]' : 'text-[#B42318]'}`}>
                      {detail.reviewedAt ? 'SUDAH DISEMAK' : 'BELUM DISEMAK'}
                    </Text>
                  </View>
                </View>

                <View className="mt-4 flex-row gap-3">
                  <View className="flex-1 rounded-2xl bg-white/15 p-3">
                    <Ionicons name="calendar-outline" size={19} color="#FFFFFF" />
                    <Text className="mt-2 text-xs text-[#D7EEF2]">Tarikh</Text>
                    <Text className="font-bold text-white">{formatTarikhPendek(detail.createdAt)}</Text>
                  </View>
                  <View className="flex-1 rounded-2xl bg-white/15 p-3">
                    <Ionicons name="time-outline" size={19} color="#FFFFFF" />
                    <Text className="mt-2 text-xs text-[#D7EEF2]">Masa</Text>
                    <Text className="font-bold text-white">{formatMasa(detail.createdAt)}</Text>
                  </View>
                </View>

                <View className="mt-3 rounded-2xl bg-white/15 p-3">
                  <Text className="text-xs text-[#D7EEF2]">Status Semakan</Text>
                  <Text className={`mt-1 font-bold ${detail.reviewedAt ? 'text-[#BBF7D0]' : 'text-[#FECACA]'}`}>
                    {detail.reviewedAt ? `Telah disemak pada ${formatTarikhMasa(detail.reviewedAt)}` : 'Belum disemak oleh admin'}
                  </Text>
                  {detail.reviewedByEmail ? <Text className="mt-1 text-xs text-[#D7EEF2]">Admin: {detail.reviewedByEmail}</Text> : null}
                  {feedbacks.length > 0 ? (
                    <View className="mt-2 rounded-xl bg-white/10 p-2.5">
                      <Text className="text-[11px] font-semibold text-[#D7EEF2]">Maklum balas terkini</Text>
                      <Text className="mt-1 text-xs text-white">{feedbacks[feedbacks.length - 1]?.mesej}</Text>
                    </View>
                  ) : null}
                </View>

                <Pressable
                  className="mt-4 flex-row items-center justify-center rounded-2xl border border-white/35 bg-white/10 p-4"
                  disabled={exporting}
                  onPress={() => void eksportPdf()}
                >
                  <Ionicons name="document-text-outline" size={19} color="#FFFFFF" />
                  <Text className="ml-2 font-bold text-white">{exporting ? 'Menjana PDF...' : 'Eksport PDF'}</Text>
                </Pressable>

                {bolehSemak ? (
                  <View className="mt-4 rounded-2xl border border-white/25 bg-white/10 p-3">
                    <Text className="text-sm font-bold text-white">Maklum Balas Admin</Text>
                    <Text className="mt-1 text-xs text-[#D7EEF2]">
                      Isi maklum balas dan sahkan semakan sekali gus.
                    </Text>

                    <Pressable
                      className="mt-3 flex-row items-center justify-between rounded-xl border border-white/25 bg-white/10 px-3 py-2.5"
                      disabled={saving}
                      onPress={() => setPresetModalOpen(true)}
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="list-outline" size={16} color="#FFFFFF" />
                        <Text className="ml-2 text-xs font-semibold text-white">Pilih Teks Pantas</Text>
                      </View>
                      <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
                    </Pressable>

                    <View className="mt-3 rounded-xl border border-white/25 bg-white/10 px-3 py-2">
                      <View className="flex-row items-start">
                        <TextInput
                          value={feedbackInput}
                          onChangeText={(text) => {
                            setFeedbackInput(text);
                            if (feedbackError && text.trim()) {
                              setFeedbackError('');
                            }
                          }}
                          placeholder="Tulis maklum balas semakan..."
                          placeholderTextColor="#D7EEF2"
                          className="flex-1 text-sm text-white"
                          multiline
                        />
                        {feedbackInput.trim() ? (
                          <Pressable
                            className="ml-2 h-7 w-7 items-center justify-center rounded-full bg-white/20"
                            onPress={() => setFeedbackInput('')}
                          >
                            <Ionicons name="close" size={14} color="#FFFFFF" />
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                    {feedbackError ? <Text className="mt-2 text-xs font-semibold text-[#FECACA]">{feedbackError}</Text> : null}

                    <Pressable
                      className="mt-3 flex-row items-center justify-center rounded-xl bg-[#0C7A72] py-3"
                      disabled={saving}
                      onPress={() => void sahkanSemakan()}
                    >
                      <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                      <Text className="ml-2 text-sm font-bold text-white">
                        {saving ? 'Menyimpan...' : 'Sahkan Semakan '}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            }
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item, index }) => {
              const images = item.buktiImejUrls?.length ? item.buktiImejUrls : item.buktiImejUrl ? [item.buktiImejUrl] : [];
              return (
                <View className="mb-4 rounded-2xl border border-[#DCE7ED] bg-white p-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-xs font-bold text-[#0C7A72]">Hazard #{index + 1}</Text>
                      <Text className="mt-1 text-lg font-bold text-[#173B48]">{item.hazardName}</Text>
                    </View>
                    <View className="rounded-full px-3 py-1" style={{ backgroundColor: warnaRisiko(item.riskScore) }}>
                      <Text className="text-xs font-bold text-white">{item.riskLevel}</Text>
                    </View>
                  </View>

                  <View className="mt-3 rounded-2xl bg-[#F6FAFB] p-3">
                    <Text className="text-xs text-[#607681]">Aktiviti</Text>
                    <Text className="font-bold text-[#173B48]">{item.activityName}</Text>
                    <Text className="mt-3 text-xs text-[#607681]">Kluster</Text>
                    <Text className="font-bold text-[#173B48]">{item.clusterName}</Text>
                    <Text className="mt-3 text-xs text-[#607681]">Skor Risiko</Text>
                    <Text className="font-bold text-[#173B48]">{item.riskScore}</Text>
                  </View>

                  <Text className="mt-3 text-sm leading-5 text-[#4B5F6C]">Cadangan: {item.recommendation}</Text>

                  {images.length > 0 ? (
                    <View className="mt-3 rounded-2xl border border-[#DCE7ED] bg-white p-3">
                      <Text className="font-bold text-[#173B48]">Bukti Imej</Text>
                      <View className="mt-3 flex-row flex-wrap gap-2">
                        {images.map((uri) => (
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
                        ))}
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            }}
          />
        )}

        <ImagePreviewModal
          visible={previewState.visible}
          images={previewState.images}
          initialIndex={previewState.index}
          onClose={() => setPreviewState((prev) => ({ ...prev, visible: false }))}
        />

        <Modal visible={presetModalOpen} transparent animationType="fade" onRequestClose={() => setPresetModalOpen(false)}>
          <View className="flex-1 items-center justify-center bg-black/45 px-6">
            <View className="w-full rounded-2xl bg-white p-4">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-lg font-bold text-[#0E4457]">Pilih Teks Pantas</Text>
                <Pressable
                  className="h-8 w-8 items-center justify-center rounded-full bg-[#EEF4F6]"
                  onPress={() => setPresetModalOpen(false)}
                >
                  <Ionicons name="close" size={16} color="#0E4457" />
                </Pressable>
              </View>

              {FEEDBACK_PRESET.map((preset) => (
                <Pressable
                  key={preset}
                  className="mb-2 rounded-xl border border-[#DCE7ED] bg-[#F8FBFC] p-3"
                  onPress={() => {
                    setFeedbackInput(preset);
                    setPresetModalOpen(false);
                  }}
                >
                  <Text className="text-sm text-[#173B48]">{preset}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};
