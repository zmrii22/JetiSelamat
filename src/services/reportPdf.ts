import { Asset } from 'expo-asset';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { LaporanHirarc } from '../types';
import { dapatkanKodLaporan } from '../utils/reportCode';

const formatTarikhMasa = (timestamp?: number) =>
  timestamp
    ? new Date(timestamp).toLocaleString('ms-MY', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

const escapeHtml = (text?: string) =>
  (text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const toDataUri = async () => {
  const logoAsset = Asset.fromModule(require('../../assets/jetiselamat.jpeg'));
  await logoAsset.downloadAsync();
  const logoUri = logoAsset.localUri ?? logoAsset.uri;
  const response = await fetch(logoUri);
  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Gagal membaca aset logo.'));
    reader.readAsDataURL(blob);
  });
};

const htmlLaporan = (laporan: LaporanHirarc, logoDataUri: string, namaProfil?: string) => {
  const kodLaporan = dapatkanKodLaporan({
    id: laporan.id,
    locationName: laporan.locationName,
    createdAt: laporan.createdAt,
    reportCode: laporan.reportCode,
  });

  const hazardsHtml = laporan.hazards
    .map(
      (hazard, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(hazard.activityName)}</td>
          <td>${escapeHtml(hazard.clusterName)}</td>
          <td>${escapeHtml(hazard.hazardName)}</td>
          <td>${hazard.likelihood}</td>
          <td>${hazard.severity}</td>
          <td>${hazard.riskScore}</td>
          <td>${escapeHtml(hazard.riskLevel)}</td>
          <td>${escapeHtml(hazard.recommendation)}</td>
        </tr>
      `,
    )
    .join('');

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; color: #173B48; padding: 24px; }
        .header { display:flex; align-items:center; border-bottom:2px solid #0E6B68; padding-bottom:12px; margin-bottom:18px; }
        .logo { width:58px; height:58px; border-radius:29px; margin-right:12px; object-fit:cover; border: 1px solid #B7D1DD; }
        .title { margin:0; color:#0E4457; font-size:26px; }
        .subtitle { margin:2px 0 0; color:#607681; font-size:12px; }
        .card { border:1px solid #DCE7ED; border-radius:10px; padding:12px; margin-bottom:10px; background:#F8FBFC; }
        .card-row { display:flex; gap:10px; }
        .card-item { flex:1; }
        .label { font-size:10px; text-transform:uppercase; color:#607681; margin-bottom:2px; }
        .value { font-size:13px; font-weight:bold; color:#173B48; }
        .status { font-size:11px; font-weight:bold; color:${laporan.reviewedAt ? '#15803D' : '#B42318'}; }
        table { width:100%; border-collapse:collapse; margin-top:12px; font-size:11px; }
        th, td { border:1px solid #DCE7ED; padding:7px; vertical-align:top; }
        th { background:#0E4457; color:#fff; text-align:left; }
        .footer { margin-top:20px; font-size:10px; color:#607681; text-align:right; }
      </style>
    </head>
    <body>
      <div class="header">
        <img class="logo" src="${logoDataUri}" />
        <div>
          <h1 class="title">JetiSelamat</h1>
          <p class="subtitle">Laporan Rasmi Pemeriksaan HIRARC</p>
        </div>
      </div>

      <div class="card">
        <div class="card-row">
          <div class="card-item">
            <div class="label">ID Laporan</div>
            <div class="value">${escapeHtml(kodLaporan)}</div>
          </div>
          <div class="card-item">
            <div class="label">Lokasi Jeti</div>
            <div class="value">${escapeHtml(laporan.locationName)}</div>
          </div>
          <div class="card-item">
            <div class="label">Tarikh/Masa Hantar</div>
            <div class="value">${escapeHtml(formatTarikhMasa(laporan.createdAt))}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-row">
          <div class="card-item">
            <div class="label">Pemeriksa</div>
            <div class="value">${escapeHtml(namaProfil || laporan.inspectorEmail)}</div>
          </div>
          <div class="card-item">
            <div class="label">Emel Pemeriksa</div>
            <div class="value">${escapeHtml(laporan.inspectorEmail)}</div>
          </div>
          <div class="card-item">
            <div class="label">Status Semakan</div>
            <div class="status">${laporan.reviewedAt ? `Telah disemak (${escapeHtml(formatTarikhMasa(laporan.reviewedAt))})` : 'Belum disemak'}</div>
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Aktiviti</th>
            <th>Kluster</th>
            <th>Hazard</th>
            <th>L</th>
            <th>S</th>
            <th>Skor</th>
            <th>Tahap</th>
            <th>Cadangan Tindakan</th>
          </tr>
        </thead>
        <tbody>
          ${hazardsHtml}
        </tbody>
      </table>

      <div class="footer">
        Dijana oleh JetiSelamat pada ${escapeHtml(formatTarikhMasa(Date.now()))}
      </div>
    </body>
  </html>
  `;
};

export const eksportLaporanPdf = async (laporan: LaporanHirarc, namaProfil?: string) => {
  const logoDataUri = await toDataUri();
  const html = htmlLaporan(laporan, logoDataUri, namaProfil);
  const result = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Eksport Laporan HIRARC (PDF)',
      UTI: 'com.adobe.pdf',
    });
  }

  return result.uri;
};

