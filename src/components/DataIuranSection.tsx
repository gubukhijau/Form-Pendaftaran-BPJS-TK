import React, { useState, useEffect, useMemo } from 'react';
import {
  AdminRegistrant,
  MonthlyIuranRecord,
  PROGRAM_DATA,
  formatRupiah
} from '../types';
import {
  getRegistrants,
  fetchAndSyncRegistrants,
  updateRegistrantMonthlyIuran
} from '../services/registrantStorage';
import { WhatsAppIuranModal } from './WhatsAppIuranModal';
import {
  Wallet,
  Calendar,
  CheckCircle2,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Send,
  User,
  Save,
  XCircle,
  Download,
  Users,
  Check,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';

interface Props {
  isAdminLoggedIn: boolean;
  onBackToPeserta?: () => void;
}

const MIN_YEAR = 2026;
const MAX_YEAR = 2070;

const MONTH_FULL_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

const MONTH_SHORT_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des'
];

export interface MonthDescriptor {
  monthNum: number; // 1..12
  short: string;
  full: string;
  key: string; // YYYY-MM
}

export function getMonthsForYear(year: number): MonthDescriptor[] {
  const startMonth = year === MIN_YEAR ? 11 : 1; // Mulai dari November 2026
  const list: MonthDescriptor[] = [];
  for (let m = startMonth; m <= 12; m++) {
    list.push({
      monthNum: m,
      short: MONTH_SHORT_NAMES[m - 1],
      full: MONTH_FULL_NAMES[m - 1],
      key: `${year}-${String(m).padStart(2, '0')}`
    });
  }
  return list;
}

const ALL_YEARS = Array.from(
  { length: MAX_YEAR - MIN_YEAR + 1 },
  (_, idx) => MIN_YEAR + idx
);

function getDefaultMonthlyRate(registrant?: AdminRegistrant | null): number {
  if (registrant?.program && registrant.program.toUpperCase().includes('JHT')) {
    return PROGRAM_DATA.JKK_JKM_JHT.monthlyRate;
  }
  return PROGRAM_DATA.JKK_JKM.monthlyRate;
}

function formatRibuanInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('id-ID');
}

