import React, { useState, useEffect, useMemo } from 'react';
import { AdminRegistrant, PROGRAM_DATA } from '../types';
import { syncSingleRegistrant } from '../services/registrantStorage';
import {
  X,
  MessageCircle,
  Copy,
  Check,
  User,
  Shield,
  Wallet,
  Building2,
  CreditCard,
  UserCheck,
  Phone,
  Send,
  RefreshCw,
  Eye,
  Plus,
  Trash2
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  registrant: AdminRegistrant | null;
  initialBulanTagihan?: string;
  initialAmount?: number;
}

type IuranProgramOption = 'JKK + JKM' | 'JKK + JKM + JHT';

export interface BankAccountItem {
  id: string;
  bank: string;
  noRekening: string;
  atasNama: string;
}

const BANK_STORAGE_KEY = 'remako_iuran_bank_info';
const BANK_ACCOUNTS_STORAGE_KEY = 'remako_iuran_bank_accounts';

function createEmptyAccount(index?: number): BankAccountItem {
  const suffix = index !== undefined ? index : `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return {
    id: `rekening-${suffix}`,
    bank: '',
    noRekening: '',
    atasNama: ''
  };
}

function loadSavedBankAccounts(): BankAccountItem[] {
  try {
    const rawAccounts = localStorage.getItem(BANK_ACCOUNTS_STORAGE_KEY);
    if (rawAccounts) {
      const parsed = JSON.parse(rawAccounts);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => ({
          id: typeof item?.id === 'string' ? item.id : `rekening-${idx + 1}`,
          bank: typeof item?.bank === 'string' ? item.bank : '',
          noRekening: typeof item?.noRekening === 'string' ? item.noRekening : '',
          atasNama: typeof item?.atasNama === 'string' ? item.atasNama : ''
        }));
      }
    }

    // Fallback migration from single saved bank info
    const rawSingle = localStorage.getItem(BANK_STORAGE_KEY);
    if (rawSingle) {
      const parsed = JSON.parse(rawSingle);
      return [
        {
          id: 'rekening-1',
          bank: typeof parsed?.bank === 'string' ? parsed.bank : '',
          noRekening: typeof parsed?.noRekening === 'string' ? parsed.noRekening : '',
          atasNama: typeof parsed?.atasNama === 'string' ? parsed.atasNama : ''
        }
      ];
    }
  } catch {
    // Ignore storage read errors
  }
  return [createEmptyAccount(1)];
}

function saveBankAccounts(accounts: BankAccountItem[]): void {
  try {
    localStorage.setItem(BANK_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore storage write errors
  }
}

function formatRibuan(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('id-ID');
}

function detectProgramOption(program?: string): IuranProgramOption {
  if (program && program.toUpperCase().includes('JHT')) {
    return 'JKK + JKM + JHT';
  }
  return 'JKK + JKM';
}

function getDefaultRateString(programOption: IuranProgramOption): string {
  const amount =
    programOption === 'JKK + JKM + JHT'
      ? PROGRAM_DATA.JKK_JKM_JHT.monthlyRate
      : PROGRAM_DATA.JKK_JKM.monthlyRate;
  return amount.toLocaleString('id-ID');
}

export function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    return '62' + digits.slice(1);
  }
  if (digits.startsWith('62')) {
    return digits;
  }
  if (digits.startsWith('8')) {
    return '62' + digits;
  }
  return digits;
}

export interface IuranFormValues {
  nama: string;
  program: IuranProgramOption;
  iuranBulanan: string;
  bulanTagihan?: string;
  bankAccounts: BankAccountItem[];
}

export function buildIuranWhatsAppMessage(values: IuranFormValues): string {
  const namaVal = values.nama.trim() || '....................';
  const iuranVal = values.iuranBulanan.trim() || '....................';
  const bulanVal = (values.bulanTagihan || '').trim();

  const accounts = values.bankAccounts.length > 0 ? values.bankAccounts : [createEmptyAccount(1)];
  const bankLines: string[] = [];

  if (accounts.length === 1) {
    const acc = accounts[0];
    bankLines.push('Silakan melakukan pembayaran melalui transfer ke:');
    bankLines.push(`Bank: ${acc.bank.trim() || '....................'}`);
    bankLines.push(`No. Rekening: ${acc.noRekening.trim() || '....................'}`);
    bankLines.push(`Atas Nama: ${acc.atasNama.trim() || '....................'}`);
  } else {
    bankLines.push('Silakan melakukan pembayaran melalui transfer ke salah satu rekening berikut:');
    accounts.forEach((acc, idx) => {
      const bankName = acc.bank.trim() || '....................';
      const rekNum = acc.noRekening.trim() || '....................';
      const ownerName = acc.atasNama.trim() || '....................';
      bankLines.push('');
      bankLines.push(`*${idx + 1}. Bank ${bankName}*`);
      bankLines.push(`No. Rekening: ${rekNum}`);
      bankLines.push(`Atas Nama: ${ownerName}`);
    });
  }

  const lines = [
    '📢 *PEMBAYARAN IURAN BPJS KETENAGAKERJAAN*',
    '*REMAKO KALIMATI*',
    '',
    "Assalamu'alaikum Wr. Wb.",
    '',
    'Kepada seluruh anggota REMAKO yang telah terdaftar sebagai peserta BPJS Ketenagakerjaan, dimohon untuk melakukan pembayaran iuran bulanan dengan informasi berikut:',
    '',
    '👤 *DATA PESERTA*',
    `Nama: ${namaVal}`,
    ...(bulanVal ? [`Bulan Iuran: ${bulanVal}`] : []),
    `Program: ${values.program}`,
    `💰 Iuran Bulanan: Rp ${iuranVal}`,
    '',
    '📌 *PEMBAYARAN IURAN*',
    '',
    ...bankLines,
    '',
    'Mohon melakukan pembayaran tepat waktu agar kepesertaan BPJS Ketenagakerjaan tetap berjalan dengan baik.',
    '',
    'Terima kasih atas kerja sama dan partisipasinya.',
    '',
    'Salam,',
    '*Pengurus REMAKO KALIMATI* 🙏'
  ];

  return lines.join('\n');
}

export const WhatsAppIuranModal: React.FC<Props> = ({
  isOpen,
  onClose,
  registrant,
  initialBulanTagihan = '',
  initialAmount
}) => {
  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  const [bulanTagihan, setBulanTagihan] = useState('');
  const [program, setProgram] = useState<IuranProgramOption>('JKK + JKM');
  const [iuranBulanan, setIuranBulanan] = useState('16.800');
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>(() => loadSavedBankAccounts());
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sentClicked, setSentClicked] = useState(false);

  useEffect(() => {
    if (!isOpen || !registrant) return;

    const savedAccounts = loadSavedBankAccounts();
    const detectedProgram = detectProgramOption(registrant.program);

    setNama(registrant.namaLengkap || '');
    setNoHp(registrant.noHp || '');
    setBulanTagihan(initialBulanTagihan || '');
    setProgram(detectedProgram);
    setIuranBulanan(
      initialAmount && initialAmount > 0
        ? initialAmount.toLocaleString('id-ID')
        : getDefaultRateString(detectedProgram)
    );
    setBankAccounts(savedAccounts);
    setCopied(false);
    setSentClicked(false);

    // Sinkronkan data terbaru dari Supabase agar Program & No HP selalu akurat
    let active = true;
    setIsSyncing(true);
    syncSingleRegistrant(registrant.id, registrant.namaLengkap)
      .then((fresh) => {
        if (!active || !fresh) return;
        const freshProgram = detectProgramOption(fresh.program);
        setNama(fresh.namaLengkap || registrant.namaLengkap || '');
        setNoHp(fresh.noHp || registrant.noHp || '');
        setProgram(freshProgram);
        if (!initialAmount || initialAmount <= 0) {
          setIuranBulanan(getDefaultRateString(freshProgram));
        }
      })
      .catch(() => {
        // Fallback silently to existing local registrant data
      })
      .finally(() => {
        if (active) setIsSyncing(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, registrant?.id, initialBulanTagihan, initialAmount]);

  // Persist bank accounts whenever admin updates them
  useEffect(() => {
    if (!isOpen) return;
    saveBankAccounts(bankAccounts);
  }, [bankAccounts, isOpen]);

  const handleProgramChange = (nextProgram: IuranProgramOption) => {
    setProgram(nextProgram);
    setIuranBulanan(getDefaultRateString(nextProgram));
  };

  const handleAddBankAccount = () => {
    setBankAccounts((prev) => [...prev, createEmptyAccount()]);
  };

  const handleUpdateBankAccount = (
    id: string,
    field: keyof Omit<BankAccountItem, 'id'>,
    value: string
  ) => {
    setBankAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, [field]: value } : acc))
    );
  };

  const handleRemoveBankAccount = (id: string) => {
    setBankAccounts((prev) => {
      if (prev.length <= 1) {
        return [createEmptyAccount(1)];
      }
      return prev.filter((acc) => acc.id !== id);
    });
  };

  const messageText = useMemo(
    () =>
      buildIuranWhatsAppMessage({
        nama,
        program,
        iuranBulanan,
        bulanTagihan,
        bankAccounts
      }),
    [nama, program, iuranBulanan, bulanTagihan, bankAccounts]
  );

  const normalizedWaNumber = useMemo(() => formatPhoneForWhatsApp(noHp), [noHp]);
  const whatsappUrl = normalizedWaNumber
    ? `https://wa.me/${normalizedWaNumber}?text=${encodeURIComponent(messageText)}`
    : '';

  if (!isOpen || !registrant) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-100 my-auto animate-scaleUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#003366] via-[#0b4870] to-[#007b5e] p-5 sm:p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup popup"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-1.5 pr-10">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">
              Pengingat Pembayaran Iuran via WhatsApp
            </span>
            {isSyncing && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-white/15 px-2 py-0.5 rounded-full text-white">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                Sinkron DB...
              </span>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-300 shrink-0" />
            Kirim Form Iuran Bulanan Anggota
          </h3>
          <p className="text-xs text-slate-100/90 mt-1">
            Lengkapi rincian peserta & rekening transfer, lalu kirim langsung ke WhatsApp anggota dengan format yang rapi.
          </p>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 max-h-[72vh] overflow-y-auto">
          {/* Left Column: Form Inputs */}
          <div className="lg:col-span-7 space-y-4 text-xs">
            {/* Nomor WhatsApp Tujuan */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>No. WhatsApp Anggota Tujuan</span>
                </label>
                {normalizedWaNumber && (
                  <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                    wa.me/{normalizedWaNumber}
                  </span>
                )}
              </div>
              <input
                type="tel"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-mono font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* Data Peserta */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#003366]" />
                <span>👤 Data Peserta</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Peserta
                  </label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Nama lengkap anggota"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-[#003366]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bulan Tagihan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={bulanTagihan}
                    onChange={(e) => setBulanTagihan(e.target.value)}
                    placeholder="Contoh: November 2026"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-[#003366]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span>Program BPJS Ketenagakerjaan</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleProgramChange('JKK + JKM')}
                    className={`px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      program === 'JKK + JKM'
                        ? 'bg-[#003366] text-white border-[#003366] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-[#003366]/50'
                    }`}
                  >
                    <div className="font-bold text-xs">1. JKK + JKM</div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        program === 'JKK + JKM' ? 'text-emerald-200' : 'text-slate-500'
                      }`}
                    >
                      Standar Rp 16.800 / bln
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleProgramChange('JKK + JKM + JHT')}
                    className={`px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      program === 'JKK + JKM + JHT'
                        ? 'bg-[#003366] text-white border-[#003366] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-[#003366]/50'
                    }`}
                  >
                    <div className="font-bold text-xs">2. JKK + JKM + JHT</div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        program === 'JKK + JKM + JHT' ? 'text-emerald-200' : 'text-slate-500'
                      }`}
                    >
                      Standar Rp 36.800 / bln
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-amber-600" />
                  <span>💰 Iuran Bulanan (Rp)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-slate-500">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={iuranBulanan}
                    onChange={(e) => setIuranBulanan(formatRibuan(e.target.value))}
                    placeholder="16.800"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-[#003366]"
                  />
                </div>
              </div>
            </div>

            {/* Pembayaran Iuran (Multi Rekening) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#003366]" />
                    <span>📌 Rekening Transfer ({bankAccounts.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Daftar rekening tersimpan otomatis di browser
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddBankAccount}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#003366] hover:bg-[#0b4870] text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Tambah Rekening</span>
                </button>
              </div>

              <div className="space-y-3">
                {bankAccounts.map((acc, index) => (
                  <div
                    key={acc.id}
                    className="p-3 rounded-xl bg-white border border-slate-200/90 space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                      <span className="text-[11px] font-extrabold text-[#003366] uppercase tracking-wider">
                        Rekening {index + 1}
                      </span>
                      {bankAccounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBankAccount(acc.id)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title={`Hapus Rekening ${index + 1}`}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Bank
                        </label>
                        <input
                          type="text"
                          value={acc.bank}
                          onChange={(e) => handleUpdateBankAccount(acc.id, 'bank', e.target.value)}
                          placeholder="Contoh: BRI / BCA / Mandiri"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-[#003366]"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          <span>No. Rekening</span>
                        </label>
                        <input
                          type="text"
                          value={acc.noRekening}
                          onChange={(e) =>
                            handleUpdateBankAccount(acc.id, 'noRekening', e.target.value)
                          }
                          placeholder="Contoh: 1234-01-000567-50-8"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-[#003366]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-slate-400" />
                        <span>Atas Nama</span>
                      </label>
                      <input
                        type="text"
                        value={acc.atasNama}
                        onChange={(e) =>
                          handleUpdateBankAccount(acc.id, 'atasNama', e.target.value)
                        }
                        placeholder="Nama pemilik rekening"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-[#003366]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live WhatsApp Preview */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pratinjau Pesan WhatsApp</span>
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Salin Teks</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex-1 rounded-2xl bg-[#efeae2] border border-slate-200 p-3.5 overflow-y-auto max-h-[420px]">
              <div className="bg-[#d9fdd3] rounded-2xl rounded-tr-xs p-3.5 shadow-xs border border-emerald-200/70 text-[11.5px] leading-relaxed text-slate-800 whitespace-pre-wrap font-sans break-words">
                {messageText}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Pesan Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Salin Pesan</span>
                </>
              )}
            </button>

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setSentClicked(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#1fb857] active:bg-[#199e4a] text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {sentClicked ? 'Kirim Ulang ke WhatsApp' : 'Kirim ke WhatsApp'}
                </span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-300 text-slate-500 text-xs sm:text-sm font-bold rounded-xl cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>Isi No. HP Anggota</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
