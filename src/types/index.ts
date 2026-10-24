export type ProgramType = 'JKK_JKM' | 'JKK_JKM_JHT';
export type JobType = 'Pedagang' | 'Tukang' | 'Lain-lain';
export type PaymentPeriod = 1 | 2 | 3 | 6 | 12;

export type DocumentStatus = 'Terlampir' | 'Belum Terlampir';

export interface AdminRegistrant {
  id: string;
  namaLengkap: string;
  alamat: string;
  noHp: string;
  dokumen: DocumentStatus;
  createdAt?: string;
  nik?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  namaIbuKandung?: string;
  pekerjaan?: string;
  pekerjaanSampingan?: string;
  email?: string;
  program?: string;
  periodePembayaran?: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  tableName: string;
  isEnabled: boolean;
  lastSyncedAt?: string;
}

export interface RegistrationFormData {
  // Data Peserta
  namaLengkap: string;
  nik: string;
  alamatRumah: string;
  tempatLahir: string;
  tanggalLahir: string;
  namaIbuKandung: string;
  nomorHp: string;
  email: string;

  // Pilihan Pekerjaan
  pekerjaan: JobType | '';
  detailPekerjaanTukang: string;
  detailPekerjaanLain: string;

  // Program & Periode
  program: ProgramType | '';
  periodePembayaran: PaymentPeriod | 0;

  // Pernyataan
  pernyataanData: boolean;
  pernyataanKesehatan: boolean;
}

export interface ProgramDetail {
  id: ProgramType;
  title: string;
  monthlyRate: number;
  badge: string;
  description: string;
  benefits: string[];
}

export const PROGRAM_DATA: Record<ProgramType, ProgramDetail> = {
  JKK_JKM: {
    id: 'JKK_JKM',
    title: 'JKK dan JKM',
    monthlyRate: 16800,
    badge: 'Paling Populer',
    description: 'Jaminan Kecelakaan Kerja (JKK) & Jaminan Kematian (JKM)',
    benefits: [
      'Perlindungan risiko kecelakaan kerja mulai dari berangkat, di tempat kerja, hingga kembali pulang',
      'Perawatan medis tanpa batas biaya sesuai indikasi medis',
      'Santunan kematian akibat kecelakaan kerja hingga Rp48 juta',
      'Santunan kematian biasa (bukan kecelakaan kerja) Rp42 juta',
      'Beasiswa pendidikan bagi anak peserta hingga jenjang perguruan tinggi'
    ]
  },
  JKK_JKM_JHT: {
    id: 'JKK_JKM_JHT',
    title: 'JKK, JKM, dan JHT',
    monthlyRate: 36800,
    badge: 'Perlindungan Lengkap + Tabungan',
    description: 'Jaminan Kecelakaan Kerja (JKK), Jaminan Kematian (JKM), & Jaminan Hari Tua (JHT)',
    benefits: [
      'Semua manfaat JKK dan JKM lengkap',
      'Tabungan hari tua (JHT) dengan pengembangan bunga di atas rata-rata deposito bank',
      'Dapat dicairkan saat berhenti bekerja, pensiun, atau mencapai usia tertentu',
      'Investasi aman terjamin oleh undang-undang ketenagakerjaan Republik Indonesia'
    ]
  }
};

export const PAYMENT_PERIODS: { period: PaymentPeriod; label: string }[] = [
  { period: 1, label: 'Per bulan' },
  { period: 2, label: 'Per 2 bulan' },
  { period: 3, label: 'Per 3 bulan' },
  { period: 6, label: 'Per 6 bulan' },
  { period: 12, label: 'Per 12 bulan' }
];

export const WA_TARGET_NUMBER = '085743678786';
export const WA_TARGET_DISPLAY = '0857-4367-8786';
export const WA_TARGET_INTERNATIONAL = '6285743678786';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace(/\s/g, '');
}

export function maskNik(nik: string): string {
  if (!nik) return '-';
  const clean = nik.trim();
  if (clean.length < 8) return clean;
  // Tampilkan 4 digit awal dan 4 digit akhir, tengah disamarkan bintang
  const first4 = clean.slice(0, 4);
  const last4 = clean.slice(-4);
  const maskedCount = Math.max(clean.length - 8, 4);
  return `${first4} ${'•'.repeat(maskedCount)} ${last4}`;
}

export function maskPhoneNumber(phone: string): string {
  if (!phone) return '-';
  const clean = phone.trim().replace(/[^\d+]/g, '');
  if (clean.length < 8) {
    if (clean.length <= 4) return '****';
    return clean.slice(0, 2) + '****' + clean.slice(-1);
  }
  // Sensor digit di tengah, misal: 0812-****-7890
  const start = clean.slice(0, 4);
  const end = clean.slice(-4);
  return `${start}-****-${end}`;
}

export function formatDateToDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
  const parts = trimmed.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    // YYYY-MM-DD -> DD/MM/YYYY
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return trimmed;
}

export function parseDDMMYYYY(dateStr: string): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
    const year = parseInt(ddmmyyyyMatch[3], 10);
    const d = new Date(year, month, day);
    if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
      return d;
    }
    return null;
  }
  const yyyymmddMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (yyyymmddMatch) {
    const year = parseInt(yyyymmddMatch[1], 10);
    const month = parseInt(yyyymmddMatch[2], 10) - 1;
    const day = parseInt(yyyymmddMatch[3], 10);
    const d = new Date(year, month, day);
    if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
      return d;
    }
  }
  return null;
}

