import React, { useState } from 'react';
import { Alert, Image, ImageBackground, KeyboardAvoidingView, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { mesejRalatMesra } from '../src/utils/errorMessages';

export default function ResetKataLaluanPage() {
  const { hantarResetPassword } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [loading, setLoading] = useState(false);

  const hantar = async () => {
    if (!email.trim()) {
      Alert.alert('Emel diperlukan', 'Sila masukkan emel akaun anda.');
      return;
    }

    setLoading(true);
    try {
      await hantarResetPassword(email.trim());
      Alert.alert(
        'Semak emel anda',
        'Pautan reset kata laluan telah dihantar. Kata laluan dikemaskini di Firebase Authentication selepas anda lengkapkan proses pada pautan emel.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (error: any) {
      Alert.alert('Gagal hantar pautan', mesejRalatMesra(error, 'Tidak dapat hantar pautan reset sekarang.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={require('../assets/bg_jetty.jpg')} className="flex-1" resizeMode="cover">
      <SafeAreaView className="flex-1 bg-[#09313F]/35" edges={['top']}>
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          <View className="flex-1 justify-center px-6 pb-8">
            <View className="items-center">
              <View className="h-20 w-20 items-center justify-center rounded-full border border-white/60 bg-white">
                <Image source={require('../assets/jetiselamat.jpeg')} className="h-16 w-16 rounded-full" />
              </View>
              <Text className="mt-3 text-3xl font-bold text-white">Reset Kata Laluan</Text>
            </View>

            <View className="mt-8 rounded-[28px] border border-white/40 bg-white/95 p-5">
              <Text className="text-base font-semibold text-[#0E4457]">
                Masukkan emel akaun untuk terima pautan reset.
              </Text>

              <View className="mt-5 flex-row items-center rounded-xl border border-[#D8E4EA] bg-[#F8FBFC] px-4">
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

              <Pressable className="mt-5 rounded-xl bg-[#0C7A72] py-3.5" disabled={loading} onPress={() => void hantar()}>
                <Text className="text-center text-base font-semibold text-white">
                  {loading ? 'Menghantar...' : 'Hantar Pautan Reset'}
                </Text>
              </Pressable>

              <Pressable className="mt-4 flex-row items-center justify-center" onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={16} color="#0C7A72" />
                <Text className="text-sm font-medium text-[#0C7A72]">Kembali ke Log Masuk</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
