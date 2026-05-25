import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { User } from 'firebase/auth';
import { authApi, dbApi, isFirebaseConfigured, MASTER_ADMIN_EMAIL, MASTER_ADMIN_PASSWORD } from '../config/firebase';
import { padamKredensialSelamat } from '../services/biometricVault';
import {
  daftarNotifikasiPeranti,
  langganPerubahanPushToken,
  padamTokenPushPeranti,
} from '../services/notificationHelper';
import { PerananPengguna, ProfilPengguna } from '../types';
import { mesejRalatMesra } from '../utils/errorMessages';

interface AuthContextValue {
  user: User | null;
  profile: ProfilPengguna | null;
  loading: boolean;
  logMasuk: (email: string, password: string) => Promise<ProfilPengguna>;
  daftar: (
    namaPenuh: string,
    email: string,
    password: string,
    bahagian: string,
    mohonAdmin: boolean,
  ) => Promise<ProfilPengguna>;
  hantarResetPassword: (email: string) => Promise<void>;
  kemasKiniProfil: (patch: Partial<ProfilPengguna>) => Promise<void>;
  logKeluar: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const ENABLE_BACKGROUND_AUTO_LOGOUT = false;
  const AUTO_LOGOUT_BACKGROUND_MS = 2 * 60 * 1000;
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfilPengguna | null>(null);
  const [loading, setLoading] = useState(true);
  const timerAutoLogoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sedangLogKeluarRef = useRef(false);

  const prosesLogKeluar = async (uid?: string | null) => {
    if (sedangLogKeluarRef.current) {
      return;
    }

    sedangLogKeluarRef.current = true;
    try {
      if (uid) {
        await padamTokenPushPeranti(uid);
      }
      await authApi.signOut();
      await padamKredensialSelamat();
      setProfile(null);
    } finally {
      sedangLogKeluarRef.current = false;
    }
  };

