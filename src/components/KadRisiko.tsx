import React from 'react';
import { Text, View } from 'react-native';
import { warnaRisiko } from '../constants/risk';
import { PenilaianHazard } from '../types';

export const KadRisiko = ({ item }: { item: PenilaianHazard }) => {
  return (
    <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-slate-900">{item.hazardName}</Text>
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: warnaRisiko(item.riskScore) }}>
          <Text className="text-xs font-bold text-white">{item.riskLevel}</Text>
        </View>
      </View>
      <Text className="text-xs text-slate-600">
        {item.locationName} - {item.activityName}
      </Text>
      <Text className="mt-2 text-sm text-slate-800">
        Kebarangkalian {item.likelihood} x Keterukan {item.severity} = {item.riskScore}
      </Text>
      <Text className="mt-2 text-sm text-slate-700">Cadangan: {item.recommendation}</Text>
      {item.buktiImejUrl ? <Text className="mt-2 text-xs text-blue-700">Bukti imej dilampirkan</Text> : null}
    </View>
  );
};
