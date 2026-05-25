import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, KeyboardAvoidingView, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ImagePreviewModal } from '../../components/ImagePreviewModal';
import { dbApi } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { muatNaikImejCloudinary } from '../../services/cloudinary';
import { maklumPengumumanBaharu } from '../../services/notificationHelper';
import { Pengumuman } from '../../types';

const formatTarikh = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const PengurusanPengumumanScreen = () => {
  const { user, profile } = useAuth();
  const [tajuk, setTajuk] = useState('');
  const [kandungan, setKandungan] = useState('');
  const [imejUri, setImejUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Pengumuman[]>([]);
  const [previewState, setPreviewState] = useState<{ visible: boolean; images: string[]; index: number }>({
    visible: false,
    images: [],
    index: 0,
  });

  const lokasiPengumuman = profile?.role === 'master_admin' ? 'Semua Jeti' : profile?.bahagian ?? 'Belum ditetapkan';

  useEffect(() => {
    const unsub = dbApi.subscribePengumuman((items) => setAnnouncements(items));
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    if (profile?.role === 'master_admin' || !profile?.bahagian) {
      return announcements;
    }

    const bahagian = profile.bahagian.trim().toLowerCase();
    return announcements.filter((item) => !item.locationName || item.locationName.trim().toLowerCase() === bahagian);
  }, [announcements, profile?.bahagian, profile?.role]);

  const resetForm = () => {
    setTajuk('');
    setKandungan('');
    setImejUri(null);
    setEditingId(null);
  };

  const pilihImej = async () => {
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) {
      Alert.alert('Izin diperlukan', 'Sila benarkan akses galeri untuk lampiran imej.');
      return;
    }

    const hasil = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.75 });
    if (!hasil.canceled && hasil.assets.length > 0) {
      setImejUri(hasil.assets[0].uri);
    }
  };

  const mulaEdit = (item: Pengumuman) => {
    setEditingId(item.id);
    setTajuk(item.tajuk);
    setKandungan(item.kandungan);
    setImejUri(item.imageUrl ?? null);
  };

  const padam = (id: string) => {
    Alert.alert('Padam Pengumuman?', 'Adakah anda pasti mahu memadam pengumuman ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Padam',
        style: 'destructive',
        onPress: async () => {
          try {
            await dbApi.padamPengumuman(id);
          } catch (error: any) {
            Alert.alert('Gagal padam', error.message ?? 'Sila cuba lagi.');
          }
        },
      },
    ]);
  };

  const simpanPengumuman = async () => {
    if (!tajuk.trim() || !kandungan.trim()) {
      Alert.alert('Data tidak lengkap', 'Isi tajuk dan kandungan pengumuman.');
      return;
    }

    setLoading(true);
    try {
      const imageUrl = imejUri ? (imejUri.startsWith('http') ? imejUri : await muatNaikImejCloudinary(imejUri)) : null;

      if (editingId) {
        await dbApi.kemasKiniPengumuman(editingId, {
          tajuk: tajuk.trim(),
          kandungan: kandungan.trim(),
          imageUrl,
        });
        Alert.alert('Berjaya', 'Pengumuman telah dikemaskini.');
      } else {
        const lokasi = profile?.role === 'master_admin' ? undefined : profile?.bahagian;
        const announcementId = await dbApi.ciptaPengumuman({
          tajuk: tajuk.trim(),
          kandungan: kandungan.trim(),
          locationName: lokasi,
          imageUrl: imageUrl ?? undefined,
          createdBy: user?.uid,
        });
        await maklumPengumumanBaharu(lokasi, tajuk.trim(), announcementId ?? undefined);
        Alert.alert('Berjaya', 'Pengumuman telah diterbitkan.');
      }

      resetForm();
    } catch (error: any) {
      Alert.alert('Gagal siarkan', error.message ?? 'Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F6F8]" edges={['top']}>
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <FlatList
          className="flex-1 px-5 pt-4"
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 110 }}
          ListHeaderComponent={
            <>
              <View className="overflow-hidden rounded-[30px] bg-[#0E4457] p-5">
                <View className="absolute -right-12 -top-10 h-32 w-32 rounded-full bg-[#86D9D2]/20" />
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <Ionicons name="megaphone" size={26} color="#FFFFFF" />
                </View>
                <Text className="mt-4 text-2xl font-bold text-white">Ruang Pengumuman Admin</Text>
                <Text className="mt-1 text-sm leading-5 text-[#D7EEF2]">
                  Pengumuman ini akan dipaparkan mengikut jeti: {lokasiPengumuman}.
                </Text>
              </View>

              <View className="mt-4 rounded-[28px] border border-[#DCE7ED] bg-white p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="create-outline" size={22} color="#0C7A72" />
                    <Text className="ml-2 text-lg font-bold text-[#0E4457]">Cipta Pengumuman</Text>
                  </View>
                  {editingId ? (
                    <Pressable className="rounded-full bg-[#EEF4F6] px-3 py-1" onPress={resetForm}>
                      <Text className="text-xs font-semibold text-[#607681]">Batal Edit</Text>
                    </Pressable>
                  ) : null}
                </View>

                <View className="mt-4 rounded-2xl bg-[#E5F5F3] px-4 py-3">
                  <Text className="text-xs font-semibold text-[#0C7A72]">Jeti Pengumuman</Text>
                  <Text className="mt-1 font-bold text-[#0E4457]">{lokasiPengumuman}</Text>
                </View>

                <TextInput
                  value={tajuk}
                  onChangeText={setTajuk}
                  placeholder="Tajuk pengumuman"
                  className="mt-4 rounded-2xl border border-[#DCE7ED] bg-[#F8FBFC] px-4 py-3 text-[#173B48]"
                />
                <TextInput
                  value={kandungan}
                  onChangeText={setKandungan}
                  placeholder="Kandungan pengumuman"
                  multiline
                  className="mt-3 rounded-2xl border border-[#DCE7ED] bg-[#F8FBFC] px-4 py-3 text-[#173B48]"
                  style={{ minHeight: 100, textAlignVertical: 'top' }}
                />

                <Pressable className="mt-3 flex-row items-center justify-center rounded-2xl border border-[#0C7A72] bg-white p-4" onPress={() => void pilihImej()}>
                  <Ionicons name="image-outline" size={20} color="#0C7A72" />
                  <Text className="ml-2 font-bold text-[#0C7A72]">{imejUri ? 'Tukar Imej Lampiran' : 'Lampirkan Imej'}</Text>
                </Pressable>

                {imejUri ? (
                  <View className="mt-3 flex-row items-center rounded-2xl bg-[#F6FAFB] p-3">
                    <Image source={{ uri: imejUri }} className="h-20 w-20 rounded-2xl bg-[#DCE7ED]" />
                    <View className="ml-3 flex-1">
                      <Text className="font-bold text-[#173B48]">Imej dipilih</Text>
                      <Text className="text-xs text-[#607681]">Akan dimuat naik bersama pengumuman.</Text>
                    </View>
                    <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-[#FEE2E2]" onPress={() => setImejUri(null)}>
                      <Ionicons name="close" size={20} color="#B42318" />
                    </Pressable>
                  </View>
                ) : null}

                <Pressable className="mt-4 flex-row items-center justify-center rounded-2xl bg-[#0C7A72] p-4" disabled={loading} onPress={() => void simpanPengumuman()}>
                  <Ionicons name={editingId ? 'save-outline' : 'send-outline'} size={20} color="#FFFFFF" />
                  <Text className="ml-2 font-bold text-white">
                    {loading ? 'Sedang Simpan...' : editingId ? 'Simpan Perubahan' : 'Siarkan Pengumuman'}
                  </Text>
                </Pressable>
              </View>

              <View className="mt-5 mb-3 flex-row items-center">
                <Ionicons name="notifications-outline" size={20} color="#0E4457" />
                <Text className="ml-2 text-lg font-bold text-[#0E4457]">Senarai Pengumuman</Text>
              </View>
            </>
          }
          renderItem={({ item, index }) => (
            <View className="mb-4 overflow-hidden rounded-2xl border border-[#DCE7ED] bg-white">
              {item.imageUrl ? (
                <Pressable
                  onPress={() =>
                    setPreviewState({
                      visible: true,
                      images: [item.imageUrl as string],
                      index: 0,
                    })
                  }
                >
                  <Image source={{ uri: item.imageUrl }} className="h-36 w-full bg-[#DCE7ED]" />
                </Pressable>
              ) : null}
              <View className="p-4">
                <View className="flex-row items-start">
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-[#E5F5F3]">
                    <Ionicons name={index === 0 ? 'radio-outline' : 'megaphone-outline'} size={21} color="#0C7A72" />
                  </View>
                  <View className="ml-3 flex-1 pr-2">
                    <View className="flex-row flex-wrap items-center">
                      <View className="mr-2 rounded-full bg-[#E5F5F3] px-2 py-1">
                        <Text className="text-[10px] font-bold text-[#0C7A72]">{item.locationName ?? 'Semua Jeti'}</Text>
                      </View>
                      <Text className="text-xs text-[#607681]">{formatTarikh(item.createdAt)}</Text>
                    </View>
                    <Text className="mt-2 text-base font-bold text-[#173B48]">{item.tajuk}</Text>
                    <Text className="mt-2 text-sm leading-6 text-[#4B5F6C]">{item.kandungan}</Text>
                  </View>
                </View>

                <View className="mt-4 flex-row justify-end gap-2">
                  <Pressable className="flex-row items-center rounded-xl border border-[#DCE7ED] px-3 py-2" onPress={() => mulaEdit(item)}>
                    <Ionicons name="create-outline" size={15} color="#0E4457" />
                    <Text className="ml-1 text-xs font-semibold text-[#0E4457]">Edit</Text>
                  </Pressable>
                  <Pressable className="flex-row items-center rounded-xl bg-[#FEE2E2] px-3 py-2" onPress={() => padam(item.id)}>
                    <Ionicons name="trash-outline" size={15} color="#B42318" />
                    <Text className="ml-1 text-xs font-semibold text-[#B42318]">Padam</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="mt-4 items-center rounded-2xl bg-white p-6">
              <Ionicons name="notifications-off-outline" size={34} color="#8A9AA5" />
              <Text className="mt-3 text-center font-semibold text-[#607681]">Belum ada pengumuman.</Text>
              <Text className="mt-1 text-center text-sm text-[#8A9AA5]">Pengumuman yang dicipta akan dipaparkan di sini.</Text>
            </View>
          }
        />
        <ImagePreviewModal
          visible={previewState.visible}
          images={previewState.images}
          initialIndex={previewState.index}
          onClose={() => setPreviewState((prev) => ({ ...prev, visible: false }))}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
