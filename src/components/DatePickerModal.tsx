import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const bulan = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'];
const hari = ['A', 'I', 'S', 'R', 'K', 'J', 'S'];

const sameDate = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const formatTarikhPendek = (timestamp: number | Date) =>
  new Date(timestamp).toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

interface DatePickerModalProps {
  visible: boolean;
  title: string;
  selectedDate?: Date | null;
  onSelect: (date: Date) => void;
  onClear?: () => void;
  onClose: () => void;
}

export const DatePickerModal = ({ visible, title, selectedDate, onSelect, onClear, onClose }: DatePickerModalProps) => {
  const [viewDate, setViewDate] = useState(selectedDate ?? new Date());
  const [mode, setMode] = useState<'day' | 'monthYear'>('day');
  const [yearStart, setYearStart] = useState((selectedDate ?? new Date()).getFullYear() - 5);

  useEffect(() => {
    if (visible) {
      const target = selectedDate ?? new Date();
      setViewDate(target);
      setYearStart(target.getFullYear() - 5);
      setMode('day');
    }
  }, [selectedDate, visible]);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const blanks = Array.from({ length: firstDay }, () => null);
    const dates = Array.from({ length: totalDays }, (_, index) => new Date(year, month, index + 1));
    return [...blanks, ...dates];
  }, [viewDate]);

  const changeMonth = (amount: number) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const pilihBulan = (month: number) => {
    setViewDate((current) => new Date(current.getFullYear(), month, 1));
    setMode('day');
  };

  const pilihTahun = (year: number) => {
    setViewDate((current) => new Date(year, current.getMonth(), 1));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/45">
        <View className="rounded-t-[32px] bg-[#F8FBFC] p-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-bold text-[#0E4457]">{title}</Text>
              <Text className="text-xs text-[#607681]">Pilih tarikh daripada kalendar.</Text>
            </View>
            <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-white" onPress={onClose}>
              <Ionicons name="close" size={22} color="#0E4457" />
            </Pressable>
          </View>

          <View className="mt-5 flex-row items-center justify-between rounded-2xl bg-white p-3">
            <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-[#E5F5F3]" onPress={() => changeMonth(-1)}>
              <Ionicons name="chevron-back" size={20} color="#0C7A72" />
            </Pressable>
            <Pressable className="items-center" onPress={() => setMode((value) => (value === 'day' ? 'monthYear' : 'day'))}>
              <Text className="text-base font-bold text-[#0E4457]">
                {bulan[viewDate.getMonth()]} {viewDate.getFullYear()}
              </Text>
              <Text className="text-[10px] font-semibold text-[#0C7A72]">Tekan untuk pilih bulan/tahun</Text>
            </Pressable>
            <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-[#E5F5F3]" onPress={() => changeMonth(1)}>
              <Ionicons name="chevron-forward" size={20} color="#0C7A72" />
            </Pressable>
          </View>

          {mode === 'monthYear' ? (
            <View className="mt-4">
              <View className="flex-row items-center justify-between rounded-2xl bg-white p-3">
                <Pressable className="rounded-full bg-[#E5F5F3] px-4 py-2" onPress={() => setYearStart((year) => year - 10)}>
                  <Text className="font-bold text-[#0C7A72]">-10 Tahun</Text>
                </Pressable>
                <Text className="font-bold text-[#0E4457]">
                  {yearStart} - {yearStart + 11}
                </Text>
                <Pressable className="rounded-full bg-[#E5F5F3] px-4 py-2" onPress={() => setYearStart((year) => year + 10)}>
                  <Text className="font-bold text-[#0C7A72]">+10 Tahun</Text>
                </Pressable>
              </View>

              <View className="mt-3 flex-row flex-wrap">
                {Array.from({ length: 12 }, (_, index) => yearStart + index).map((year) => {
                  const active = year === viewDate.getFullYear();
                  return (
                    <Pressable key={year} className="mb-2 w-1/4 px-1" onPress={() => pilihTahun(year)}>
                      <View className={`items-center rounded-xl py-3 ${active ? 'bg-[#0C7A72]' : 'bg-white'}`}>
                        <Text className={`font-bold ${active ? 'text-white' : 'text-[#173B48]'}`}>{year}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <View className="mt-2 flex-row flex-wrap">
                {bulan.map((item, index) => {
                  const active = index === viewDate.getMonth();
                  return (
                    <Pressable key={item} className="mb-2 w-1/4 px-1" onPress={() => pilihBulan(index)}>
                      <View className={`items-center rounded-xl py-3 ${active ? 'bg-[#D97706]' : 'bg-white'}`}>
                        <Text className={`font-bold ${active ? 'text-white' : 'text-[#173B48]'}`}>{item}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : (
            <>
              <View className="mt-4 flex-row">
                {hari.map((item, index) => (
                  <Text key={`${item}-${index}`} className="flex-1 text-center text-xs font-bold text-[#607681]">
                    {item}
                  </Text>
                ))}
              </View>

              <View className="mt-2 flex-row flex-wrap">
                {calendarDays.map((date, index) => {
                  const active = date && selectedDate ? sameDate(date, selectedDate) : false;
                  return (
                    <Pressable
                      key={date ? date.toISOString() : `blank-${index}`}
                      className="mb-2 h-11 w-[14.285%] items-center justify-center"
                      disabled={!date}
                      onPress={() => {
                        if (date) {
                          onSelect(date);
                          onClose();
                        }
                      }}
                    >
                      {date ? (
                        <View className={`h-10 w-10 items-center justify-center rounded-full ${active ? 'bg-[#0C7A72]' : 'bg-white'}`}>
                          <Text className={`font-bold ${active ? 'text-white' : 'text-[#173B48]'}`}>{date.getDate()}</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {onClear ? (
            <Pressable
              className="mt-2 flex-row items-center justify-center rounded-2xl border border-[#DCE7ED] bg-white p-4"
              onPress={() => {
                onClear();
                onClose();
              }}
            >
              <Ionicons name="refresh-outline" size={18} color="#607681" />
              <Text className="ml-2 font-semibold text-[#607681]">Kosongkan Tarikh</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};
