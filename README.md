# JetiSelamat Mobile App

Aplikasi mudah alih **HIRARC marin** untuk operasi keselamatan jeti.

JetiSelamat membantu staf pemeriksaan, admin jeti, dan master admin mengurus laporan hazard secara digital, cepat, dan berjejak.

## Teknologi Utama

- Expo + React Native (Expo Router)
- Firebase Authentication
- Firebase Realtime Database
- NativeWind (Tailwind untuk React Native)
- Expo Notifications
- Cloudinary (upload imej bukti)
- PDF/CSV export (laporan harian / bulanan / tahunan)

## Ciri Sistem

### Untuk Staf

- Log masuk / daftar akaun
- Dashboard staf (laporan hari ini, jumlah hazard, risiko tinggi hari ini)
- Borang Pemeriksaan HIRARC
  - Lokasi jeti (ikut bahagian bertugas)
  - Aktiviti, kluster, hazard
  - Skor risiko automatik (5x5)
  - Cadangan tindakan automatik
- Tambah bukti imej (thumbnail + preview)
- Hantar laporan ke admin jeti berkaitan
- Sejarah laporan bertingkat:
  - Tahun -> Bulan -> Hari -> Detail
- Eksport PDF/CSV mengikut tempoh

### Untuk Admin

- Dashboard admin moden
- Laporan hari ini (fokus `Belum Disemak`)
- Semakan laporan + maklum balas wajib
- Status semakan: `Telah Disemak` / `Belum Disemak`
- Pengumuman jeti (cipta, edit, padam)

### Untuk Master Admin

- Dashboard kelulusan permohonan admin
- Lulus / tolak permohonan admin
- Log keluar di bahagian atas dashboard

## Aliran Peranan

- `staff` -> aplikasi staf
- `admin` -> aplikasi admin
- `master_admin` -> aplikasi master admin

Akaun master admin tetap:

- Email: `zamrihamzah22@gmail.com`
- Password: `Zmrih_29`

## Struktur Ringkas Projek

```text
app/
  (auth)/
  (inspector)/
  (admin)/
  (master)/
src/
  components/
  config/
  context/
  screens/
  services/
  utils/
assets/
```

## Konfigurasi `.env`

Cipta fail `.env` (atau salin dari `.env.example`) dan isi nilai berikut:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_DATABASE_URL=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_EAS_PROJECT_ID=

EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=
EXPO_PUBLIC_CLOUDINARY_UNSIGNED_PRESET=
```

## Setup Tempatan

```bash
npm install
npx expo start --clear
```

## Android Push Notification (Penting)

Untuk Android, push notification **tidak** berjalan penuh dalam Expo Go (SDK baharu).
Guna development build:

```bash
npx expo install expo-dev-client
npx expo run:android
# atau guna EAS development build
```

Pastikan fail `google-services.json` wujud di root projek dan `app.json` telah dipautkan.

## Skrip NPM

```bash
npm run start
npm run android
npm run ios
npm run web
```

## Logik Risiko HIRARC

Skor dikira automatik:

```text
Skor Risiko = Kebarangkalian (1-5) x Keterukan (1-5)
```

Tahap risiko:

- `1-4` -> Rendah
- `5-12` -> Sederhana
- `15-25` -> Tinggi

## Eksport Laporan

- **Hari**: susunan hazard terperinci
- **Bulan**: susunan ikut hari
- **Tahun**: susunan ikut bulan

Semua eksport disediakan dalam PDF dan CSV.

## Nota Keselamatan

- Jangan commit token rahsia atau service account key ke GitHub.
- Guna `.env` untuk konfigurasi sensitif.

## Roadmap Cadangan

- SLA & reminder untuk laporan belum disemak
- Offline draft + sync automatik
- Audit trail tindakan admin
- Statistik trend risiko per jeti

## Repository

GitHub: [zmrii22/JetiSelamat](https://github.com/zmrii22/JetiSelamat)
