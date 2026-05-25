import { PerananPengguna } from '../types';

export const routeUntukPeranan = (role: PerananPengguna) => {
  if (role === 'master_admin') {
    return '/(master)/dashboard';
  }

  if (role === 'admin') {
    return '/(admin)/dashboard';
  }

  return '/(inspector)/dashboard';
};

export const routeDetailLaporanUntukPeranan = (role: PerananPengguna) => {
  if (role === 'master_admin') {
    return '/(master)/laporan-detail';
  }

  if (role === 'admin') {
    return '/(admin)/laporan-detail';
  }

  return '/(inspector)/laporan-detail';
};

export const routePengumumanUntukPeranan = (role: PerananPengguna) => {
  if (role === 'master_admin') {
    return '/(master)/ruang-pengumuman';
  }

  if (role === 'admin') {
    return '/(admin)/ruang-pengumuman';
  }

  return '/(inspector)/ruang-pengumuman';
};