function parseRibuanAmount(value: string): number {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

function getTodayYMD(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const DataIuranSection: React.FC<Props> = ({
  isAdminLoggedIn,
  onBackToPeserta
}) => {
  const [registrants, setRegistrants] = useState<AdminRegistrant[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Default year = current year clamped to [2026, 2070]
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const nowYear = new Date().getFullYear();
    return Math.min(Math.max(nowYear, MIN_YEAR), MAX_YEAR);
  });

  // Default month = 11 for 2026, or current month
  const [selectedMonthNum, setSelectedMonthNum] = useState<number>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    if (y <= MIN_YEAR) return Math.max(m, 11);
    return m;
  });

  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('20.000');
  const [paidDateInput, setPaidDateInput] = useState<string>(() => getTodayYMD());
  const [noteInput, setNoteInput] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<string>('');

  // Bottom table filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewFilter, setViewFilter] = useState<
    'Semua' | 'SudahBayarTahun' | 'SudahBayarBulan' | 'BelumBayarBulan'
  >('Semua');

  // WhatsApp Billing Modal state
  const [waModalRegistrant, setWaModalRegistrant] = useState<AdminRegistrant | null>(null);
  const [waModalMonthLabel, setWaModalMonthLabel] = useState<string>('');
  const [waModalAmount, setWaModalAmount] = useState<number | undefined>(undefined);
  const [isWaModalOpen, setIsWaModalOpen] = useState<boolean>(false);

  const loadData = async () => {
    setIsSyncing(true);
    try {
      const res = await fetchAndSyncRegistrants();
      setRegistrants(res.data);
    } catch {
      setRegistrants(getRegistrants());
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => setRegistrants(getRegistrants());
    window.addEventListener('storage', handleStorage);
    window.addEventListener('registrants_updated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('registrants_updated', handleStorage);
    };
  }, []);

  // Ensure selectedMonthNum is valid for selectedYear (2026 starts at month 11)
  useEffect(() => {
    if (selectedYear === MIN_YEAR && selectedMonthNum < 11) {
      setSelectedMonthNum(11);
    }
  }, [selectedYear, selectedMonthNum]);

  // Auto-select first member when registrants load
  useEffect(() => {
    if (registrants.length > 0 && !registrants.some((r) => r.id === selectedMemberId)) {
      setSelectedMemberId(registrants[0].id);
    }
  }, [registrants, selectedMemberId]);

  const monthsInYear = useMemo(() => getMonthsForYear(selectedYear), [selectedYear]);
  const selectedMonthKey = `${selectedYear}-${String(selectedMonthNum).padStart(2, '0')}`;
  const selectedMonthLabel = `${MONTH_FULL_NAMES[selectedMonthNum - 1]} ${selectedYear}`;

  const selectedMember = useMemo(
    () => registrants.find((r) => r.id === selectedMemberId) || null,
    [registrants, selectedMemberId]
  );

  // Sync form inputs whenever selectedMember or selectedMonthKey changes
  useEffect(() => {
    if (!selectedMember) return;
    const existing = selectedMember.monthlyPayments?.[selectedMonthKey];
    if (existing && existing.amount > 0) {
      setAmountInput(existing.amount.toLocaleString('id-ID'));
      setPaidDateInput(existing.paidAt || getTodayYMD());
      setNoteInput(existing.note || '');
    } else {
      setAmountInput(getDefaultMonthlyRate(selectedMember).toLocaleString('id-ID'));
      setPaidDateInput(getTodayYMD());
      setNoteInput('');
    }
  }, [selectedMember?.id, selectedMonthKey]);

  const existingRecordForForm = selectedMember?.monthlyPayments?.[selectedMonthKey];
  const isFormTargetPaid = Boolean(existingRecordForForm?.paid);

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminLoggedIn || !selectedMember) return;

    const numericAmount = parseRibuanAmount(amountInput) || getDefaultMonthlyRate(selectedMember);
    const record: MonthlyIuranRecord = {
      paid: true,
      amount: numericAmount,
      paidAt: paidDateInput || getTodayYMD(),
      note: noteInput.trim()
    };

    const updated = updateRegistrantMonthlyIuran(selectedMember.id, selectedMonthKey, record);
    setRegistrants(updated);
    setSaveMessage(
      `Pembayaran ${selectedMember.namaLengkap} bulan ${selectedMonthLabel} (${formatRupiah(numericAmount)}) berhasil dicentang lunas.`
    );
    setTimeout(() => setSaveMessage(''), 3500);
  };

  const handleCancelPayment = () => {
    if (!isAdminLoggedIn || !selectedMember) return;
    const record: MonthlyIuranRecord = {
      paid: false,
      amount: 0,
      paidAt: '',
      note: ''
    };
    const updated = updateRegistrantMonthlyIuran(selectedMember.id, selectedMonthKey, record);
    setRegistrants(updated);
    setSaveMessage(
      `Status pembayaran ${selectedMember.namaLengkap} bulan ${selectedMonthLabel} diubah ke Belum Bayar.`
    );
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleCellToggle = (member: AdminRegistrant, month: MonthDescriptor) => {
    if (!isAdminLoggedIn) return;
    const existing = member.monthlyPayments?.[month.key];
    const nextPaid = !(existing && existing.paid);
    const amount =
      existing && existing.amount > 0 ? existing.amount : getDefaultMonthlyRate(member);

    const record: MonthlyIuranRecord = nextPaid
      ? {
          paid: true,
          amount,
          paidAt: existing?.paidAt || getTodayYMD(),
          note: existing?.note || ''
        }
      : {
          paid: false,
          amount: 0,
          paidAt: '',
          note: ''
        };

    const updated = updateRegistrantMonthlyIuran(member.id, month.key, record);
    setRegistrants(updated);

    // Also focus form on that member & month for easy editing of nominal
    setSelectedMemberId(member.id);
    setSelectedMonthNum(month.monthNum);
  };

  const openWaBillingModal = (member: AdminRegistrant, monthLabel?: string, customAmount?: number) => {
    setWaModalRegistrant(member);
    setWaModalMonthLabel(monthLabel || selectedMonthLabel);
    setWaModalAmount(customAmount && customAmount > 0 ? customAmount : getDefaultMonthlyRate(member));
    setIsWaModalOpen(true);
  };

  // Statistics for the selected year and selected month
  const yearStats = useMemo(() => {
    let paidSelectedMonthCount = 0;
    let membersPaidAnyThisYear = 0;
    let totalCollectedThisYear = 0;

    registrants.forEach((r) => {
      const mp = r.monthlyPayments || {};
      if (mp[selectedMonthKey]?.paid) {
        paidSelectedMonthCount += 1;
      }
      let paidMonthsInYear = 0;
      monthsInYear.forEach((m) => {
        const rec = mp[m.key];
        if (rec?.paid) {
          paidMonthsInYear += 1;
          totalCollectedThisYear += rec.amount || getDefaultMonthlyRate(r);
        }
      });
      if (paidMonthsInYear > 0) {
        membersPaidAnyThisYear += 1;
      }
    });

    return {
      totalMembers: registrants.length,
      paidSelectedMonthCount,
      unpaidSelectedMonthCount: Math.max(0, registrants.length - paidSelectedMonthCount),
      membersPaidAnyThisYear,
      totalCollectedThisYear
    };
  }, [registrants, monthsInYear, selectedMonthKey]);

  const filteredRegistrants = useMemo(() => {
    return registrants.filter((r) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        r.namaLengkap.toLowerCase().includes(q) ||
        r.noHp.toLowerCase().includes(q) ||
        r.alamat.toLowerCase().includes(q);

      if (!matchSearch) return false;

      const mp = r.monthlyPayments || {};
      if (viewFilter === 'SudahBayarTahun') {
        return monthsInYear.some((m) => mp[m.key]?.paid);
      }
      if (viewFilter === 'SudahBayarBulan') {
        return Boolean(mp[selectedMonthKey]?.paid);
      }
      if (viewFilter === 'BelumBayarBulan') {
        return !mp[selectedMonthKey]?.paid;
      }
      return true;
    });
  }, [registrants, searchQuery, viewFilter, monthsInYear, selectedMonthKey]);

  const exportAnnualCsv = () => {
    if (registrants.length === 0) return;
    const headers = [
      'No',
      'Nama Peserta',
      'No HP',
      'Program',
      ...monthsInYear.map((m) => `${m.short} ${selectedYear}`),
      `Total Terbayar ${selectedYear}`
    ];

    const rows = registrants.map((r, index) => {
      const mp = r.monthlyPayments || {};
      let yearTotal = 0;
      const monthCols = monthsInYear.map((m) => {
        const rec = mp[m.key];
        if (rec?.paid) {
          const amt = rec.amount || getDefaultMonthlyRate(r);
          yearTotal += amt;
          return `"Sudah Bayar (Rp ${amt.toLocaleString('id-ID')})"`;
        }
        return '"Belum Bayar"';
      });
      return [
        String(index + 1),
        `"${r.namaLengkap.replace(/"/g, '""')}"`,
        `"${r.noHp}"`,
        `"${r.program || 'JKK & JKM'}"`,
        ...monthCols,
        `"Rp ${yearTotal.toLocaleString('id-ID')}"`
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_iuran_bpjs_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAdminLoggedIn) {
    return null;
  }

  return (
    <section id="data-iuran" className="w-full space-y-6">
      {/* Top Banner & Summary Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/60 border border-slate-200/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#003366] to-[#007b5e] text-white flex items-center justify-center shadow-md shadow-emerald-700/20 shrink-0">
              <Wallet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Halaman Khusus Petugas • Nov 2026 – Des 2070</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Data Iuran Bulanan Peserta
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Catat pembayaran iuran bulanan peserta, kirim tagihan WhatsApp per bulan dengan form resmi, dan pantau daftar centang hijau pembayaran dari November 2026 hingga Desember 2070.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={loadData}
              disabled={isSyncing}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors border border-slate-200 cursor-pointer"
              title="Sinkronkan data iuran peserta"
            >
              <RefreshCw className={`w-4 h-4 text-[#003366] ${isSyncing ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={exportAnnualCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors border border-slate-200 cursor-pointer"
              title={`Unduh rekap iuran tahun ${selectedYear} (CSV)`}
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export Rekap {selectedYear}</span>
            </button>

            {onBackToPeserta && (
              <button
                type="button"
                onClick={onBackToPeserta}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#003366]/5 hover:bg-[#003366] text-[#003366] hover:text-white font-bold rounded-xl text-xs border border-[#003366]/20 transition-all cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Ke Data Peserta</span>
              </button>
            )}
          </div>
        </div>

        {/* Summary Metrics for Selected Year & Month */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-5">
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Anggota
              </span>
              <span className="text-2xl font-black text-slate-900 mt-0.5 block">
                {yearStats.totalMembers}
              </span>
              <span className="text-[11px] text-slate-500">Peserta terdaftar aktif</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-100/70 text-[#003366] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                Lunas {selectedMonthLabel}
              </span>
              <span className="text-2xl font-black text-emerald-700 mt-0.5 block">
                {yearStats.paidSelectedMonthCount}{' '}
                <span className="text-sm font-bold text-emerald-600/80">
                  / {yearStats.totalMembers}
                </span>
              </span>
              <span className="text-[11px] text-emerald-700">
                Belum bayar: {yearStats.unpaidSelectedMonthCount} anggota
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">
                Terkumpul Tahun {selectedYear}
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-700 mt-0.5 block">
                {formatRupiah(yearStats.totalCollectedThisYear)}
              </span>
              <span className="text-[11px] text-amber-700">
                {yearStats.membersPaidAnyThisYear} anggota sudah bayar
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Form Input Pembayaran Bulanan + Tombol Tagih WA */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/60 border border-slate-200/80">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>Input Pembayaran Bulanan & Tagih WhatsApp</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih anggota dan periode bulan (mulai November 2026 s/d Desember 2070), lalu simpan pembayaran atau kirim form tagihan ke WhatsApp anggota.
            </p>
          </div>
          {selectedMember && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                isFormTargetPaid
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              {isFormTargetPaid ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sudah Bayar ({selectedMonthLabel})</span>
                </>
              ) : (
                <span>Belum Bayar ({selectedMonthLabel})</span>
              )}
            </span>
          )}
        </div>

        {saveMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveMessage}</span>
          </div>
        )}

        <form onSubmit={handleSavePayment} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            {/* 1. Pilih Anggota */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#003366]" />
                <span>Nama Anggota</span>
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#003366]"
              >
                {registrants.length === 0 ? (
                  <option value="">Belum ada peserta terdaftar</option>
                ) : (
                  registrants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.namaLengkap} ({r.noHp}) — {r.program || 'JKK & JKM'}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* 2. Tahun (2026 - 2070) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#003366]" />
                <span>Tahun (2026–2070)</span>
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#003366]"
              >
                {ALL_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    Tahun {yr} {yr === 2026 ? '(Nov–Des)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Bulan */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bulan Iuran</span>
              </label>
              <select
                value={selectedMonthNum}
                onChange={(e) => setSelectedMonthNum(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#003366]"
              >
                {monthsInYear.map((m) => (
                  <option key={m.key} value={m.monthNum}>
                    {m.full} {selectedYear}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Jumlah Pembayaran */}
            <div className="sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-amber-600" />
                  <span>Jumlah Pembayaran (Rp)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAmountInput('20.000')}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 cursor-pointer border border-slate-200"
                  >
                    Rp 20.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountInput('40.000')}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 cursor-pointer border border-slate-200"
                  >
                    Rp 40.000
                  </button>
                </div>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-extrabold text-slate-500">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountInput}
                  onChange={(e) => setAmountInput(formatRibuanInput(e.target.value))}
                  placeholder="20.000"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-extrabold text-slate-900 focus:bg-white focus:outline-none focus:border-[#003366]"
                />
              </div>
            </div>

            {/* 5. Tanggal Bayar */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Tanggal Bayar
              </label>
              <input
                type="date"
                value={paidDateInput}
                onChange={(e) => setPaidDateInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#003366]"
              />
            </div>

            {/* 6. Catatan (Opsional) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Catatan (Opsional)
              </label>
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Misal: Transfer BRI / Tunai"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-[#003366]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={!selectedMember}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isFormTargetPaid ? 'Perbarui Pembayaran (Lunas)' : 'Simpan & Centang Hijau'}
                </span>
              </button>

              {isFormTargetPaid && (
                <button
                  type="button"
                  onClick={handleCancelPayment}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs sm:text-sm rounded-xl border border-red-200 transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Batalkan Lunas</span>
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={!selectedMember}
              onClick={() => {
                if (!selectedMember) return;
                openWaBillingModal(
                  selectedMember,
                  selectedMonthLabel,
                  parseRibuanAmount(amountInput)
                );
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#1fb857] disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Tagih via WhatsApp ({selectedMonthLabel})</span>
            </button>
          </div>
        </form>
      </div>

      {/* Bottom Section: Daftar Nama Yang Sudah Bayar + Centang Hijau Per Bulan (Nov 2026 - Des 2070) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/60 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>Daftar Anggota & Centang Hijau Iuran Bulanan ({selectedYear})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedYear === 2026
                  ? 'Periode awal dimulai dari November – Desember 2026. Klik sel bulan untuk langsung memberi/mengubah centang hijau atau klik tombol WA untuk menagih.'
                  : `Menampilkan Januari – Desember ${selectedYear}. Klik sel bulan untuk centang lunas atau klik tombol WA untuk menagih anggota.`}
              </p>
            </div>

            {/* Year Switcher 2026 - 2070 */}
            <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start lg:self-auto">
              <button
                type="button"
                disabled={selectedYear <= MIN_YEAR}
                onClick={() => setSelectedYear((y) => Math.max(MIN_YEAR, y - 1))}
                className="p-1.5 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 border border-slate-200 cursor-pointer disabled:cursor-not-allowed"
                title="Tahun sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 bg-[#003366] text-white font-extrabold text-xs rounded-xl cursor-pointer focus:outline-none"
                aria-label="Pilih Tahun Rekap Iuran"
              >
                {ALL_YEARS.map((yr) => (
                  <option key={yr} value={yr} className="bg-white text-slate-900">
                    {yr}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={selectedYear >= MAX_YEAR}
                onClick={() => setSelectedYear((y) => Math.min(MAX_YEAR, y + 1))}
                className="p-1.5 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 border border-slate-200 cursor-pointer disabled:cursor-not-allowed"
                title="Tahun berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search & View Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama peserta atau nomor HP..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366] focus:bg-white text-slate-800"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(
                [
                  { id: 'Semua', label: `Semua (${registrants.length})` },
                  { id: 'SudahBayarTahun', label: `Sudah Bayar ${selectedYear} (${yearStats.membersPaidAnyThisYear})` },
                  { id: 'SudahBayarBulan', label: `Lunas ${MONTH_SHORT_NAMES[selectedMonthNum - 1]}` },
                  { id: 'BelumBayarBulan', label: `Belum ${MONTH_SHORT_NAMES[selectedMonthNum - 1]}` }
                ] as const
              ).map((tab) => {
                const active = viewFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setViewFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-[#003366] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Monthly Checklist Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/95 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-3 sm:px-4 text-center w-10">No</th>
                <th className="py-3.5 px-3 sm:px-4 min-w-[180px] sticky left-0 bg-slate-50/95 z-10 border-r border-slate-200/70">
                  Nama Anggota
                </th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Tagih WA</th>
                {monthsInYear.map((m) => {
                  const isActiveMonth = m.monthNum === selectedMonthNum;
                  return (
                    <th
                      key={m.key}
                      onClick={() => setSelectedMonthNum(m.monthNum)}
                      className={`py-3 px-2.5 text-center whitespace-nowrap cursor-pointer transition-colors min-w-[74px] ${
                        isActiveMonth
                          ? 'bg-emerald-50 text-emerald-900 border-b-2 border-emerald-500'
                          : 'hover:bg-slate-100'
                      }`}
                      title={`Pilih bulan ${m.full} ${selectedYear}`}
                    >
                      <div>{m.short}</div>
                      <div className="text-[9px] font-semibold text-slate-400 normal-case">
                        {selectedYear}
                      </div>
                    </th>
                  );
                })}
                <th className="py-3.5 px-3 sm:px-4 text-right whitespace-nowrap min-w-[115px]">
                  Total {selectedYear}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRegistrants.length === 0 ? (
                <tr>
                  <td
                    colSpan={4 + monthsInYear.length}
                    className="py-12 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Wallet className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-700 text-sm">
                        Tidak ada data anggota yang sesuai filter
                      </p>
                      <p className="text-xs text-slate-400">
                        Coba ubah kata kunci pencarian atau pilih filter "Semua".
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRegistrants.map((member, index) => {
                  const mp = member.monthlyPayments || {};
                  const defaultRate = getDefaultMonthlyRate(member);
                  let paidMonthsCount = 0;
                  let totalYearAmount = 0;

                  monthsInYear.forEach((m) => {
                    const rec = mp[m.key];
                    if (rec?.paid) {
                      paidMonthsCount += 1;
                      totalYearAmount += rec.amount || defaultRate;
                    }
                  });

                  const isSelectedMember = member.id === selectedMemberId;

                  return (
                    <tr
                      key={member.id}
                      className={`transition-colors ${
                        isSelectedMember ? 'bg-sky-50/40' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-3 sm:px-4 text-center font-semibold text-slate-500">
                        {index + 1}
                      </td>

                      {/* Nama Anggota */}
                      <td
                        onClick={() => setSelectedMemberId(member.id)}
                        className="py-3 px-3 sm:px-4 sticky left-0 bg-white z-10 border-r border-slate-100 cursor-pointer"
                        title="Klik untuk pilih anggota di formulir input atas"
                      >
                        <div className="font-bold text-slate-900 leading-snug">
                          {member.namaLengkap}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span className="font-mono">{member.noHp}</span>
                          <span>•</span>
                          <span className="font-semibold text-[#003366]">
                            {member.program || 'JKK & JKM'}
                          </span>
                        </div>
                      </td>

                      {/* Tombol Tagih WA Bulanan */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            openWaBillingModal(
                              member,
                              selectedMonthLabel,
                              mp[selectedMonthKey]?.amount || defaultRate
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366] text-emerald-800 hover:text-white border border-emerald-300 font-bold text-[11px] transition-all cursor-pointer"
                          title={`Kirim tagihan WhatsApp bulan ${selectedMonthLabel} ke ${member.namaLengkap}`}
                        >
                          <Send className="w-3 h-3" />
                          <span>WA</span>
                        </button>
                      </td>

                      {/* Monthly Checkmark Cells */}
                      {monthsInYear.map((m) => {
                        const rec = mp[m.key];
                        const isPaid = Boolean(rec?.paid);
                        const amt = rec?.amount || defaultRate;
                        const isActiveMonth = m.monthNum === selectedMonthNum;

                        return (
                          <td
                            key={m.key}
                            className={`py-2.5 px-2 text-center align-middle ${
                              isActiveMonth ? 'bg-emerald-50/30' : ''
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleCellToggle(member, m)}
                              title={
                                isPaid
                                  ? `${member.namaLengkap} • ${m.full} ${selectedYear}: LUNAS (${formatRupiah(amt)})${rec?.paidAt ? ` pada ${rec.paidAt}` : ''}. Klik untuk ubah.`
                                  : `Klik untuk tandai ${member.namaLengkap} LUNAS bulan ${m.full} ${selectedYear}`
                              }
                              className={`w-full min-w-[60px] py-1.5 px-1.5 rounded-xl border inline-flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                                isPaid
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 shadow-2xs'
                                  : 'bg-slate-50/70 border-slate-200/80 text-slate-400 hover:border-emerald-300 hover:bg-emerald-50/40 hover:text-emerald-700'
                              }`}
                            >
                              {isPaid ? (
                                <>
                                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </span>
                                  <span className="text-[10px] font-extrabold font-mono text-emerald-800 leading-none">
                                    {amt.toLocaleString('id-ID')}
                                  </span>
                                </>
                              ) : (
                                <span className="text-[11px] font-bold text-slate-300 py-1">
                                  —
                                </span>
                              )}
                            </button>
                          </td>
                        );
                      })}

                      {/* Annual Summary per Member */}
                      <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                        <div className="font-extrabold text-slate-900 font-mono">
                          {formatRupiah(totalYearAmount)}
                        </div>
                        <div
                          className={`text-[10px] font-bold ${
                            paidMonthsCount > 0 ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {paidMonthsCount}/{monthsInYear.length} bln lunas
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Hint */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white inline-flex items-center justify-center">
              <Check className="w-3 h-3 stroke-[3]" />
            </span>
            <span>
              Tanda <strong>Centang Hijau</strong> menandakan anggota sudah membayar iuran pada bulan tersebut.
            </span>
          </div>
          <span>
            Periode tersedia: <strong>November 2026</strong> s/d <strong>Desember 2070</strong>.
          </span>
        </div>
      </div>

      {/* WhatsApp Monthly Billing Modal */}
      <WhatsAppIuranModal
        isOpen={isWaModalOpen}
        onClose={() => {
          setIsWaModalOpen(false);
          setWaModalRegistrant(null);
        }}
        registrant={waModalRegistrant}
        initialBulanTagihan={waModalMonthLabel}
        initialAmount={waModalAmount}
      />
    </section>
  );
};
