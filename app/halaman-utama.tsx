import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function HalamanUtama() {
  return (
    <SafeAreaView className="flex-1 bg-[#EDF3F6]" edges={['top']}>
      <ScrollView className="flex-1 bg-[#EDF3F6]" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28 }}>
        <View>
          <View>
            <View className="rounded-3xl border border-[#D2DFE7] bg-[#E4EEF3] px-5 py-6">
              <View className="items-center">
                <View className="h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-[#F7FBFD] shadow-sm">
                  <Image
                    source={require('../assets/jetiselamat.jpeg')}
                    className="h-20 w-20 rounded-full"
                    resizeMode="cover"
                  />
                </View>

                <Text className="mt-4 text-3xl font-bold text-[#0E4457]">JetiSelamat</Text>
                <Text className="mt-1 text-center text-sm text-[#4B6675]">
                  Sistem Digital HIRARC untuk Keselamatan Jeti
                </Text>
              </View>
            </View>

            <View className="mt-4 rounded-3xl border border-[#DDE8EE] bg-white p-5">
              <Text className="text-xl font-bold text-[#0E4457]">Pengenalan</Text>
              <Text className="mt-3 text-sm leading-6 text-[#4B5F6C]" style={{ textAlign: 'justify' }}>
                JetiSelamat ialah sistem pengurusan keselamatan marin yang dibangunkan untuk
                membantu operasi jeti dijalankan dengan lebih selamat, tersusun dan telus. Sistem
                ini mendigitalkan proses HIRARC dengan membolehkan pegawai memilih lokasi, aktiviti,
                kluster serta hazard secara terus daripada pangkalan data rasmi.
              </Text>
              <Text className="mt-2 text-sm leading-6 text-[#4B5F6C]" style={{ textAlign: 'justify' }}>
                Setiap hazard akan dinilai menggunakan matriks risiko 5x5 (kebarangkalian x
                keterukan), seterusnya menghasilkan tahap risiko dan cadangan tindakan kawalan yang
                sesuai. Pengguna juga boleh melampirkan bukti imej, menyimpan beberapa hazard dalam
                satu laporan, dan menghantar laporan lengkap kepada pentadbir untuk pemantauan,
                tindakan susulan dan penambahbaikan berterusan.
              </Text>
            </View>
          </View>

          <View className="mt-5 rounded-3xl border border-[#DDE8EE] bg-white p-5">
            <Pressable className="rounded-xl bg-[#0C7A72] py-3.5" onPress={() => router.replace('/log-masuk')}>
              <Text className="text-center text-base font-semibold text-white">Masuk Ke Sistem</Text>
            </Pressable>

            <Pressable
              className="mt-3 rounded-xl border border-[#0C7A72] bg-white py-3.5"
              onPress={() => router.replace('/daftar')}
            >
              <Text className="text-center text-base font-semibold text-[#0C7A72]">Daftar Akaun</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
