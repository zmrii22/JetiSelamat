import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { dbApi } from '../config/firebase';

const ENDPOINT_PUSH = 'https://exp.host/--/api/v2/push/send';
let handlerDidSet = false;

const dapatkanProjectId = () =>
  Constants.expoConfig?.extra?.eas?.projectId ??
  Constants.easConfig?.projectId ??
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

const isExpoGoAndroid = () =>
  Platform.OS === 'android' &&
  (Constants.appOwnership === 'expo' || (Constants as any).executionEnvironment === 'storeClient');

const getNotifications = async () => {
  const Notifications = await import('expo-notifications');

  if (!handlerDidSet) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'JetiSelamat Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0C7A72',
        sound: 'default',
      });
    }
    handlerDidSet = true;
  }

  return Notifications;
};

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const daftarNotifikasiPeranti = async (uid: string) => {
  try {
    if (isExpoGoAndroid()) {
      return null;
    }

    const Notifications = await getNotifications();
    const statusAwal = await Notifications.getPermissionsAsync();
    let statusAkhir = statusAwal.status;

    if (statusAwal.status !== 'granted') {
      const minta = await Notifications.requestPermissionsAsync();
      statusAkhir = minta.status;
    }

    if (statusAkhir !== 'granted') {
      return null;
    }

    const projectId = dapatkanProjectId();
    if (!projectId) {
      console.warn('[Push] projectId EAS tiada. Token push tidak dapat dijana.');
      return null;
    }

    let token = '';
    for (let cubaan = 1; cubaan <= 3; cubaan += 1) {
      try {
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        if (token) {
          break;
        }
      } catch (error) {
        if (cubaan === 3) {
          throw error;
        }
        await sleep(700 * cubaan);
      }
    }

    if (!token) {
      return null;
    }

    await dbApi.simpanTokenPush(uid, token);
    return token;
  } catch (error: any) {
    const msg = String(error?.message ?? error ?? '');
    if (msg.toLowerCase().includes('default firebaseapp is not initialized')) {
      console.warn(
        '[Push] Android Firebase belum initialize. Sila letak google-services.json di root projek dan set android.googleServicesFile dalam app.json, kemudian rebuild dev client.',
      );
    }
    console.warn('[Push] Gagal daftar token push:', error);
    return null;
  }
};

export const langganPerubahanPushToken = async (uid: string) => {
  if (isExpoGoAndroid()) {
    return () => {};
  }

  try {
    const Notifications = await getNotifications();
    const sub = Notifications.addPushTokenListener(async (tokenInfo) => {
      const token = tokenInfo.data?.trim();
      if (!token) {
        return;
      }
      await dbApi.simpanTokenPush(uid, token);
    });

    return () => sub.remove();
  } catch {
    return () => {};
  }
};

export const padamTokenPushPeranti = async (uid: string) => {
  try {
    await dbApi.simpanTokenPush(uid, null);
  } catch {
    // Abaikan supaya proses log keluar tidak terganggu.
  }
};

export const hantarPush = async (
  to: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) => {
  await fetch(ENDPOINT_PUSH, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to,
      title,
      body,
      data,
      channelId: 'default',
      sound: 'default',
      priority: 'high',
    }),
  });
};

const dedupeTokens = (tokens: string[]) =>
  Array.from(new Set(tokens.map((token) => token.trim()).filter(Boolean)));

export const maklumAdminRisikoTinggi = async (lokasi: string, hazard: string, reportId: string) => {
  const tokens = dedupeTokens(await dbApi.ambilTokenPushAdmin(lokasi));

  await Promise.all(
    tokens.map((token) =>
      hantarPush(
        token,
        'Amaran Risiko Tinggi JetiSelamat',
        `Risiko tinggi dikesan di ${lokasi}: ${hazard}`,
        { lokasi, hazard, tahap: 'tinggi', reportId, screen: 'laporan-detail' },
      ),
    ),
  );
};

export const maklumPengumumanBaharu = async (
  lokasi: string | undefined,
  tajuk: string,
  announcementId?: string,
) => {
  const tokens = dedupeTokens(await dbApi.ambilTokenPushPengumumanJeti(lokasi));
  const labelLokasi = lokasi?.trim() ? lokasi : 'Semua Jeti';

  await Promise.all(
    tokens.map((token) =>
      hantarPush(
        token,
        'Pengumuman Baharu JetiSelamat',
        `${labelLokasi}: ${tajuk}`,
        {
          screen: 'ruang-pengumuman',
          jenis: 'pengumuman',
          announcementId,
          lokasi: labelLokasi,
        },
      ),
    ),
  );
};
