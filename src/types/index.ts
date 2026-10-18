export type ProgramType = 'JKK_JKM' | 'JKK_JKM_JHT';
export type JobType = 'Pedagang' | 'Tukang' | 'Lain-lain';
export type PaymentPeriod = 1 | 2 | 3 | 6 | 12;

export interface RegistrationFormData {
  // Data Peserta
  namaLengkap: string;
  nik: string;
  alamatRumah: string;
  tempatLahir: string;
  tanggalLahir: string;
  nomorHp: string;
  email: string;

  // Pilihan Pekerjaan
  pekerjaan: JobType | '';
  detailPekerjaanTukang: string;
  detailPekerjaanLain: string;

  // Program & Periode
  program: ProgramType | '';
  periodePembayaran: PaymentPeriod | 0;

  // Dokumen
  ktpFile: File | null;
  ktpPreview: string | null;
  ktpFileName: string;
  ktpFileSize: string;

  kkFile: File | null;
  kkPreview: string | null;
  kkFileName: string;
  kkFileSize: string;

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
