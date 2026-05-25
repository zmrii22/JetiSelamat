import React, { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DatePickerModal, formatTarikhPendek } from '../../components/DatePickerModal';
import { useAuth } from '../../context/AuthContext';
import { muatNaikImejCloudinary } from '../../services/cloudinary';

const roleLabel = {
  inspector: 'Staff Pemeriksa',
  admin: 'Admin',
  master_admin: 'Master Admin',
};

const bahagianOptions = ['Jeti TTI', 'Jeti Setiu', 'Jeti Kuala Besut'];
const jantinaOptions = ['Lelaki', 'Perempuan', 'Lain-lain'];

const normalisasiBahagian = (value?: string) => {
  const text = (value ?? '').trim().toLowerCase();
  if (text.includes('tti')) return 'Jeti TTI';
  if (text.includes('setiu')) return 'Jeti Setiu';
  if (text.includes('besut')) return 'Jeti Kuala Besut';
  return 'Jeti TTI';
};

const parseTarikh = (value?: string) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const ProfilScreen = () => {
  const { user, profile, kemasKiniProfil, logKeluar } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [namaPenuh, setNamaPenuh] = useState('');
  const [bahagian, setBahagian] = useState('TTI Jetty');
  const [tarikhLahir, setTarikhLahir] = useState<Date | null>(null);
  const [nomborTelefon, setNomborTelefon] = useState('');
  const [jantina, setJantina] = useState('Lelaki');
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNamaPenuh(profile?.namaPenuh ?? '');
    setBahagian(normalisasiBahagian(profile?.bahagian));
    setTarikhLahir(parseTarikh(profile?.tarikhLahir));
    setNomborTelefon(profile?.nomborTelefon ?? '');
    setJantina(profile?.jantina ?? 'Lelaki');
    setAvatarUrl(profile?.avatarUrl);
  }, [profile]);

  const pilihAvatar = async () => {
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) {
      Alert.alert('Izin diperlukan', 'Sila benarkan akses galeri untuk gambar profil.');
      return;
    }

    const hasil = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });

    if (hasil.canceled || hasil.assets.length === 0) {
      return;
    }

    setSaving(true);
    try {
      const uploadedUrl = await muatNaikImejCloudinary(hasil.assets[0].uri);
      setAvatarUrl(uploadedUrl);
      await kemasKiniProfil({ avatarUrl: uploadedUrl });
      Alert.alert('Berjaya', 'Gambar profil telah dikemaskini.');
    } catch (error: any) {
      Alert.alert('Gagal muat naik', error.message ?? 'Sila cuba semula.');
    } finally {
      setSaving(false);
    }
  };

  const buangAvatar = async () => {
    setSaving(true);
    try {
      setAvatarUrl(null);
      await kemasKiniProfil({ avatarUrl: null });
      Alert.alert('Gambar dibuang', 'Gambar profil telah dibuang.');
    } catch (error: any) {
      Alert.alert('Gagal buang gambar', error.message ?? 'Sila cuba semula.');
    } finally {
      setSaving(false);
    }
  };

  const simpanProfil = async () => {
    if (!namaPenuh.trim()) {
      Alert.alert('Nama diperlukan', 'Sila masukkan nama penuh.');
      return;
    }

    if (!/^[A-Za-z\s@]+$/.test(namaPenuh.trim())) {
      Alert.alert('Nama tidak sah', 'Nama hanya boleh mengandungi huruf, ruang dan simbol @ sahaja.');
      return;
    }

    if (nomborTelefon.trim() && !/^[0-9+\-\s]{8,16}$/.test(nomborTelefon.trim())) {
      Alert.alert('Nombor telefon tidak sah', 'Sila masukkan nombor telefon yang betul.');
      return;
    }

    if (tarikhLahir && tarikhLahir > new Date()) {
      Alert.alert('Tarikh tidak sah', 'Tarikh lahir tidak boleh melebihi tarikh hari ini.');
      return;
    }

    setSaving(true);
    try {
      await kemasKiniProfil({
        namaPenuh: namaPenuh.trim(),
        bahagian,
        tarikhLahir: tarikhLahir?.toISOString(),
        nomborTelefon: nomborTelefon.trim(),
        jantina,
        avatarUrl,
      });
      setIsEditing(false);
      Alert.alert('Profil dikemaskini', 'Biodata akaun berjaya disimpan.');
    } catch (error: any) {
      Alert.alert('Gagal simpan', error.message ?? 'Sila cuba semula.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F6F8]" edges={['top']}>
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 20,
            paddingBottom: tabBarHeight + Math.max(insets.bottom, 10) + 20,
          }}
        >
          <View className="items-center overflow-hidden rounded-[32px] bg-[#0E4457] px-5 py-7">
            <View className="absolute -top-12 right-4 h-32 w-32 rounded-full bg-white/10" />
            <View className="absolute -bottom-10 left-10 h-24 w-24 rounded-full bg-[#86D9D2]/20" />

            <View className="relative h-32 w-32 items-center justify-center">
              <View className="absolute h-32 w-32 rounded-full bg-white/20" />
              <View className="h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white/60 bg-white/15">
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} className="h-full w-full rounded-full" resizeMode="cover" />
                ) : (
                  <View className="h-full w-full items-center justify-center rounded-full bg-white/15">
                    <Ionicons name="person" size={62} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <Pressable
                className="absolute -bottom-1 -right-1 h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#0C7A72]"
                disabled={saving}
                onPress={() => void pilihAvatar()}
              >
                <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
              </Pressable>
            </View>

            <Text className="mt-4 text-center text-2xl font-bold text-white">
              {profile?.namaPenuh || 'Pengguna JetiSelamat'}
            </Text>
            <Text className="mt-1 text-center text-sm text-[#D7EEF2]">{user?.email}</Text>

            <View className="mt-4 rounded-full bg-white/15 px-4 py-2">
              <Text className="text-xs font-bold text-white">{profile?.role ? roleLabel[profile.role] : '-'}</Text>
            </View>
          </View>

          {!isEditing ? (
            <View className="mt-5 rounded-2xl border border-[#DCE7ED] bg-white p-4">
              <View className="flex-row items-center">
                <Ionicons name="id-card-outline" size={22} color="#0C7A72" />
                <Text className="ml-2 text-lg font-bold text-[#0E4457]">Biodata Akaun</Text>
              </View>
              <View className="mt-4 rounded-xl bg-[#F8FBFC] p-3">
                <Text className="text-xs text-[#607681]">Nama Penuh</Text>
                <Text className="mt-1 font-bold text-[#173B48]">{namaPenuh || '-'}</Text>
              </View>
              <View className="mt-3 rounded-xl bg-[#F8FBFC] p-3">
                <Text className="text-xs text-[#607681]">Bahagian Bertugas</Text>
                <Text className="mt-1 font-bold text-[#173B48]">{bahagian || '-'}</Text>
              </View>
              <View className="mt-3 rounded-xl bg-[#F8FBFC] p-3">
                <Text className="text-xs text-[#607681]">Tarikh Lahir</Text>
                <Text className="mt-1 font-bold text-[#173B48]">{tarikhLahir ? formatTarikhPendek(tarikhLahir) : '-'}</Text>
              </View>
              <View className="mt-3 rounded-xl bg-[#F8FBFC] p-3">
                <Text className="text-xs text-[#607681]">Nombor Telefon</Text>
                <Text className="mt-1 font-bold text-[#173B48]">{nomborTelefon || '-'}</Text>
              </View>
              <View className="mt-3 rounded-xl bg-[#F8FBFC] p-3">
                <Text className="text-xs text-[#607681]">Jantina</Text>
                <Text className="mt-1 font-bold text-[#173B48]">{jantina || '-'}</Text>
              </View>
            </View>
          ) : (
            <View className="mt-5 rounded-2xl border border-[#DCE7ED] bg-white p-4">
              <View className="flex-row items-center">
                <Ionicons name="create-outline" size={22} color="#0C7A72" />
                <Text className="ml-2 text-lg font-bold text-[#0E4457]">Edit Biodata</Text>
              </View>

              {avatarUrl ? (
                <Pressable className="mt-2 flex-row items-center justify-center rounded-xl bg-[#FEE2E2] p-2" onPress={() => void buangAvatar()}>
                  <Ionicons name="trash-outline" size={16} color="#B42318" />
                  <Text className="ml-1 text-xs font-bold text-[#B42318]">Buang Gambar</Text>
                </Pressable>
              ) : null}

              <Text className="mt-4 text-xs font-semibold text-[#607681]">Nama Penuh</Text>
              <TextInput
                className="mt-1 rounded-xl border border-[#DCE7ED] bg-[#F8FBFC] px-4 py-3 text-[#173B48]"
                value={namaPenuh}
                onChangeText={setNamaPenuh}
                placeholder="Nama penuh"
              />

              <Text className="mt-3 text-xs font-semibold text-[#607681]">Bahagian Bertugas</Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {bahagianOptions.map((option) => {
                  const active = bahagian === option;
                  return (
                    <Pressable
                      key={option}
                      className={`rounded-full px-4 py-2 ${active ? 'bg-[#0C7A72]' : 'bg-[#F8FBFC]'}`}
                      onPress={() => setBahagian(option)}
                    >
                      <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-[#607681]'}`}>{option}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text className="mt-3 text-xs font-semibold text-[#607681]">Tarikh Lahir</Text>
              <Pressable
                className="mt-1 flex-row items-center rounded-xl border border-[#DCE7ED] bg-[#F8FBFC] px-4 py-3"
                onPress={() => setCalendarOpen(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#0C7A72" />
                <Text className="ml-2 flex-1 text-[#173B48]">
                  {tarikhLahir ? formatTarikhPendek(tarikhLahir) : 'Pilih tarikh lahir'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#8A9AA5" />
              </Pressable>

              <Text className="mt-3 text-xs font-semibold text-[#607681]">Nombor Telefon</Text>
              <TextInput
                className="mt-1 rounded-xl border border-[#DCE7ED] bg-[#F8FBFC] px-4 py-3 text-[#173B48]"
                value={nomborTelefon}
                onChangeText={setNomborTelefon}
                keyboardType="phone-pad"
                placeholder="Contoh: 0123456789"
              />

              <Text className="mt-3 text-xs font-semibold text-[#607681]">Jantina</Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {jantinaOptions.map((option) => {
                  const active = jantina === option;
                  return (
                    <Pressable
                      key={option}
                      className={`rounded-full px-4 py-2 ${active ? 'bg-[#0C7A72]' : 'bg-[#F8FBFC]'}`}
                      onPress={() => setJantina(option)}
                    >
                      <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-[#607681]'}`}>{option}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <View className="mt-5 rounded-2xl border border-[#DCE7ED] bg-white p-4">
            <Text className="text-base font-bold text-[#0E4457]">Maklumat Sistem</Text>
            <Text className="mt-3 text-sm text-[#4B5F6C]">Status Permohonan Admin: {profile?.statusPermohonanAdmin ?? 'Tiada'}</Text>
            <Text className="mt-2 text-sm text-[#4B5F6C]">Emel: {user?.email}</Text>
          </View>

          {isEditing ? (
            <Pressable className="mt-5 rounded-2xl bg-[#0C7A72] p-4" disabled={saving} onPress={() => void simpanProfil()}>
              <Text className="text-center font-bold text-white">{saving ? 'Sedang Simpan...' : 'Simpan Profil'}</Text>
            </Pressable>
          ) : (
            <Pressable className="mt-5 rounded-2xl bg-[#0C7A72] p-4" onPress={() => setIsEditing(true)}>
              <Text className="text-center font-bold text-white">Edit Profil</Text>
            </Pressable>
          )}

          {isEditing ? (
            <Pressable className="mt-3 rounded-2xl border border-[#DCE7ED] bg-white p-4" onPress={() => setIsEditing(false)}>
              <Text className="text-center font-semibold text-[#607681]">Batal Edit</Text>
            </Pressable>
          ) : null}

          <Pressable
            className="mt-3 rounded-2xl bg-[#B42318] p-4"
            onPress={() => {
              void logKeluar();
              router.replace('/log-masuk');
            }}
          >
            <Text className="text-center font-semibold text-white">Log Keluar</Text>
          </Pressable>

          <DatePickerModal
            visible={calendarOpen}
            title="Pilih Tarikh Lahir"
            selectedDate={tarikhLahir}
            onSelect={setTarikhLahir}
            onClose={() => setCalendarOpen(false)}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
