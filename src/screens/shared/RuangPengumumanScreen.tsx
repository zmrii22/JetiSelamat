import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ImagePreviewModal } from '../../components/ImagePreviewModal';
import { dbApi } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { Pengumuman } from '../../types';

const formatTarikh = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const RuangPengumumanScreen = ({ embedded = false }: { embedded?: boolean }) => {
  const { profile } = useAuth();
  const [list, setList] = useState<Pengumuman[]>([]);
  const [previewState, setPreviewState] = useState<{ visible: boolean; images: string[]; index: number }>({
    visible: false,
    images: [],
    index: 0,
  });

  useEffect(() => {
    const unsub = dbApi.subscribePengumuman((items) => setList(items));
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    if (profile?.role === 'master_admin' || !profile?.bahagian) {
      return list;
    }

    return list.filter(
      (item) => !item.locationName || item.locationName.trim().toLowerCase() === profile.bahagian?.trim().toLowerCase(),
    );
  }, [list, profile?.bahagian, profile?.role]);

  const content = (
    <View className={`${embedded ? '' : 'flex-1'} px-5 pt-4`}>
      {!embedded ? (
        <View className="overflow-hidden rounded-[30px] bg-[#0E4457] p-5">
          <View className="absolute -right-12 -top-10 h-32 w-32 rounded-full bg-[#86D9D2]/20" />
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <Ionicons name="megaphone" size={26} color="#FFFFFF" />
          </View>
          <Text className="mt-4 text-2xl font-bold text-white">Ruang Pengumuman</Text>
          <Text className="mt-1 text-sm leading-5 text-[#D7EEF2]">
            Makluman rasmi operasi, keselamatan dan arahan semasa jeti.
          </Text>
        </View>
      ) : null}

      <FlatList
        className="mt-5"
        data={filtered}
        keyExtractor={(item) => item.id}
        scrollEnabled={!embedded}
        contentContainerStyle={{ paddingBottom: embedded ? 16 : 110 }}
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
                <Image source={{ uri: item.imageUrl }} className="h-40 w-full bg-[#DCE7ED]" />
              </Pressable>
            ) : null}
            <View className="h-1.5 bg-[#0C7A72]" />
            <View className="p-4">
              <View className="flex-row items-start">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-[#E5F5F3]">
                  <Ionicons name={index === 0 ? 'radio-outline' : 'notifications-outline'} size={21} color="#0C7A72" />
                </View>
                <View className="ml-3 flex-1">
                  <View className="flex-row flex-wrap items-center">
                    {index === 0 ? (
                      <View className="mr-2 rounded-full bg-[#FEF3C7] px-2 py-1">
                        <Text className="text-[10px] font-bold text-[#B45309]">TERKINI</Text>
                      </View>
                    ) : null}
                    <View className="mr-2 rounded-full bg-[#E5F5F3] px-2 py-1">
                      <Text className="text-[10px] font-bold text-[#0C7A72]">{item.locationName ?? 'Semua Jeti'}</Text>
                    </View>
                    <Text className="text-xs text-[#607681]">{formatTarikh(item.createdAt)}</Text>
                  </View>
                  <Text className="mt-2 text-lg font-bold text-[#173B48]">{item.tajuk}</Text>
                  <Text className="mt-2 text-sm leading-6 text-[#4B5F6C]">{item.kandungan}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="mt-12 items-center rounded-2xl bg-white p-6">
            <Ionicons name="notifications-off-outline" size={34} color="#8A9AA5" />
            <Text className="mt-3 text-center font-semibold text-[#607681]">Belum ada pengumuman.</Text>
            <Text className="mt-1 text-center text-sm text-[#8A9AA5]">Makluman rasmi akan dipaparkan di sini.</Text>
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
  );

  if (embedded) {
    return content;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F2F6F8]" edges={['top']}>
      {content}
    </SafeAreaView>
  );
};
