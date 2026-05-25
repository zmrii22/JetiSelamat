import { CadanganRisiko, TahapRisiko } from '../types';

export const kiraRisiko = (likelihood: number, severity: number) => {
  const score = likelihood * severity;

  if (score >= 15) {
    return { score, level: 'Tinggi' as TahapRisiko };
  }

  if (score >= 5) {
    return { score, level: 'Sederhana' as TahapRisiko };
  }

  return { score, level: 'Rendah' as TahapRisiko };
};

export const warnaRisiko = (score: number) => {
  if (score >= 15) {
    return '#DC2626';
  }

  if (score >= 5) {
    return '#F59E0B';
  }

  return '#16A34A';
};

const normal = (text: string) => text.toLowerCase().replace(/\s+/g, ' ').trim();

export const cariCadangan = (
  hazardName: string,
  level: TahapRisiko,
  recommendations: CadanganRisiko[],
) => {
  const mapLevel = level === 'Rendah' ? 'Low' : level === 'Sederhana' ? 'Medium' : 'High';

  const target = normal(hazardName);
  const matched = recommendations.find((item) => {
    const source = normal(item.hazard);
    return target.includes(source) || source.includes(target);
  });

  if (matched?.[mapLevel]) {
    return matched[mapLevel];
  }

  if (level === 'Tinggi') {
    return 'Hentikan kerja serta-merta, kawal kawasan dan maklumkan penyelia.';
  }

  if (level === 'Sederhana') {
    return 'Laksanakan kawalan tambahan dan buat semakan semula sebelum operasi diteruskan.';
  }

  return 'Teruskan pemantauan berkala dan kekalkan kawalan sedia ada.';
};