const csvEscape = (value: string | number | null | undefined) => {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
};

export const eksportLaporanCsv = async (laporan: LaporanHirarc, namaProfil?: string) => {
  const header = [
    'ID Laporan',
    'Lokasi Jeti',
    'Tarikh Masa Hantar',
    'Pemeriksa',
    'Emel Pemeriksa',
    'Status Semakan',
    'Tarikh Semakan',
    'Admin Penyemak',
    'Aktiviti',
    'Kluster',
    'Hazard',
    'Kebarangkalian',
    'Keterukan',
    'Skor Risiko',
    'Tahap Risiko',
    'Cadangan Tindakan',
  ];

  const rows = laporan.hazards.map((hazard) => [
    dapatkanKodLaporan({
      id: laporan.id,
      locationName: laporan.locationName,
      createdAt: laporan.createdAt,
      reportCode: laporan.reportCode,
    }),
    laporan.locationName,
    formatTarikhMasa(laporan.createdAt),
    namaProfil || laporan.inspectorEmail,
    laporan.inspectorEmail,
    laporan.reviewedAt ? 'Sudah Disemak' : 'Belum Disemak',
    laporan.reviewedAt ? formatTarikhMasa(laporan.reviewedAt) : '-',
    laporan.reviewedByEmail ?? '-',
    hazard.activityName,
    hazard.clusterName,
    hazard.hazardName,
    hazard.likelihood,
    hazard.severity,
    hazard.riskScore,
    hazard.riskLevel,
    hazard.recommendation,
  ]);

  const csv = [header, ...rows].map((line) => line.map((cell) => csvEscape(cell)).join(',')).join('\n');
  const fileName = `laporan-hirarc-${dapatkanKodLaporan({
    id: laporan.id,
    locationName: laporan.locationName,
    createdAt: laporan.createdAt,
    reportCode: laporan.reportCode,
  })}.csv`;
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true, intermediates: true });
  file.write(csv);

  const fileUri = file.uri;

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Eksport Laporan HIRARC (CSV)',
      UTI: 'public.comma-separated-values-text',
    });
  }

  return fileUri;
};

const kiraRisiko = (laporanList: LaporanHirarc[]) => {
  let rendah = 0;
  let sederhana = 0;
  let tinggi = 0;

  laporanList.forEach((laporan) => {
    laporan.hazards.forEach((hazard) => {
      if (hazard.riskScore >= 15) {
        tinggi += 1;
      } else if (hazard.riskScore >= 5) {
        sederhana += 1;
      } else {
        rendah += 1;
      }
    });
  });

  return { rendah, sederhana, tinggi };
};

