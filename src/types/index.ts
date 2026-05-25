export type PerananPengguna = 'inspector' | 'admin' | 'master_admin';
export type TahapRisiko = 'Rendah' | 'Sederhana' | 'Tinggi';

export interface Lokasi {
  id: string;
  name: string;
}

export interface Aktiviti {
  id: string;
  name: string;
}

export interface Kluster {
  id: string;
  name: string;
  description?: string;
}

export interface Hazard {
  id: string;
  name: string;
  activity_id: string;
  cluster_id: string;
}

export interface CadanganRisiko {
  hazard: string;
  Low: string;
  Medium: string;
  High: string;
}

export interface DataHirarc {
  locations: Lokasi[];
  activities: Aktiviti[];
  clusters: Kluster[];
  hazards: Hazard[];
  recommendations: CadanganRisiko[];
}

export interface PenilaianHazard {
  id: string;
  locationId: string;
  locationName: string;
  activityId: string;
  activityName: string;
  clusterId: string;
  clusterName: string;
  hazardId: string;
  hazardName: string;
  likelihood: number;
  severity: number;
  riskScore: number;
  riskLevel: TahapRisiko;
  recommendation: string;
  buktiImejUrl?: string;
  buktiImejUrls?: string[];
  createdAt: number;
}

export interface LaporanHirarc {
  id: string;
  reportCode?: string;
  inspectorUid: string;
  inspectorEmail: string;
  locationId: string;
  locationName: string;
  hazards: PenilaianHazard[];
  hasHighRisk: boolean;
  reviewedAt?: number;
  reviewedBy?: string;
  reviewedByEmail?: string;
  feedbacks?: SemakanFeedback[];
  createdAt: number;
}

export interface SemakanFeedback {
  id: string;
  adminUid: string;
  adminEmail: string;
  mesej: string;
  createdAt: number;
}

export interface ProfilPengguna {
  uid: string;
  namaPenuh?: string;
  email: string;
  bahagian?: string;
  avatarUrl?: string | null;
  tarikhLahir?: string;
  nomborTelefon?: string;
  jantina?: string;
  alamat?: string;
  biodata?: string;
  role: PerananPengguna;
  expoPushToken?: string | null;
  mohonAdmin?: boolean;
  statusPermohonanAdmin?: 'pending' | 'approved' | 'rejected' | null;
  updatedAt: number;
}

export interface PermohonanAdmin {
  uid: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
}

export interface Pengumuman {
  id: string;
  tajuk: string;
  kandungan: string;
  locationName?: string;
  imageUrl?: string;
  createdBy?: string;
  createdAt: number;
}
