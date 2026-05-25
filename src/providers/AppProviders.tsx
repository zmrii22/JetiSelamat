import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { ReportCartProvider } from '../context/ReportCartContext';
import { NotificationNavigationHandler } from './NotificationNavigationHandler';

export const AppProviders: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ReportCartProvider>
          <NotificationNavigationHandler />
          {children}
        </ReportCartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};