const htmlLaporanHarian = (laporanList: LaporanHirarc[], logoDataUri: string, tarikhLabel: string) => {
  const statistik = kiraRisiko(laporanList);
  const jumlahHazard = laporanList.reduce((sum, item) => sum + item.hazards.length, 0);

  const hazardRows = laporanList
    .flatMap((laporan) =>
      laporan.hazards.map(
        (hazard, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(
            dapatkanKodLaporan({
              id: laporan.id,
              locationName: laporan.locationName,
              createdAt: laporan.createdAt,
              reportCode: laporan.reportCode,
            }),
          )}</td>
          <td>${escapeHtml(laporan.locationName)}</td>
          <td>${escapeHtml(laporan.inspectorEmail)}</td>
          <td>${escapeHtml(hazard.activityName)}</td>
          <td>${escapeHtml(hazard.clusterName)}</td>
          <td>${escapeHtml(hazard.hazardName)}</td>
          <td>${hazard.likelihood}</td>
          <td>${hazard.severity}</td>
          <td>${hazard.riskScore}</td>
          <td>${escapeHtml(hazard.riskLevel)}</td>
          <td>${escapeHtml(hazard.recommendation)}</td>
        </tr>
      `,
      ),
    )
    .join('');

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; color: #173B48; padding: 24px; }
        .header { display:flex; align-items:center; border-bottom:2px solid #0E6B68; padding-bottom:12px; margin-bottom:18px; }
        .logo { width:58px; height:58px; border-radius:29px; margin-right:12px; object-fit:cover; border: 1px solid #B7D1DD; }
        .title { margin:0; color:#0E4457; font-size:26px; }
        .subtitle { margin:2px 0 0; color:#607681; font-size:12px; }
        .summary { display:flex; gap:10px; margin-bottom:12px; }
        .card { flex:1; border:1px solid #DCE7ED; border-radius:10px; padding:10px; background:#F8FBFC; }
        .label { font-size:10px; text-transform:uppercase; color:#607681; margin-bottom:2px; }
        .value { font-size:14px; font-weight:bold; color:#173B48; }
        table { width:100%; border-collapse:collapse; margin-top:10px; font-size:10px; }
        th, td { border:1px solid #DCE7ED; padding:6px; vertical-align:top; }
        th { background:#0E4457; color:#fff; text-align:left; }
        .footer { margin-top:20px; font-size:10px; color:#607681; text-align:right; }
      </style>
    </head>
    <body>
      <div class="header">
        <img class="logo" src="${logoDataUri}" />
        <div>
          <h1 class="title">JetiSelamat</h1>
          <p class="subtitle">Laporan Harian HIRARC - ${escapeHtml(tarikhLabel)}</p>
        </div>
      </div>

      <div class="summary">
        <div class="card">
          <div class="label">Jumlah Laporan</div>
          <div class="value">${laporanList.length}</div>
        </div>
        <div class="card">
          <div class="label">Jumlah Hazard</div>
          <div class="value">${jumlahHazard}</div>
        </div>
        <div class="card">
          <div class="label">Risiko Tinggi</div>
          <div class="value">${statistik.tinggi}</div>
        </div>
      </div>

      <div class="summary">
        <div class="card">
          <div class="label">Risiko Sederhana</div>
          <div class="value">${statistik.sederhana}</div>
        </div>
        <div class="card">
          <div class="label">Risiko Rendah</div>
          <div class="value">${statistik.rendah}</div>
        </div>
        <div class="card">
          <div class="label">Dijana Pada</div>
          <div class="value">${escapeHtml(formatTarikhMasa(Date.now()))}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>ID Laporan</th>
            <th>Lokasi</th>
            <th>Pemeriksa</th>
            <th>Aktiviti</th>
            <th>Kluster</th>
            <th>Hazard</th>
            <th>L</th>
            <th>S</th>
            <th>Skor</th>
            <th>Tahap</th>
            <th>Cadangan</th>
          </tr>
        </thead>
        <tbody>
          ${hazardRows}
        </tbody>
      </table>

      <div class="footer">
        Dokumen rasmi JetiSelamat
      </div>
    </body>
  </html>
  `;
};

export const eksportLaporanHarianPdf = async (laporanList: LaporanHirarc[], tarikhLabel: string) => {
  if (laporanList.length === 0) {
    throw new Error('Tiada laporan untuk dieksport.');
  }

  const logoDataUri = await toDataUri();
  const html = htmlLaporanHarian(laporanList, logoDataUri, tarikhLabel);
  const result = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Eksport Laporan Harian HIRARC (PDF)',
      UTI: 'com.adobe.pdf',
    });
  }

  return result.uri;
};