  useEffect(() => {
    const unsubscribe = authApi.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        return;
      }

      const profil = await dbApi.dapatkanProfilPengguna(currentUser.uid);
      if (profil) {
        setProfile(profil);
      }
    });

    const bootstrap = async () => {
      try {
        if (!isFirebaseConfigured()) {
          Alert.alert('Konfigurasi Firebase belum lengkap', 'Sila isi semua EXPO_PUBLIC_FIREBASE_* dahulu.');
        }

        const uidSediaAda = authApi.getCurrentUser()?.uid;
        if (uidSediaAda) {
          await padamTokenPushPeranti(uidSediaAda);
        }

        await authApi.signOut();
      } catch {
        // Skip bootstrap error supaya UI tetap boleh dibuka.
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    let alive = true;
    let unsubscribeTokenListener: (() => void) | undefined;
    void (async () => {
      unsubscribeTokenListener = await langganPerubahanPushToken(user.uid);
      if (!alive) {
        unsubscribeTokenListener?.();
      }
    })();

    return () => {
      alive = false;
      unsubscribeTokenListener?.();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!ENABLE_BACKGROUND_AUTO_LOGOUT) {
      return;
    }

    const subscription = AppState.addEventListener('change', (state) => {
      if (!user?.uid) {
        return;
      }

      // Jangan trigger auto logout ketika "inactive" (contoh: dialog permission terbuka).
      // Logout hanya bila app betul-betul masuk background.
      if (state === 'background') {
        if (timerAutoLogoutRef.current) {
          clearTimeout(timerAutoLogoutRef.current);
        }

        timerAutoLogoutRef.current = setTimeout(() => {
          void prosesLogKeluar(user.uid);
        }, AUTO_LOGOUT_BACKGROUND_MS);
        return;
      }

      if (state === 'active' && timerAutoLogoutRef.current) {
        clearTimeout(timerAutoLogoutRef.current);
        timerAutoLogoutRef.current = null;
      }
    });

    return () => {
      subscription.remove();
      if (timerAutoLogoutRef.current) {
        clearTimeout(timerAutoLogoutRef.current);
        timerAutoLogoutRef.current = null;
      }
    };
  }, [user?.uid]);

  const tentukanPeranan = (email: string, password: string): PerananPengguna => {
    if (email.trim().toLowerCase() === MASTER_ADMIN_EMAIL && password === MASTER_ADMIN_PASSWORD) {
      return 'master_admin';
    }
    return 'inspector';
  };

  const logMasuk = async (email: string, password: string) => {
    try {
      const credential = await authApi.signIn(email, password);
      const uid = credential.user.uid;

      const perananAsas = tentukanPeranan(email, password);
      const profilSediaAda = await dbApi.dapatkanProfilPengguna(uid);

      const profil: ProfilPengguna = {
        uid,
        namaPenuh: profilSediaAda?.namaPenuh,
        email: (credential.user.email ?? email).toLowerCase(),
        bahagian: profilSediaAda?.bahagian,
        avatarUrl: profilSediaAda?.avatarUrl,
        tarikhLahir: profilSediaAda?.tarikhLahir,
        nomborTelefon: profilSediaAda?.nomborTelefon,
        jantina: profilSediaAda?.jantina,
        alamat: profilSediaAda?.alamat,
        biodata: profilSediaAda?.biodata,
        role: perananAsas === 'master_admin' ? 'master_admin' : profilSediaAda?.role ?? 'inspector',
        mohonAdmin: profilSediaAda?.mohonAdmin ?? false,
        statusPermohonanAdmin: profilSediaAda?.statusPermohonanAdmin ?? null,
        expoPushToken: null,
        updatedAt: Date.now(),
      };

      await dbApi.simpanProfilPengguna(uid, profil);
      try {
        await padamTokenPushPeranti(uid);
        await daftarNotifikasiPeranti(uid);
      } catch {
        // Jangan gagalkan log masuk jika token notifikasi gagal diperoleh.
      }

      setProfile(profil);
      return profil;
    } catch (error) {
      throw new Error(mesejRalatMesra(error, 'Emel atau kata laluan tidak tepat.'));
    }
  };

  const daftar = async (
    namaPenuh: string,
    email: string,
    password: string,
    bahagian: string,
    mohonAdmin: boolean,
  ) => {
    try {
      const credential = await authApi.signUp(email, password);

      const profilBaru: ProfilPengguna = {
        uid: credential.user.uid,
        namaPenuh: namaPenuh.trim(),
        email: (credential.user.email ?? email).toLowerCase(),
        bahagian,
        role: 'inspector',
        mohonAdmin,
        statusPermohonanAdmin: mohonAdmin ? 'pending' : null,
        updatedAt: Date.now(),
      };

      await dbApi.simpanProfilPengguna(credential.user.uid, profilBaru);

      if (mohonAdmin) {
        await dbApi.simpanPermohonanAdmin(credential.user.uid, profilBaru.email);
      }

      try {
        await padamTokenPushPeranti(credential.user.uid);
        await daftarNotifikasiPeranti(credential.user.uid);
      } catch {
        // Jangan gagalkan proses daftar jika token notifikasi gagal diperoleh.
      }

      setProfile(profilBaru);
      return profilBaru;
    } catch (error) {
      throw new Error(mesejRalatMesra(error, 'Maklumat pendaftaran tidak sah. Sila semak semula.'));
    }
  };

  const hantarResetPassword = async (email: string) => {
    try {
      await authApi.resetPassword(email);
    } catch (error) {
      throw new Error(mesejRalatMesra(error, 'Tidak dapat hantar pautan reset sekarang.'));
    }
  };

  const kemasKiniProfil = async (patch: Partial<ProfilPengguna>) => {
    if (!user || !profile) {
      return;
    }

    await dbApi.kemasKiniProfilPengguna(user.uid, patch);
    setProfile({
      ...profile,
      ...patch,
      updatedAt: Date.now(),
    });
  };

  const logKeluar = async () => {
    if (timerAutoLogoutRef.current) {
      clearTimeout(timerAutoLogoutRef.current);
      timerAutoLogoutRef.current = null;
    }

    await prosesLogKeluar(user?.uid);
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      logMasuk,
      daftar,
      hantarResetPassword,
      kemasKiniProfil,
      logKeluar,
    }),
    [user, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth mesti digunakan dalam AuthProvider');
  }
  return context;
};
