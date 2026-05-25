import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PickerModal } from '../../components/PickerModal';
import { dbApi } from '../../config/firebase';
import { cariCadangan, kiraRisiko, warnaRisiko } from '../../constants/risk';
import { useAuth } from '../../context/AuthContext';
import { useReportCart } from '../../context/ReportCartContext';
import { muatNaikImejCloudinary } from '../../services/cloudinary';
import { Aktiviti, DataHirarc, Hazard, Kluster, Lokasi } from '../../types';

type ModalState = 'lokasi' | 'aktiviti' | 'kluster' | 'hazard' | null;
type InfoState = 'risk' | 'kebarangkalian' | 'keterukan' | null;

const NILAI = [1, 2, 3, 4, 5];

const PANDUAN_RISIKO = [
  {
    skor: '15 - 25',
    tahap: 'TINGGI',
    tindakan: 'Tindakan segera diperlukan. Hentikan aktiviti jika perlu, laksanakan kawalan segera dan maklumkan penyelia/pengurusan.',
    color: '#DC2626',
  },
  {
    skor: '5 - 12',
    tahap: 'SEDERHANA',
    tindakan: 'Ambil tindakan kawalan yang sesuai dan rancang langkah pembetulan dalam tempoh terdekat.',
    color: '#EAB308',
  },
  {
    skor: '1 - 4',
    tahap: 'RENDAH',
    tindakan: 'Risiko boleh diterima. Teruskan pemantauan dan pastikan kawalan sedia ada dikekalkan.',
    color: '#84CC16',
  },
];

const INFO_KEBARANGKALIAN = [
  '5: SANGAT BERKEMUNGKINAN - Berlaku berterusan atau hampir tanpa henti.',
  '4: MUNGKIN - Berlaku berulang atau setiap hari.',
  '3: BOLEH BERLAKU - Berlaku sekitar sekali seminggu atau sekali-sekala.',
  '2: JARANG - Berlaku sekitar sekali sebulan atau dalam keadaan luar biasa.',
  '1: SANGAT JARANG - Berlaku sekitar sekali setahun atau amat jarang.',
];

const INFO_KETERUKAN = [
  '5: KATASTROFIK - Banyak kematian, kerosakan harta yang tidak boleh dipulihkan, serta kehilangan produktiviti besar.',
  '4: MAUT - Kira-kira satu kematian dan/atau kerosakan harta yang besar.',
  '3: SERIUS - Kecederaan tidak maut, amputasi besar, atau hilang upaya kekal.',
  '2: RINGAN - Luka kecil/sederhana, melecur, renjatan elektrik, patah ringan, atau hilang upaya sementara.',
  '1: SANGAT RINGAN - Calar/lebam kecil yang hanya perlukan rawatan asas, iritasi ringan.',
];

