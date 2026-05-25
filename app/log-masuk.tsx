import React, { useState } from 'react';
import { Alert, Image, ImageBackground, KeyboardAvoidingView, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { routeUntukPeranan } from '../src/services/routing';
import { mesejRalatMesra } from '../src/utils/errorMessages';

export default function LogMasukPage() {
  const { logMasuk } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogMasuk = async () => {
    setLoading(true);
    try {
      const profil = await logMasuk(email, password);
      router.replace(routeUntukPeranan(profil.role));
    } catch (error: any) {
      Alert.alert('Log masuk gagal', mesejRalatMesra(error, 'Emel atau kata laluan tidak tepat.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={require('../assets/bg_jetty.jpg')} className="flex-1" resizeMode="cover">
      <SafeAreaView className="flex-1 bg-[#09313F]/35" edges={['top']}>
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          <View className="px-6 pt-2">
            <Pressable
              className="h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-white/20"
              onPress={() => router.replace('/halaman-utama')}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
          <View className="flex-1 justify-center px-6 pb-8">
            <View className="items-center">
              <View className="h-24 w-24 items-center justify-center rounded-full border border-white/60 bg-white">
                <Image source={require('../assets/jetiselamat.jpeg')} className="h-20 w-20 rounded-full" />
              </View>
              <Text className="mt-3 text-4xl font-bold text-white">JetiSelamat</Text>
              <Text className="text-sm font-medium text-[#E6F3F8]">Sistem Digital HIRARC</Text>
            </View>

            <View className="mt-8 rounded-[28px] border border-white/40 bg-white/95 p-5">
              <Text className="text-2xl font-bold text-[#0E4457]">Log Masuk</Text>
              <Text className="mt-1 text-sm text-[#59707D]">
                Akses dashboard keselamatan dan laporan pemeriksaan jeti.
              </Text>

              <View className="mt-6 flex-row items-center rounded-xl border border-[#D8E4EA] bg-[#F8FBFC] px-4">
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

              <Pressable
                className="mt-3 self-end"
                onPress={() => router.push({ pathname: '/reset-kata-laluan', params: { email } })}
              >
                <Text className="text-sm font-semibold text-[#0C7A72]">Lupa kata laluan?</Text>
              </Pressable>

              <Pressable className="mt-5 rounded-xl bg-[#0C7A72] py-3.5" onPress={() => void handleLogMasuk()}>
                <Text className="text-center text-base font-semibold text-white">
                  {loading ? 'Sedang log masuk...' : 'Log Masuk'}
                </Text>
              </Pressable>

              <Pressable className="mt-4" onPress={() => router.push('/daftar')}>
                <Text className="text-center text-sm font-medium text-[#0C7A72]">Belum ada akaun? Daftar sekarang</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
