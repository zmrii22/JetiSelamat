import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const KUNCI_KREDENSIAL = 'jetiselamat_kredensial';

export interface KredensialSimpan {
  email: string;
  password: string;
}

export const sokongBiometrik = async () => {
  const adaPerkakasan = await LocalAuthentication.hasHardwareAsync();
  const sudahDaftar = await LocalAuthentication.isEnrolledAsync();
  return adaPerkakasan && sudahDaftar;
};

export const simpanKredensialSelamat = async (email: string, password: string) => {
  const payload: KredensialSimpan = { email, password };
  await SecureStore.setItemAsync(KUNCI_KREDENSIAL, JSON.stringify(payload), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    requireAuthentication: true,
    authenticationPrompt: 'Sahkan identiti untuk simpan auto isi',
  });
};

export const ambilKredensialSelamat = async (): Promise<KredensialSimpan | null> => {
  const raw = await SecureStore.getItemAsync(KUNCI_KREDENSIAL, {
    requireAuthentication: true,
    authenticationPrompt: 'Sahkan identiti untuk auto isi log masuk',
  });

  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as KredensialSimpan;
};

export const padamKredensialSelamat = async () => {
  await SecureStore.deleteItemAsync(KUNCI_KREDENSIAL);
};
