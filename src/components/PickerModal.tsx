import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PickerItem {
  id: string;
  name: string;
}

interface PickerModalProps {
  visible: boolean;
  title: string;
  items: PickerItem[];
  onSelect: (item: PickerItem) => void;
  onClose: () => void;
}

export const PickerModal: React.FC<PickerModalProps> = ({ visible, title, items, onSelect, onClose }) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/45">
        <View
          className="max-h-[78%] rounded-t-[32px] bg-[#F8FBFC] p-5"
          style={{ paddingBottom: Math.max(insets.bottom, 8) + 12 }}
        >
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-bold text-[#0E4457]">{title}</Text>
              <Text className="text-xs text-[#607681]">Pilih satu pilihan untuk borang HIRARC.</Text>
            </View>
            <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-white" onPress={onClose}>
              <Ionicons name="close" size={22} color="#0E4457" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 8) + 4 }}>
            {items.map((item) => (
              <Pressable
                key={item.id}
                className="mb-2 flex-row items-center rounded-2xl border border-[#DCE7ED] bg-white p-4"
                onPress={() => onSelect(item)}
              >
                <View className="h-9 w-9 items-center justify-center rounded-full bg-[#E5F5F3]">
                  <Ionicons name="checkmark-circle-outline" size={19} color="#0C7A72" />
                </View>
                <Text className="ml-3 flex-1 text-sm font-semibold text-[#173B48]">{item.name}</Text>
                <Ionicons name="chevron-forward" size={18} color="#8A9AA5" />
              </Pressable>
            ))}
            {items.length === 0 ? (
              <View className="items-center rounded-2xl bg-white p-6">
                <Ionicons name="file-tray-outline" size={30} color="#8A9AA5" />
                <Text className="mt-2 text-center text-sm font-semibold text-[#607681]">Tiada pilihan tersedia.</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