export const eksportLaporanHarianCsv = async (laporanList: LaporanHirarc[], tarikhLabel: string) => {
  if (laporanList.length === 0) {
    throw new Error('Tiada laporan untuk dieksport.');
  }

  const header = [
    'Tarikh Laporan',
    'ID Laporan',
    'Lokasi Jeti',
    'Pemeriksa',
    'Emel Pemeriksa',
    'Status Semakan',
    'Tarikh Semakan',
    'Admin Penyemak',
    'Aktiviti',
    'Kluster',
    'Hazard',
    'Kebarangkalian',
    'Keterukan',
    'Skor Risiko',
    'Tahap Risiko',
    'Cadangan Tindakan',
  ];

  const rows = laporanList.flatMap((laporan) =>
    laporan.hazards.map((hazard) => [
      tarikhLabel,
      dapatkanKodLaporan({
        id: laporan.id,
        locationName: laporan.locationName,
        createdAt: laporan.createdAt,
        reportCode: laporan.reportCode,
      }),
      laporan.locationName,
      laporan.inspectorEmail,
      laporan.inspectorEmail,
      laporan.reviewedAt ? 'Telah Disemak' : 'Belum Disemak',
      laporan.reviewedAt ? formatTarikhMasa(laporan.reviewedAt) : '-',
      laporan.reviewedByEmail ?? '-',
      hazard.activityName,
      hazard.clusterName,
      hazard.hazardName,
      hazard.likelihood,
      hazard.severity,
      hazard.riskScore,
      hazard.riskLevel,
      hazard.recommendation,
    ]),
  );

  const csv = [header, ...rows].map((line) => line.map((cell) => csvEscape(cell)).join(',')).join('\n');
  const safeDate = tarikhLabel.replaceAll(' ', '-').replaceAll('/', '-');
  const fileName = `laporan-harian-hirarc-${safeDate}.csv`;
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true, intermediates: true });
  file.write(csv);

  const fileUri = file.uri;

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Eksport Laporan Harian HIRARC (CSV)',
      UTI: 'public.comma-separated-values-text',
    });
  }

  return fileUri;
};

export type TempohEksportLevel = 'tahun' | 'bulan' | 'hari';

