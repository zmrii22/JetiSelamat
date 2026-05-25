import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  User,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { DataSnapshot, get, getDatabase, onValue, push, ref, remove, set, update } from 'firebase/database';
import {
  Aktiviti,
  CadanganRisiko,
  DataHirarc,
  Hazard,
  Kluster,
  LaporanHirarc,
  Lokasi,
  Pengumuman,
  PermohonanAdmin,
  ProfilPengguna,
  SemakanFeedback,
} from '../types';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

export const MASTER_ADMIN_EMAIL = (process.env.EXPO_PUBLIC_MASTER_ADMIN_EMAIL ?? '').trim().toLowerCase();
export const MASTER_ADMIN_PASSWORD = process.env.EXPO_PUBLIC_MASTER_ADMIN_PASSWORD ?? '';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

const buangUndefined = <T>(input: T): T => {
  if (Array.isArray(input)) {
    return input.map((item) => buangUndefined(item)) as T;
  }

  if (input !== null && typeof input === 'object') {
    const result: Record<string, unknown> = {};
    Object.entries(input as Record<string, unknown>).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }

      result[key] = buangUndefined(value);
    });
    return result as T;
  }

  return input;
};

const toList = <T extends { id: string }>(value: Record<string, Omit<T, 'id'>> | null | undefined): T[] => {
  if (!value) {
    return [];
  }

  return Object.entries(value).map(([id, row]) => ({ id, ...(row as object) } as T));
};

const isMasterCredential = (email: string, password: string) =>
  Boolean(MASTER_ADMIN_EMAIL && MASTER_ADMIN_PASSWORD) &&
  email.trim().toLowerCase() === MASTER_ADMIN_EMAIL &&
  password === MASTER_ADMIN_PASSWORD;

const normalizeJetty = (value?: string) => {
  if (!value) return '';
  const v = value.trim().toLowerCase();
  if (v.includes('besut')) return 'besut';
  if (v.includes('setiu')) return 'setiu';
  if (v.includes('tti')) return 'tti';
  return v;
};

export const authApi = {
  onAuthStateChanged: (handler: (user: User | null) => void) => onAuthStateChanged(auth, handler),
  getCurrentUser: () => auth.currentUser,

  signIn: async (email: string, password: string) => {
    try {
      return await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: any) {
      if (isMasterCredential(email, password) && error?.code === 'auth/invalid-credential') {
        const created = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await dbApi.simpanProfilPengguna(created.user.uid, {
          uid: created.user.uid,
          email: email.trim().toLowerCase(),
          role: 'master_admin',
          mohonAdmin: false,
          statusPermohonanAdmin: null,
          updatedAt: Date.now(),
        });
        return created;
      }
      throw error;
    }
  },

  signUp: (email: string, password: string) => createUserWithEmailAndPassword(auth, email.trim(), password),
  resetPassword: async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  },
  signOut: () => signOut(auth),
};

