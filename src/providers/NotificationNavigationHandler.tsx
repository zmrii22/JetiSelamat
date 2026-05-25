import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { routeDetailLaporanUntukPeranan, routePengumumanUntukPeranan } from '../services/routing';

type PendingAction =
  | { type: 'report'; reportId: string }
  | { type: 'announcement' };

const isExpoGoAndroid = () =>
  Platform.OS === 'android' &&
  (Constants.appOwnership === 'expo' || (Constants as any).executionEnvironment === 'storeClient');

const bacaAction = (response: any): PendingAction | null => {
  const data = response?.notification?.request?.content?.data as
    | { reportId?: unknown; jenis?: unknown; screen?: unknown }
    | undefined;

  if (typeof data?.reportId === 'string') {
    return { type: 'report', reportId: data.reportId };
  }

  const jenis = typeof data?.jenis === 'string' ? data.jenis.toLowerCase() : '';
  const screen = typeof data?.screen === 'string' ? data.screen.toLowerCase() : '';
  if (jenis === 'pengumuman' || screen === 'ruang-pengumuman') {
    return { type: 'announcement' };
  }

  return null;
};

export const NotificationNavigationHandler = () => {
  const { user, profile } = useAuth();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  useEffect(() => {
    if (isExpoGoAndroid()) {
      return;
    }

    let isMounted = true;
    let responseSub: { remove: () => void } | null = null;

    void (async () => {
      const Notifications = await import('expo-notifications');
      if (!isMounted) {
        return;
      }

      responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
        const action = bacaAction(response);
        if (action) {
          setPendingAction(action);
        }
      });

      const response = await Notifications.getLastNotificationResponseAsync();
      const action = bacaAction(response);
      if (action) {
        setPendingAction(action);
      }
    })();

    return () => {
      isMounted = false;
      responseSub?.remove();
    };
  }, []);

  useEffect(() => {
    if (!pendingAction || !user || !profile) {
      return;
    }

    if (pendingAction.type === 'report') {
      router.push({
        pathname: routeDetailLaporanUntukPeranan(profile.role) as any,
        params: { id: pendingAction.reportId },
      });
    } else {
      router.push(routePengumumanUntukPeranan(profile.role) as any);
    }

    setPendingAction(null);
    if (!isExpoGoAndroid()) {
      void import('expo-notifications').then((Notifications) =>
        Notifications.clearLastNotificationResponseAsync(),
      );
    }
  }, [pendingAction, profile, user]);

  return null;
};