const keyHariTempoh = (timestamp: number) => {
  const d = new Date(timestamp);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

const keyBulanTempoh = (timestamp: number) => {
  const d = new Date(timestamp);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${month}`;
};

const labelHariTempoh = (key: string) => {
  const d = new Date(`${key}T00:00:00`);
  return d.toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' });
};

const labelBulanTempoh = (key: string) => {
  const [year, month] = key.split('-').map((item) => Number(item));
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' });
};

const kiraRisikoLaporan = (laporan: LaporanHirarc) => {
  let rendah = 0;
  let sederhana = 0;
  let tinggi = 0;
  laporan.hazards.forEach((hazard) => {
    if (hazard.riskScore >= 15) tinggi += 1;
    else if (hazard.riskScore >= 5) sederhana += 1;
    else rendah += 1;
  });
  return { rendah, sederhana, tinggi };
};

const groupReportsBy = (laporanList: LaporanHirarc[], mode: 'bulan' | 'hari') => {
  const map = new Map<string, LaporanHirarc[]>();
  laporanList.forEach((laporan) => {
    const key = mode === 'bulan' ? keyBulanTempoh(laporan.createdAt) : keyHariTempoh(laporan.createdAt);
    const list = map.get(key) ?? [];
    list.push(laporan);
    map.set(key, list);
  });
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
};

const htmlLaporanTempoh = (
  laporanList: LaporanHirarc[],
  logoDataUri: string,
  labelTempoh: string,
  level: Exclude<TempohEksportLevel, 'hari'>,
) => {
  const statistik = kiraRisiko(laporanList);
  const jumlahHazard = laporanList.reduce((sum, item) => sum + item.hazards.length, 0);
  const grouped = groupReportsBy(laporanList, level === 'tahun' ? 'bulan' : 'hari');

  const sectionTitle = level === 'tahun' ? 'Susunan Ikut Bulan' : 'Susunan Ikut Hari';
  const groupedSections = grouped
    .map(([key, reports]) => {
      const labelKumpulan = level === 'tahun' ? labelBulanTempoh(key) : labelHariTempoh(key);
      const rows = reports
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((laporan, index) => {
          const kod = dapatkanKodLaporan({
            id: laporan.id,
            locationName: laporan.locationName,
            createdAt: laporan.createdAt,
            reportCode: laporan.reportCode,
          });
          const ringkas = kiraRisikoLaporan(laporan);
          return `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(kod)}</td>
              <td>${escapeHtml(formatTarikhMasa(laporan.createdAt))}</td>
              <td>${escapeHtml(laporan.locationName)}</td>
              <td>${escapeHtml(laporan.inspectorEmail)}</td>
              <td>${laporan.hazards.length}</td>
              <td>${ringkas.tinggi}</td>
              <td>${laporan.reviewedAt ? 'Telah Disemak' : 'Belum Disemak'}</td>
            </tr>
          `;
        })
        .join('');

      return `
        <div class="section">
          <div class="section-title">${escapeHtml(labelKumpulan)} <span>(${reports.length} laporan)</span></div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>ID Laporan</th>
                <th>Tarikh/Masa</th>
                <th>Lokasi</th>
                <th>Pemeriksa</th>
                <th>Hazard</th>
                <th>Risiko Tinggi</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `;
    })
    .join('');

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; color: #173B48; padding: 24px; }
        .header { display:flex; align-items:center; border-bottom:2px solid #0E6B68; padding-bottom:12px; margin-bottom:18px; }
        .logo { width:58px; height:58px; border-radius:29px; margin-right:12px; object-fit:cover; border: 1px solid #B7D1DD; }
        .title { margin:0; color:#0E4457; font-size:26px; }
        .subtitle { margin:2px 0 0; color:#607681; font-size:12px; }
        .summary { display:flex; gap:10px; margin-bottom:12px; }
        .card { flex:1; border:1px solid #DCE7ED; border-radius:10px; padding:10px; background:#F8FBFC; }
        .label { font-size:10px; text-transform:uppercase; color:#607681; margin-bottom:2px; }
        .value { font-size:14px; font-weight:bold; color:#173B48; }
        .section-head { margin:12px 0 8px; font-size:12px; font-weight:bold; color:#0E4457; }
        .section { margin-bottom:14px; border:1px solid #DCE7ED; border-radius:10px; padding:10px; background:#fff; }
        .section-title { font-size:13px; font-weight:bold; color:#173B48; margin-bottom:8px; }
        .section-title span { font-size:11px; color:#607681; }
        table { width:100%; border-collapse:collapse; font-size:10px; }
        th, td { border:1px solid #DCE7ED; padding:6px; vertical-align:top; }
        th { background:#0E4457; color:#fff; text-align:left; }
        .footer { margin-top:20px; font-size:10px; color:#607681; text-align:right; }
      </style>
    </head>
    <body>
      <div class="header">
        <img class="logo" src="${logoDataUri}" />
        <div>
          <h1 class="title">JetiSelamat</h1>
          <p class="subtitle">Laporan Ringkasan HIRARC - ${escapeHtml(labelTempoh)}</p>
        </div>
      </div>

      <div class="summary">
        <div class="card">
          <div class="label">Jumlah Laporan</div>
          <div class="value">${laporanList.length}</div>
        </div>
        <div class="card">
          <div class="label">Jumlah Hazard</div>
          <div class="value">${jumlahHazard}</div>
        </div>
        <div class="card">
          <div class="label">Risiko Tinggi</div>
          <div class="value">${statistik.tinggi}</div>
        </div>
      </div>
      <div class="summary">
        <div class="card">
          <div class="label">Risiko Sederhana</div>
          <div class="value">${statistik.sederhana}</div>
        </div>
        <div class="card">
          <div class="label">Risiko Rendah</div>
          <div class="value">${statistik.rendah}</div>
        </div>
        <div class="card">
          <div class="label">Dijana Pada</div>
          <div class="value">${escapeHtml(formatTarikhMasa(Date.now()))}</div>
        </div>
      </div>

      <div class="section-head">${sectionTitle}</div>
      ${groupedSections}

      <div class="footer">
        Dokumen rasmi JetiSelamat
      </div>
    </body>
  </html>
  `;
};

