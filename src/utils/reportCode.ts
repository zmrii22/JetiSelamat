import { LaporanHirarc } from '../types';

const pad2 = (value: number) => String(value).padStart(2, '0');

const jettyCode = (locationName?: string) => {
  const value = (locationName ?? '').trim().toLowerCase();

  if (value.includes('tti')) return 'TTI';
  if (value.includes('setiu')) return 'SET';
  if (value.includes('besut')) return 'BST';
  return 'JET';
};

const timeParts = (timestamp: number) => {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());

  return { date: `${y}${m}${day}`, time: `${hh}${mm}${ss}` };
};

export const janaKodLaporan = (locationName: string, timestamp = Date.now()) => {
  const code = jettyCode(locationName);
  const parts = timeParts(timestamp);
  const suffix = String(Math.floor(10000 + Math.random() * 90000));
  return `${code}-${parts.date}-${parts.time}-${suffix}`;
};

export const dapatkanKodLaporan = (laporan: Pick<LaporanHirarc, 'id' | 'locationName' | 'createdAt'> & { reportCode?: string }) => {
  if (laporan.reportCode) {
    return laporan.reportCode;
  }

  const code = jettyCode(laporan.locationName);
  const parts = timeParts(laporan.createdAt || Date.now());
  const idSuffix = (laporan.id || '00000').replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase() || '00000';
  return `${code}-${parts.date}-${parts.time}-${idSuffix}`;
};
