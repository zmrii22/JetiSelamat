import React, { createContext, useContext, useMemo, useState } from 'react';
import { PenilaianHazard } from '../types';

interface ReportCartContextValue {
  cart: PenilaianHazard[];
  tambahKeCart: (item: PenilaianHazard) => void;
  buangDariCart: (id: string) => void;
  kosongkanCart: () => void;
}

const ReportCartContext = createContext<ReportCartContextValue | undefined>(undefined);

export const ReportCartProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [cart, setCart] = useState<PenilaianHazard[]>([]);

  const tambahKeCart = (item: PenilaianHazard) => setCart((prev) => [item, ...prev]);
  const buangDariCart = (id: string) => setCart((prev) => prev.filter((item) => item.id !== id));
  const kosongkanCart = () => setCart([]);

  const value = useMemo(
    () => ({ cart, tambahKeCart, buangDariCart, kosongkanCart }),
    [cart],
  );

  return <ReportCartContext.Provider value={value}>{children}</ReportCartContext.Provider>;
};

export const useReportCart = () => {
  const context = useContext(ReportCartContext);
  if (!context) {
    throw new Error('useReportCart mesti digunakan dalam ReportCartProvider');
  }
  return context;
};