export const eksportLaporanTempohPdf = async (
  laporanList: LaporanHirarc[],
  labelTempoh: string,
  level: TempohEksportLevel,
) => {
  if (level === 'hari') {
    return eksportLaporanHarianPdf(laporanList, labelTempoh);
  }
  if (laporanList.length === 0) {
    throw new Error('Tiada laporan untuk dieksport.');
  }

  const logoDataUri = await toDataUri();
  const html = htmlLaporanTempoh(laporanList, logoDataUri, labelTempoh, level);
  const result = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Eksport Laporan Tempoh HIRARC (PDF)',
      UTI: 'com.adobe.pdf',
    });
  }

  return result.uri;
};

export const eksportLaporanTempohCsv = async (
  laporanList: LaporanHirarc[],
  labelTempoh: string,
  level: TempohEksportLevel,
) => {
  if (level === 'hari') {
    return eksportLaporanHarianCsv(laporanList, labelTempoh);
  }
  if (laporanList.length === 0) {
    throw new Error('Tiada laporan untuk dieksport.');
  }

  const mode = level === 'tahun' ? 'bulan' : 'hari';
  const grouped = groupReportsBy(laporanList, mode);

  const header = [
    'Tempoh',
    'Kumpulan',
    'ID Laporan',
    'Tarikh Masa Hantar',
    'Lokasi Jeti',
    'Pemeriksa',
    'Jumlah Hazard',
    'Risiko Tinggi',
    'Risiko Sederhana',
    'Risiko Rendah',
    'Status Semakan',
    'Tarikh Semakan',
    'Admin Penyemak',
  ];

  const rows = grouped.flatMap(([key, reports]) => {
    const labelKumpulan = mode === 'bulan' ? labelBulanTempoh(key) : labelHariTempoh(key);
    return reports
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((laporan) => {
        const ringkas = kiraRisikoLaporan(laporan);
        return [
          labelTempoh,
          labelKumpulan,
          dapatkanKodLaporan({
            id: laporan.id,
            locationName: laporan.locationName,
            createdAt: laporan.createdAt,
            reportCode: laporan.reportCode,
          }),
          formatTarikhMasa(laporan.createdAt),
          laporan.locationName,
          laporan.inspectorEmail,
          laporan.hazards.length,
          ringkas.tinggi,
          ringkas.sederhana,
          ringkas.rendah,
          laporan.reviewedAt ? 'Telah Disemak' : 'Belum Disemak',
          laporan.reviewedAt ? formatTarikhMasa(laporan.reviewedAt) : '-',
          laporan.reviewedByEmail ?? '-',
        ];
      });
  });

  const csv = [header, ...rows].map((line) => line.map((cell) => csvEscape(cell)).join(',')).join('\n');
  const safeLabel = labelTempoh.replaceAll(' ', '-').replaceAll('/', '-');
  const fileName = `laporan-${level}-hirarc-${safeLabel}.csv`;
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true, intermediates: true });
  file.write(csv);

  const fileUri = file.uri;

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Eksport Laporan Tempoh HIRARC (CSV)',
      UTI: 'public.comma-separated-values-text',
    });
  }

  return fileUri;
};