export const RuangUtamaScreen = () => {
  const { user, profile } = useAuth();
  const { cart, tambahKeCart } = useReportCart();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const [dataHirarc, setDataHirarc] = useState<DataHirarc>({
    locations: [],
    activities: [],
    clusters: [],
    hazards: [],
    recommendations: [],
  });

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [infoModal, setInfoModal] = useState<InfoState>(null);

  const [lokasi, setLokasi] = useState<Lokasi | null>(null);
  const [aktiviti, setAktiviti] = useState<Aktiviti | null>(null);
  const [kluster, setKluster] = useState<Kluster | null>(null);
  const [hazard, setHazard] = useState<Hazard | null>(null);

  const [kebarangkalian, setKebarangkalian] = useState(1);
  const [keterukan, setKeterukan] = useState(1);
  const [imejUris, setImejUris] = useState<string[]>([]);

  const normalisasiBahagian = (value?: string) => {
    const text = (value ?? '').toLowerCase();
    if (text.includes('tti')) return 'tti';
    if (text.includes('setiu')) return 'setiu';
    if (text.includes('besut')) return 'besut';
    return '';
  };

  const muatDataHirarc = async () => {
    try {
      const data = await dbApi.ambilDataHirarc();
      setDataHirarc(data);
    } catch (error: any) {
      Alert.alert('Gagal muat data', error.message ?? 'Tidak dapat baca data HIRARC.');
    }
  };

  useEffect(() => {
    void muatDataHirarc();
  }, []);

  useEffect(() => {
    if (!profile?.bahagian || dataHirarc.locations.length === 0) {
      return;
    }

    const bahagian = normalisasiBahagian(profile.bahagian);
    const lokasiAuto =
      dataHirarc.locations.find((item) => normalisasiBahagian(item.name) === bahagian) ?? null;

    if (lokasiAuto) {
      setLokasi(lokasiAuto);
    }
  }, [dataHirarc.locations, profile?.bahagian]);

  const hazardsUntukAktiviti = useMemo(() => {
    if (!aktiviti) {
      return [] as Hazard[];
    }

    return dataHirarc.hazards.filter((item) => item.activity_id === aktiviti.id);
  }, [aktiviti, dataHirarc.hazards]);

  const klusterUntukAktiviti = useMemo(() => {
    const klusterIdSet = new Set(hazardsUntukAktiviti.map((item) => item.cluster_id));
    return dataHirarc.clusters.filter((item) => klusterIdSet.has(item.id));
  }, [hazardsUntukAktiviti, dataHirarc.clusters]);

  const hazardsUntukKluster = useMemo(() => {
    if (!kluster) {
      return hazardsUntukAktiviti;
    }

    return hazardsUntukAktiviti.filter((item) => item.cluster_id === kluster.id);
  }, [hazardsUntukAktiviti, kluster]);

  const riskPreview = kiraRisiko(kebarangkalian, keterukan);

  const tangkapImej = async () => {
    if (imejUris.length >= 4) {
      Alert.alert('Had imej dicapai', 'Anda hanya boleh tambah maksimum 4 imej bukti untuk satu hazard.');
      return;
    }

    const izin = await ImagePicker.requestCameraPermissionsAsync();
    if (!izin.granted) {
      Alert.alert('Izin diperlukan', 'Sila benarkan kamera untuk bukti imej.');
      return;
    }

    const hasil = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
    if (!hasil.canceled && hasil.assets.length > 0) {
      setImejUris((current) => [...current, hasil.assets[0].uri].slice(0, 4));
    }
  };

  const tambahHazard = async () => {
    if (!user || !lokasi || !aktiviti || !hazard) {
      Alert.alert('Maklumat belum lengkap', 'Sila pilih lokasi, aktiviti dan hazard dahulu.');
      return;
    }

    setLoading(true);

    try {
      const klusterDipilih =
        dataHirarc.clusters.find((item) => item.id === hazard.cluster_id) ??
        kluster ?? {
          id: hazard.cluster_id,
          name: hazard.cluster_id,
        };

      const risk = kiraRisiko(kebarangkalian, keterukan);
      const recommendation = cariCadangan(hazard.name, risk.level, dataHirarc.recommendations);

      const buktiImejUrls = imejUris.length > 0 ? await Promise.all(imejUris.map((uri) => muatNaikImejCloudinary(uri))) : [];

      tambahKeCart({
        id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        locationId: lokasi.id,
        locationName: lokasi.name,
        activityId: aktiviti.id,
        activityName: aktiviti.name,
        clusterId: klusterDipilih.id,
        clusterName: klusterDipilih.name,
        hazardId: hazard.id,
        hazardName: hazard.name,
        likelihood: kebarangkalian,
        severity: keterukan,
        riskScore: risk.score,
        riskLevel: risk.level,
        recommendation,
        buktiImejUrl: buktiImejUrls[0],
        buktiImejUrls,
        createdAt: Date.now(),
      });

      setImejUris([]);
      setKluster(null);
      setHazard(null);
      setKebarangkalian(1);
      setKeterukan(1);

      Alert.alert('Berjaya', 'Hazard telah ditambah ke senarai laporan.');
    } catch (error: any) {
      Alert.alert('Gagal tambah hazard', error.message ?? 'Sila cuba semula.');
    } finally {
      setLoading(false);
    }
  };

  const FieldButton = ({
    icon,
    label,
    value,
    onPress,
  }: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    value: string;
    onPress: () => void;
  }) => (
    <Pressable className="mt-3 rounded-2xl border border-[#DCE7ED] bg-white p-4" onPress={onPress}>
      <View className="flex-row items-center">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-[#E5F5F3]">
          <Ionicons name={icon} size={20} color="#0C7A72" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-xs font-semibold text-[#607681]">{label}</Text>
          <Text className="mt-1 text-base font-bold text-[#173B48]">{value}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#8A9AA5" />
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F2F6F8]" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: tabBarHeight + Math.max(insets.bottom, 10) + 34,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void muatDataHirarc().finally(() => setRefreshing(false));
            }}
          />
        }
      >
        <View className="flex-row items-center">
          <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-white" onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#0E4457" />
          </Pressable>
          <View className="ml-3 flex-1">
            <Text className="text-2xl font-bold text-[#0E4457]">Pemeriksaan HIRARC</Text>
            <Text className="text-sm text-[#607681]">Isi borang hazard dan tambah ke senarai laporan.</Text>
          </View>
        </View>

        <View className="mt-5 overflow-hidden rounded-[28px] bg-[#0E4457] p-5">
          <View className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#86D9D2]/20" />
          <Text className="text-sm font-semibold text-[#BFE4E0]">Skor Risiko Semasa</Text>
          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-4xl font-bold text-white">{riskPreview.score}</Text>
            <View className="rounded-full px-4 py-2" style={{ backgroundColor: warnaRisiko(riskPreview.score) }}>
              <Text className="font-bold text-white">{riskPreview.level}</Text>
            </View>
          </View>
          <Text className="mt-2 text-xs text-[#D7EEF2]">
            Kebarangkalian {kebarangkalian} x Keterukan {keterukan}
          </Text>
          <Pressable
            className="mt-3 self-start rounded-full border border-white/35 bg-white/10 px-3 py-2"
            onPress={() => setInfoModal('risk')}
          >
            <View className="flex-row items-center">
              <Ionicons name="information-circle-outline" size={15} color="#FFFFFF" />
              <Text className="ml-1.5 text-xs font-bold text-white">Lihat Panduan Tindakan Sistem</Text>
            </View>
          </Pressable>
        </View>

        <View className="mt-4 rounded-[28px] border border-[#DCE7ED] bg-white p-4">
          <View className="flex-row items-center">
            <Ionicons name="reader-outline" size={22} color="#0C7A72" />
            <Text className="ml-2 text-lg font-bold text-[#0E4457]">Borang Pemeriksaan</Text>
          </View>

          <FieldButton
            icon="boat-outline"
            label="Lokasi Jeti"
            value={lokasi?.name ?? 'Pilih lokasi'}
            onPress={() => {
              if (profile?.bahagian) {
                return;
              }
              setModal('lokasi');
            }}
          />
          <FieldButton
            icon="briefcase-outline"
            label="Aktiviti"
            value={aktiviti?.name ?? 'Pilih aktiviti'}
            onPress={() => setModal('aktiviti')}
          />
          <FieldButton
            icon="layers-outline"
            label="Kluster"
            value={kluster?.name ?? 'Pilih kluster'}
            onPress={() => setModal('kluster')}
          />
          <FieldButton
            icon="warning-outline"
            label="Hazard"
            value={hazard?.name ?? 'Pilih hazard'}
            onPress={() => setModal('hazard')}
          />

          <View className="mt-5 flex-row items-center">
            <Text className="text-sm font-bold text-[#36505E]">Kebarangkalian</Text>
            <Pressable className="ml-2" onPress={() => setInfoModal('kebarangkalian')}>
              <Ionicons name="help-circle-outline" size={17} color="#0C7A72" />
            </Pressable>
          </View>
          <View className="mt-2 flex-row gap-2">
            {NILAI.map((value) => (
              <Pressable
                key={`k-${value}`}
                className={`h-11 flex-1 items-center justify-center rounded-2xl ${kebarangkalian === value ? 'bg-[#0C7A72]' : 'border border-[#DCE7ED] bg-white'}`}
                onPress={() => setKebarangkalian(value)}
              >
                <Text className={`${kebarangkalian === value ? 'text-white' : 'text-[#173B48]'} font-bold`}>{value}</Text>
              </Pressable>
            ))}
          </View>

          <View className="mt-4 flex-row items-center">
            <Text className="text-sm font-bold text-[#36505E]">Keterukan</Text>
            <Pressable className="ml-2" onPress={() => setInfoModal('keterukan')}>
              <Ionicons name="help-circle-outline" size={17} color="#0C7A72" />
            </Pressable>
          </View>
          <View className="mt-2 flex-row gap-2">
            {NILAI.map((value) => (
              <Pressable
                key={`s-${value}`}
                className={`h-11 flex-1 items-center justify-center rounded-2xl ${keterukan === value ? 'bg-[#D97706]' : 'border border-[#DCE7ED] bg-white'}`}
                onPress={() => setKeterukan(value)}
              >
                <Text className={`${keterukan === value ? 'text-white' : 'text-[#173B48]'} font-bold`}>{value}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            className="mt-5 flex-row items-center justify-center rounded-2xl border border-[#0C7A72] bg-white p-4"
            onPress={() => void tangkapImej()}
          >
            <Ionicons name={imejUris.length > 0 ? 'camera-reverse-outline' : 'camera-outline'} size={20} color="#0C7A72" />
            <Text className="ml-2 text-center font-bold text-[#0C7A72]">
              {imejUris.length > 0 ? `Tambah Imej Bukti (${imejUris.length}/4)` : 'Ambil Bukti Imej'}
            </Text>
          </Pressable>

          {imejUris.length > 0 ? (
            <View className="mt-3 rounded-2xl bg-[#F6FAFB] p-3">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-bold text-[#173B48]">Bukti imej dipilih</Text>
                  <Text className="text-xs text-[#607681]">Maksimum 4 imej untuk satu hazard.</Text>
                </View>
              </View>
              <View className="mt-3 flex-row flex-wrap gap-2">
                {imejUris.map((uri, index) => (
                  <View key={uri} className="relative">
                    <Image source={{ uri }} className="h-20 w-20 rounded-2xl bg-[#DCE7ED]" />
                    <Pressable
                      className="absolute -right-1 -top-1 h-7 w-7 items-center justify-center rounded-full bg-[#B42318]"
                      onPress={() => setImejUris((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    >
                      <Ionicons name="close" size={15} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        <Pressable className="mt-3 flex-row items-center justify-center rounded-2xl bg-[#D97706] p-4" onPress={() => void tambahHazard()}>
          <Ionicons name="add-circle-outline" size={21} color="#FFFFFF" />
          <Text className="ml-2 text-center font-bold text-white">{loading ? 'Memproses...' : 'Tambah Ke Senarai Laporan'}</Text>
        </Pressable>

        <Pressable
          className="mt-3 flex-row items-center justify-center rounded-2xl bg-[#0C7A72] p-4"
          onPress={() => router.push('/(inspector)/laporan-semasa')}
        >
          <Ionicons name="list-circle-outline" size={22} color="#FFFFFF" />
          <Text className="ml-2 text-center font-bold text-white">Lihat Senarai Laporan ({cart.length})</Text>
        </Pressable>

        <PickerModal
          visible={modal === 'lokasi'}
          title="Pilih Lokasi"
          items={dataHirarc.locations}
          onSelect={(item) => {
            const found = dataHirarc.locations.find((x) => x.id === item.id) ?? null;
            setLokasi(found);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />

        <PickerModal
          visible={modal === 'aktiviti'}
          title="Pilih Aktiviti"
          items={dataHirarc.activities}
          onSelect={(item) => {
            const found = dataHirarc.activities.find((x) => x.id === item.id) ?? null;
            setAktiviti(found);
            setKluster(null);
            setHazard(null);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />

        <PickerModal
          visible={modal === 'kluster'}
          title="Pilih Kluster"
          items={klusterUntukAktiviti}
          onSelect={(item) => {
            const found = klusterUntukAktiviti.find((x) => x.id === item.id) ?? null;
            setKluster(found);
            setHazard(null);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />

        <PickerModal
          visible={modal === 'hazard'}
          title="Pilih Hazard"
          items={hazardsUntukKluster}
          onSelect={(item) => {
            const found = hazardsUntukKluster.find((x) => x.id === item.id) ?? null;
            setHazard(found);
            if (found) {
              const clusterFound = dataHirarc.clusters.find((x) => x.id === found.cluster_id) ?? null;
              setKluster(clusterFound);
            }
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      </ScrollView>

      <Modal visible={infoModal !== null} transparent animationType="fade" onRequestClose={() => setInfoModal(null)}>
        <View className="flex-1 items-center justify-center bg-black/50 px-5">
          <View className="max-h-[80%] w-full rounded-3xl bg-white p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-[#0E4457]">
                {infoModal === 'risk'
                  ? 'Panduan Skor Risiko'
                  : infoModal === 'kebarangkalian'
                    ? 'Penerangan Kebarangkalian'
                    : 'Penerangan Keterukan'}
              </Text>
              <Pressable className="h-9 w-9 items-center justify-center rounded-full bg-[#EEF4F6]" onPress={() => setInfoModal(null)}>
                <Ionicons name="close" size={18} color="#0E4457" />
              </Pressable>
            </View>

            <ScrollView className="mt-3" showsVerticalScrollIndicator={false}>
              {infoModal === 'risk' ? (
                <View>
                  <View className="flex-row rounded-t-xl bg-[#E5EDF1] p-2">
                    <Text className="w-[20%] text-xs font-bold text-[#173B48]">Skor</Text>
                    <Text className="w-[25%] text-xs font-bold text-[#173B48]">Tahap</Text>
                    <Text className="w-[55%] text-xs font-bold text-[#173B48]">Tindakan Sistem</Text>
                  </View>
                  {PANDUAN_RISIKO.map((row, idx) => (
                    <View key={row.skor} className={`flex-row border border-[#DCE7ED] p-2 ${idx === PANDUAN_RISIKO.length - 1 ? 'rounded-b-xl' : ''}`}>
                      <View className="w-[20%] justify-center">
                        <Text className="text-xs font-bold text-[#173B48]">{row.skor}</Text>
                      </View>
                      <View className="w-[25%] justify-center">
                        <View className="self-start rounded-full px-2 py-1" style={{ backgroundColor: row.color }}>
                          <Text className="text-[10px] font-bold text-white">{row.tahap}</Text>
                        </View>
                      </View>
                      <View className="w-[55%]">
                        <Text className="text-xs leading-5 text-[#36505E]">{row.tindakan}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View>
                  <Text className="mb-2 text-xs font-semibold text-[#607681]">
                    {infoModal === 'kebarangkalian'
                      ? 'INDEKS KEBARANGKALIAN'
                      : 'INDEKS KETERUKAN'}
                  </Text>
                  {(infoModal === 'kebarangkalian' ? INFO_KEBARANGKALIAN : INFO_KETERUKAN).map((item) => (
                    <View key={item} className="mb-2 rounded-xl border border-[#DCE7ED] bg-[#F8FBFC] p-3">
                      <Text className="text-xs leading-5 text-[#173B48]">{item}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
