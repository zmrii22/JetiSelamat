import React, { useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { routeUntukPeranan } from '../src/services/routing';
import { mesejRalatMesra } from '../src/utils/errorMessages';

const bahagianOptions = ['Jeti TTI', 'Jeti Setiu', 'Jeti Kuala Besut'];

export default function DaftarPage() {
  const { daftar } = useAuth();
  const [namaPenuh, setNamaPenuh] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bahagian, setBahagian] = useState('Jeti TTI');
  const [mohonAdmin, setMohonAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDaftar = async () => {
    if (!namaPenuh.trim()) {
      Alert.alert('Maklumat belum lengkap', 'Sila masukkan nama penuh.');
      return;
    }

    setLoading(true);
    try {
      const profil = await daftar(namaPenuh, email, password, bahagian, mohonAdmin);
      if (mohonAdmin) {
        Alert.alert('Permohonan dihantar', 'Permohonan admin anda akan disemak oleh master admin.');
      }
      router.replace(routeUntukPeranan(profil.role));
    } catch (error: any) {
      Alert.alert('Daftar gagal', mesejRalatMesra(error, 'Maklumat pendaftaran tidak sah. Sila semak semula.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={require('../assets/bg_jetty.jpg')} className="flex-1" resizeMode="cover">
      <SafeAreaView className="flex-1 bg-[#09313F]/35" edges={['top']}>
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
          >
            <View className="items-center">
              <View className="h-24 w-24 items-center justify-center rounded-full border border-white/60 bg-white">
                <Image source={require('../assets/jetiselamat.jpeg')} className="h-20 w-20 rounded-full" />
              </View>
              <Text className="mt-3 text-4xl font-bold text-white">JetiSelamat</Text>
              <Text className="text-sm font-medium text-[#E6F3F8]">Pendaftaran Staff</Text>
            </View>

            <View className="mt-7 rounded-[28px] border border-white/40 bg-white/95 p-5">
              <Text className="text-2xl font-bold text-[#0E4457]">Daftar Akaun</Text>
              <Text className="mt-1 text-sm text-[#59707D]">Lengkapkan maklumat untuk akses sistem pemeriksaan.</Text>

              <View className="mt-5 flex-row items-center rounded-xl border border-[#D8E4EA] bg-[#F8FBFC] px-4">
                <Ionicons name="person-outline" size={19} color="#0C7A72" />
                <TextInput
                  className="ml-3 flex-1 py-3 text-[#183B49]"
                  placeholder="Nama Penuh"
                  value={namaPenuh}
                  onChangeText={setNamaPenuh}
                />
              </View>

              <View className="mt-3 flex-row items-center rounded-xl border border-[#D8E4EA] bg-[#F8FBFC] px-4">
                <Ionicons name="mail-outline" size={19} color="#0C7A72" />
                <TextInput
                  className="ml-3 flex-1 py-3 text-[#183B49]"
                  placeholder="Emel"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View className="mt-3 flex-row items-center rounded-xl border border-[#D8E4EA] bg-[#F8FBFC] px-4">
                <Ionicons name="lock-closed-outline" size={19} color="#0C7A72" />
                <TextInput
                  className="ml-3 flex-1 py-3 text-[#183B49]"
                  placeholder="Kata Laluan"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable onPress={() => setShowPassword((value) => !value)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color="#607681" />
                </Pressable>
              </View>

              <Text className="mt-5 text-sm font-semibold text-[#36505E]">Bertugas di jeti mana?</Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {bahagianOptions.map((option) => {
                  const selected = bahagian === option;
                  return (
                    <Pressable
                      key={option}
                      className={`rounded-full border px-4 py-2 ${selected ? 'border-[#0C7A72] bg-[#0C7A72]' : 'border-[#D8E4EA] bg-white'}`}
                      onPress={() => setBahagian(option)}
                    >
                      <Text className={`text-sm font-medium ${selected ? 'text-white' : 'text-[#36505E]'}`}>{option}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View className="mt-5 flex-row items-center justify-between rounded-xl border border-[#D8E4EA] bg-[#F8FBFC] p-4">
                <View className="mr-4 flex-1">
                  <Text className="text-sm font-semibold text-[#36505E]">Mohon sebagai Admin</Text>
                  <Text className="mt-1 text-xs text-[#6A7E89]">Kelulusan akan dibuat oleh master admin.</Text>
                </View>
                <Switch value={mohonAdmin} onValueChange={setMohonAdmin} />
              </View>

              <Pressable className="mt-6 rounded-xl bg-[#0C7A72] py-3.5" onPress={() => void handleDaftar()}>
                <Text className="text-center text-base font-semibold text-white">
                  {loading ? 'Sedang daftar...' : 'Daftar Akaun'}
                </Text>
              </Pressable>

              <Pressable className="mt-4" onPress={() => router.push('/log-masuk')}>
                <Text className="text-center text-sm font-medium text-[#0C7A72]">Sudah ada akaun? Log masuk</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