export const dbApi = {
  simpanProfilPengguna: async (uid: string, profile: ProfilPengguna) => {
    await set(
      ref(db, `users/${uid}`),
      buangUndefined({
      ...profile,
      updatedAt: Date.now(),
      }),
    );
  },

  kemasKiniProfilPengguna: async (uid: string, patch: Partial<ProfilPengguna>) => {
    await update(
      ref(db, `users/${uid}`),
      buangUndefined({
      ...patch,
      updatedAt: Date.now(),
      }),
    );
  },

  dapatkanProfilPengguna: async (uid: string): Promise<ProfilPengguna | null> => {
    const snapshot = await get(ref(db, `users/${uid}`));
    return snapshot.exists() ? (snapshot.val() as ProfilPengguna) : null;
  },

  simpanTokenPush: async (uid: string, token: string | null) => {
    if (token) {
      const allUsersSnap = await get(ref(db, 'users'));
      if (allUsersSnap.exists()) {
        const users = allUsersSnap.val() as Record<string, ProfilPengguna>;
        const updates: Record<string, unknown> = {};

        Object.entries(users).forEach(([otherUid, item]) => {
          if (otherUid !== uid && item.expoPushToken && item.expoPushToken === token) {
            updates[`users/${otherUid}/expoPushToken`] = null;
            updates[`users/${otherUid}/updatedAt`] = Date.now();
          }
        });

        if (Object.keys(updates).length > 0) {
          await update(ref(db), buangUndefined(updates));
        }
      }
    }

    await update(
      ref(db, `users/${uid}`),
      buangUndefined({
        expoPushToken: token,
        updatedAt: Date.now(),
      }),
    );
  },

  ambilTokenPushAdmin: async (lokasi?: string) => {
    const snapshot = await get(ref(db, 'users'));
    if (!snapshot.exists()) {
      return [] as string[];
    }

    const users = snapshot.val() as Record<string, ProfilPengguna>;
    return Array.from(
      new Set(
        Object.values(users)
      .filter((item) => {
        const adaToken = Boolean(item.expoPushToken);
        if (!adaToken) {
          return false;
        }

        if (item.role === 'master_admin') {
          return true;
        }

        if (item.role !== 'admin') {
          return false;
        }

        if (!lokasi) {
          return true;
        }

        return normalizeJetty(item.bahagian) === normalizeJetty(lokasi);
      })
      .map((item) => item.expoPushToken as string),
      ),
    );
  },

  ambilTokenPushPengumumanJeti: async (lokasi?: string) => {
    const snapshot = await get(ref(db, 'users'));
    if (!snapshot.exists()) {
      return [] as string[];
    }

    const users = snapshot.val() as Record<string, ProfilPengguna>;
    const keyLokasi = normalizeJetty(lokasi);

    return Array.from(
      new Set(
        Object.values(users)
      .filter((item) => Boolean(item.expoPushToken))
      .filter((item) => {
        if (item.role === 'master_admin') {
          return true;
        }

        if (!keyLokasi) {
          return true;
        }

        return normalizeJetty(item.bahagian) === keyLokasi;
      })
      .map((item) => item.expoPushToken as string),
      ),
    );
  },

  simpanPermohonanAdmin: async (uid: string, email: string) => {
    const payload: PermohonanAdmin = {
      uid,
      email,
      status: 'pending',
      requestedAt: Date.now(),
    };

    await set(ref(db, `adminApplications/${uid}`), buangUndefined(payload));
    await update(
      ref(db, `users/${uid}`),
      buangUndefined({
      mohonAdmin: true,
      statusPermohonanAdmin: 'pending',
      updatedAt: Date.now(),
      }),
    );
  },

  subscribePermohonanAdmin: (callback: (list: PermohonanAdmin[]) => void) => {
    const targetRef = ref(db, 'adminApplications');
    return onValue(targetRef, (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }

      const all = snapshot.val() as Record<string, PermohonanAdmin>;
      const list = Object.values(all).sort((a, b) => b.requestedAt - a.requestedAt);
      callback(list);
    });
  },

  luluskanAdmin: async (uid: string, reviewedBy: string) => {
    await update(
      ref(db, `adminApplications/${uid}`),
      buangUndefined({
      status: 'approved',
      reviewedAt: Date.now(),
      reviewedBy,
      }),
    );

    await update(
      ref(db, `users/${uid}`),
      buangUndefined({
      role: 'admin',
      statusPermohonanAdmin: 'approved',
      updatedAt: Date.now(),
      }),
    );
  },

  tolakAdmin: async (uid: string, reviewedBy: string) => {
    await update(
      ref(db, `adminApplications/${uid}`),
      buangUndefined({
      status: 'rejected',
      reviewedAt: Date.now(),
      reviewedBy,
      }),
    );

    await update(
      ref(db, `users/${uid}`),
      buangUndefined({
      role: 'inspector',
      statusPermohonanAdmin: 'rejected',
      updatedAt: Date.now(),
      }),
    );
  },

  ambilDataHirarc: async (): Promise<DataHirarc> => {
    const [locationsSnap, activitiesSnap, clustersSnap, hazardsSnap, recommendationsSnap] = await Promise.all([
      get(ref(db, 'locations')),
      get(ref(db, 'activities')),
      get(ref(db, 'clusters')),
      get(ref(db, 'hazards')),
      get(ref(db, 'recommendations')),
    ]);

    return {
      locations: toList<Lokasi>((locationsSnap.val() ?? null) as Record<string, Omit<Lokasi, 'id'>>),
      activities: toList<Aktiviti>((activitiesSnap.val() ?? null) as Record<string, Omit<Aktiviti, 'id'>>),
      clusters: toList<Kluster>((clustersSnap.val() ?? null) as Record<string, Omit<Kluster, 'id'>>),
      hazards: toList<Hazard>((hazardsSnap.val() ?? null) as Record<string, Omit<Hazard, 'id'>>),
      recommendations: (recommendationsSnap.val() ?? []) as CadanganRisiko[],
    };
  },

  hantarLaporan: async (payload: Omit<LaporanHirarc, 'id'>) => {
    const cadanganKey = (payload.reportCode || '').trim();
    if (!cadanganKey) {
      const newRef = push(ref(db, 'reports'));
      await set(newRef, buangUndefined(payload));
      return newRef.key;
    }

    let keyToSave = cadanganKey;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const targetRef = ref(db, `reports/${keyToSave}`);
      const existing = await get(targetRef);
      if (!existing.exists()) {
        await set(
          targetRef,
          buangUndefined({
            ...payload,
            reportCode: keyToSave,
          }),
        );
        return keyToSave;
      }

      const nextSuffix = String(Math.floor(10000 + Math.random() * 90000));
      keyToSave = cadanganKey.replace(/-\d{5}$/, `-${nextSuffix}`);
    }

    const fallbackRef = push(ref(db, 'reports'));
    await set(fallbackRef, buangUndefined(payload));
    return fallbackRef.key;
  },

  tambahFeedbackLaporan: async (reportId: string, feedback: Omit<SemakanFeedback, 'id' | 'createdAt'>) => {
    const listRef = ref(db, `reports/${reportId}/feedbacks`);
    const currentSnap = await get(listRef);
    const currentRaw = currentSnap.exists() ? currentSnap.val() : [];
    const currentList = Array.isArray(currentRaw)
      ? (currentRaw as SemakanFeedback[])
      : (Object.values(currentRaw ?? {}) as SemakanFeedback[]);

    const nextFeedback: SemakanFeedback = {
      id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      adminUid: feedback.adminUid,
      adminEmail: feedback.adminEmail,
      mesej: feedback.mesej.trim(),
      createdAt: Date.now(),
    };

    await update(
      ref(db, `reports/${reportId}`),
      buangUndefined({
        feedbacks: [...currentList, nextFeedback],
      }),
    );
  },

  sahkanSemakanLaporan: async (
    reportId: string,
    reviewedBy: string,
    reviewedByEmail: string,
    pilihan: { wajibFeedback?: boolean } = {},
  ) => {
    if (pilihan.wajibFeedback) {
      const snapshot = await get(ref(db, `reports/${reportId}/feedbacks`));
      const rawFeedbacks = snapshot.exists() ? snapshot.val() : [];
      const feedbacks = Array.isArray(rawFeedbacks)
        ? (rawFeedbacks as SemakanFeedback[])
        : (Object.values(rawFeedbacks ?? {}) as SemakanFeedback[]);
      if (feedbacks.length === 0) {
        throw new Error('Sila tambah maklum balas terlebih dahulu sebelum sahkan semakan.');
      }
    }

    await update(
      ref(db, `reports/${reportId}`),
      buangUndefined({
        reviewedAt: Date.now(),
        reviewedBy,
        reviewedByEmail,
      }),
    );
  },

  subscribeLaporan: (callback: (list: LaporanHirarc[]) => void) => {
    const targetRef = ref(db, 'reports');
    return onValue(targetRef, (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }

      const raw = snapshot.val() as Record<string, Omit<LaporanHirarc, 'id'>>;
      const list = Object.entries(raw)
        .map(([id, row]) => ({ id, ...row }))
        .sort((a, b) => b.createdAt - a.createdAt);

      callback(list);
    });
  },

  subscribePengumuman: (callback: (list: Pengumuman[]) => void) => {
    const targetRef = ref(db, 'announcements');
    return onValue(targetRef, (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }

      const raw = snapshot.val() as Record<string, Omit<Pengumuman, 'id'>>;
      const list = Object.entries(raw)
        .map(([id, row]) => ({ id, ...row }))
        .sort((a, b) => b.createdAt - a.createdAt);

      callback(list);
    });
  },

  ciptaPengumuman: async (payload: Omit<Pengumuman, 'id' | 'createdAt'>) => {
    const newRef = push(ref(db, 'announcements'));
    await set(
      newRef,
      buangUndefined({
        ...payload,
        createdAt: Date.now(),
      }),
    );
    return newRef.key;
  },

  kemasKiniPengumuman: async (
    id: string,
    patch: Partial<{
      tajuk: string;
      kandungan: string;
      imageUrl: string | null;
    }>,
  ) => {
    await update(ref(db, `announcements/${id}`), buangUndefined(patch));
  },

  padamPengumuman: async (id: string) => {
    await remove(ref(db, `announcements/${id}`));
  },
};

export const isFirebaseConfigured = () =>
  Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.databaseURL &&
      firebaseConfig.projectId &&
      firebaseConfig.storageBucket &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId,
  );
