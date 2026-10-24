import React, { useState, useEffect, useMemo } from 'react';
import { AdminRegistrant, DocumentStatus, maskPhoneNumber, maskNik } from '../types';
import {
  getRegistrants,
  updateRegistrantDocumentStatus,
  deleteRegistrant,
  saveRegistrant,
  fetchAndSyncRegistrants
} from '../services/registrantStorage';
import {
  getSupabaseConfig,
  signInWithSupabaseAuth,
  signUpWithSupabaseAuth,
  signOutSupabaseAuth
} from '../services/supabaseService';
import { SupabaseSettingsModal } from './SupabaseSettingsModal';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  CheckCircle2,
  Clock,
  Trash2,
  Download,
  Phone,
  CreditCard,
  AlertCircle,
  X,
  FileSpreadsheet,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  Database,
  RefreshCw,
  Loader2,
  Mail,
  LogOut,
  ShieldCheck,
  Sparkles,
  Info,
  FileText,
  FileDown,
  ExternalLink
} from 'lucide-react';
import { ExportDocxModal } from './ExportDocxModal';

interface Props {
  isAdminLoggedIn?: boolean;
  adminEmail?: string;
  onLoginSuccess?: (email: string) => void;
  onLogout?: () => void;
  onSwitchToForm?: () => void;
}

const ADMIN_SECRET_KEY = 'SAPALEWA';
const DEFAULT_ADMIN_EMAIL = 'cs.sapalewa@gmail.com';

export const DataPesertaSection: React.FC<Props> = ({
  isAdminLoggedIn = false,
  adminEmail = '',
  onLoginSuccess,
  onLogout,
  onSwitchToForm
}) => {
  const [registrants, setRegistrants] = useState<AdminRegistrant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | DocumentStatus>('Semua');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseConfig());
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Phone masking: enabled by default for public privacy
  const [isGlobalMaskingEnabled, setIsGlobalMaskingEnabled] = useState(true);
  const [revealedPhoneIds, setRevealedPhoneIds] = useState<Record<string, boolean>>({});

  // Auth Form in Modal
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [showKeyText, setShowKeyText] = useState(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Secret shortcut for admin options inside login modal
  const [showSecretControls, setShowSecretControls] = useState(false);
  const [secretClickCount, setSecretClickCount] = useState(0);

  // Docx Export Modal state
  const [docxModalRegistrant, setDocxModalRegistrant] = useState<AdminRegistrant | null>(null);
  const [isDocxModalOpen, setIsDocxModalOpen] = useState(false);

  // Add manual registrant form state
  const [newNama, setNewNama] = useState('');
  const [newNik, setNewNik] = useState('');
  const [newNamaIbuKandung, setNewNamaIbuKandung] = useState('');
  const [newAlamat, setNewAlamat] = useState('');
  const [newNoHp, setNewNoHp] = useState('');
  const [newDokumen, setNewDokumen] = useState<DocumentStatus>('Belum Terlampir');
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setIsSyncingCloud(true);
    try {
      const result = await fetchAndSyncRegistrants();
      setRegistrants(result.data);
    } catch {
      setRegistrants(getRegistrants());
    } finally {
      setIsSyncingCloud(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleStorageChange = () => {
      setRegistrants(getRegistrants());
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('registrants_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('registrants_updated', handleStorageChange);
    };
  }, []);

  const toggleRowPhoneMask = (id: string) => {
    // Only logged in admin can unmask individual rows
    if (!isAdminLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    setRevealedPhoneIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const isRowPhoneMasked = (id: string) => {
    if (!isAdminLoggedIn) return true; // Always masked for public
    if (!isGlobalMaskingEnabled) return false;
    return !revealedPhoneIds[id];
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const trimmedEmail = authEmail.trim();
    if (!trimmedEmail) {
      setAuthError('Email administrator wajib diisi.');
      return;
    }
    if (!authPassword) {
      setAuthError('Password administrator wajib diisi.');
      return;
    }

    setIsSubmittingAuth(true);

    try {
      const cfg = getSupabaseConfig();
      if (cfg.isEnabled && cfg.url && cfg.anonKey) {
        const res = await signInWithSupabaseAuth(trimmedEmail, authPassword);
        if (res.success) {
          const loggedEmail = res.user?.email || trimmedEmail;
          try {
            sessionStorage.setItem('bpjs_admin_unlocked', 'true');
            sessionStorage.setItem('bpjs_admin_email', loggedEmail);
          } catch {}
          setAuthSuccess('Berhasil login sebagai Administrator!');
          onLoginSuccess?.(loggedEmail);
          setTimeout(() => {
            setIsLoginModalOpen(false);
            setAuthSuccess('');
            setAuthPassword('');
          }, 600);
          return;
        } else {
          setAuthError(res.error || 'Email atau password salah di Supabase Auth.');
        }
      } else {
        if (
          (trimmedEmail.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() && authPassword === ADMIN_SECRET_KEY) ||
          authPassword === ADMIN_SECRET_KEY
        ) {
          const loggedEmail = trimmedEmail || DEFAULT_ADMIN_EMAIL;
          try {
            sessionStorage.setItem('bpjs_admin_unlocked', 'true');
            sessionStorage.setItem('bpjs_admin_email', loggedEmail);
          } catch {}
          onLoginSuccess?.(loggedEmail);
          setAuthSuccess('Berhasil masuk sebagai Administrator!');
          setTimeout(() => {
            setIsLoginModalOpen(false);
            setAuthSuccess('');
            setAuthPassword('');
          }, 600);
          return;
        } else {
          setAuthError('Email atau password tidak sesuai. Gunakan akun administrator yang sah.');
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Terjadi kesalahan sistem saat mencoba login.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleSignUpWithSupabase = async () => {
    setAuthError('');
    setAuthSuccess('');

    const cfg = getSupabaseConfig();
    if (!cfg.isEnabled || !cfg.url || !cfg.anonKey) {
      setAuthError('Supabase belum terhubung. Konfigurasi URL dan Anon Key terlebih dahulu.');
      return;
    }

    const trimmedEmail = authEmail.trim();
    if (!trimmedEmail || !authPassword) {
      setAuthError('Email dan password wajib diisi untuk pendaftaran akun.');
      return;
    }

    setIsSigningUp(true);
    try {
      const res = await signUpWithSupabaseAuth(trimmedEmail, authPassword);
      if (res.success) {
        if (res.session?.user) {
          const loggedEmail = res.user?.email || trimmedEmail;
          try {
            sessionStorage.setItem('bpjs_admin_unlocked', 'true');
            sessionStorage.setItem('bpjs_admin_email', loggedEmail);
          } catch {}
          setAuthSuccess('Pendaftaran berhasil dan Anda langsung masuk!');
          onLoginSuccess?.(loggedEmail);
          setTimeout(() => {
            setIsLoginModalOpen(false);
            setAuthSuccess('');
            setAuthPassword('');
          }, 600);
        } else {
          setAuthSuccess(res.message || 'Akun berhasil didaftarkan di Supabase Auth!');
        }
      } else {
        setAuthError(res.error || 'Gagal mendaftarkan akun di Supabase.');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Terjadi gangguan saat mendaftarkan akun.');
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleStatusChange = (id: string, newStatus: DocumentStatus) => {
    if (!isAdminLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    const updated = updateRegistrantDocumentStatus(id, newStatus);
    setRegistrants(updated);
  };

  const handleDelete = (id: string) => {
    if (!isAdminLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    const updated = deleteRegistrant(id);
    setRegistrants(updated);
    setDeleteConfirmId(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim() || !newAlamat.trim() || !newNoHp.trim()) {
      setFormError('Nama lengkap, alamat, dan nomor HP wajib diisi.');
      return;
    }

    const created = saveRegistrant({
      namaLengkap: newNama.trim(),
      alamat: newAlamat.trim(),
      noHp: newNoHp.trim(),
      dokumen: newDokumen,
      namaIbuKandung: newNamaIbuKandung.trim(),
      nik: newNik.trim()
    });

    setRegistrants([created, ...registrants]);
    setNewNama('');
    setNewNik('');
    setNewNamaIbuKandung('');
    setNewAlamat('');
    setNewNoHp('');
    setNewDokumen('Belum Terlampir');
    setFormError('');
    setIsAddModalOpen(false);
  };

  const filteredRegistrants = useMemo(() => {
    return registrants.filter((item) => {
      const matchSearch =
        item.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.alamat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.noHp.includes(searchQuery);

      const matchStatus =
        statusFilter === 'Semua' ? true : item.dokumen === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [registrants, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = registrants.length;
    const terlampir = registrants.filter((r) => r.dokumen === 'Terlampir').length;
    const belumTerlampir = registrants.filter((r) => r.dokumen === 'Belum Terlampir').length;
    return { total, terlampir, belumTerlampir };
  }, [registrants]);

  const exportToCSV = () => {
    if (registrants.length === 0) return;
    const headers = ['Nama Lengkap', 'Alamat', 'No Hp', 'Dokumen'];
    const rows = registrants.map((r) => [
      `"${r.namaLengkap.replace(/"/g, '""')}"`,
      `"${r.alamat.replace(/"/g, '""')}"`,
      `"${!isAdminLoggedIn || isGlobalMaskingEnabled ? maskPhoneNumber(r.noHp) : r.noHp}"`,
      `"${r.dokumen}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `data_peserta_bpjs_bpu_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section id="data-peserta" className="w-full space-y-6">
      {/* Top Banner & Heading Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/60 border border-slate-200/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#003366] to-[#007b5e] text-white flex items-center justify-center shadow-md shadow-emerald-700/20 shrink-0">
              <Users className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Terbuka untuk Umum & Transparan</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Data Peserta Terdaftar
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Tabel rekapitulasi calon peserta BPJS Ketenagakerjaan BPU. Seluruh pendaftar dapat memeriksa status kelengkapan dokumen pendaftarannya di sini.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            {/* Supabase / Local status pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
              <span className={`w-2 h-2 rounded-full ${supabaseConfig.isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="font-semibold text-[11px]">
                {supabaseConfig.isEnabled ? 'Cloud Supabase' : 'Penyimpanan Lokal'}
              </span>
            </div>

            {/* Refresh / Sync Button */}
            <button
              type="button"
              onClick={loadData}
              disabled={isSyncingCloud}
              className="p-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl transition-colors border border-slate-200 cursor-pointer"
              title="Perbarui dan sinkronkan data pendaftar"
            >
              <RefreshCw className={`w-4 h-4 text-[#003366] ${isSyncingCloud ? 'animate-spin' : ''}`} />
            </button>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors border border-slate-200 cursor-pointer"
              title="Unduh Data dalam format CSV / Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export CSV</span>
            </button>

            {/* Admin Controls / Login */}
            {isAdminLoggedIn ? (
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  title="Tambah data pendaftar manual"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Tambah Data</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors border border-slate-200 cursor-pointer"
                  title="Pengaturan Supabase Cloud"
                >
                  <Database className="w-3.5 h-3.5 text-[#003366]" />
                  <span className="hidden sm:inline">Database</span>
                </button>

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-red-200"
                    title="Keluar dari sesi Administrator"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Keluar Admin</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#003366] hover:bg-[#0b4870] text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                title="Buka menu pengelolaan khusus petugas administrator"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                <span>Login Petugas</span>
              </button>
            )}
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-5">
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Pendaftar
              </span>
              <span className="text-2xl font-black text-slate-900 mt-0.5 block">
                {stats.total}
              </span>
              <span className="text-[11px] text-slate-500">Seluruh peserta tercatat</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-100/70 text-[#003366] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                Dokumen Terlampir
              </span>
              <span className="text-2xl font-black text-emerald-700 mt-0.5 block">
                {stats.terlampir}
              </span>
              <span className="text-[11px] text-emerald-600">KTP, KK, & Foto Terpenuhi</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">
                Belum Terlampir
              </span>
              <span className="text-2xl font-black text-amber-600 mt-0.5 block">
                {stats.belumTerlampir}
              </span>
              <span className="text-[11px] text-amber-700">Menunggu lampiran foto</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Privacy Info Notice regarding NIK and phone number sensor */}
        <div className="mt-4 p-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Perlindungan Data Pribadi (PDP):</strong> Nomor NIK dan Nomor HP seluruh pendaftar secara otomatis disensor untuk menjaga privasi masyarakat umum. Persyaratan pendaftaran yang perlu dikirimkan via WhatsApp mencakup: <strong>Foto KTP Asli</strong>, <strong>Foto KK Asli</strong>, dan <strong>Foto diri terbaru (selfi)</strong>.
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama lengkap, alamat, atau nomor HP peserta..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366] focus:bg-white transition-all text-slate-800"
          />
        </div>

        {/* Status Tabs Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['Semua', 'Terlampir', 'Belum Terlampir'] as const).map((status) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#003366] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
                {status === 'Terlampir' && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-extrabold">
                    {stats.terlampir}
                  </span>
                )}
                {status === 'Belum Terlampir' && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
                    {stats.belumTerlampir}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* The 4-Column Table: Nama Lengkap, Alamat, No Hp, Dokumen */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/60 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Daftar Peserta BPJS Ketenagakerjaan BPU
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan {filteredRegistrants.length} dari total {registrants.length} pendaftar terdaftar
            </p>
          </div>

          {/* Admin Sensor Toggle if logged in */}
          {isAdminLoggedIn && (
            <button
              type="button"
              onClick={() => {
                setIsGlobalMaskingEnabled((prev) => !prev);
                setRevealedPhoneIds({});
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isGlobalMaskingEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              {isGlobalMaskingEnabled ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mode Admin: Sensor Aktif</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-amber-600" />
                  <span>Mode Admin: Buka Seluruh Sensor</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[11px]">
                <th scope="col" className="py-3.5 px-4 sm:px-6 w-1/4">
                  Nama Lengkap
                </th>
                <th scope="col" className="py-3.5 px-4 sm:px-6 w-1/3">
                  <div className="flex items-center gap-1.5">
                    <span>NIK</span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 normal-case">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                      Disensor
                    </span>
                  </div>
                </th>
                <th scope="col" className="py-3.5 px-4 sm:px-6">
                  <div className="flex items-center gap-1.5">
                    <span>No Hp</span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 normal-case">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                      Disensor
                    </span>
                  </div>
                </th>
                <th scope="col" className="py-3.5 px-4 sm:px-6">
                  Dokumen
                </th>
                {isAdminLoggedIn && (
                  <th scope="col" className="py-3.5 px-3 sm:px-4 text-center w-28">
                    Formulir
                  </th>
                )}
                {isAdminLoggedIn && (
                  <th scope="col" className="py-3.5 px-3 sm:px-4 text-center w-12">
                    <span className="sr-only">Aksi</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRegistrants.length === 0 ? (
                <tr>
                  <td colSpan={isAdminLoggedIn ? 6 : 4} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-700 text-sm">
                        Tidak ada catatan pendaftar yang cocok
                      </p>
                      <p className="text-xs text-slate-400">
                        {searchQuery || statusFilter !== 'Semua'
                          ? 'Coba ganti kata kunci pencarian atau ubah filter status dokumen.'
                          : 'Belum ada data pendaftar yang tercatat.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRegistrants.map((row) => {
                  const isTerlampir = row.dokumen === 'Terlampir';
                  const isMasked = isRowPhoneMasked(row.id);

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* 1. Nama Lengkap */}
                      <td className="py-3.5 px-4 sm:px-6 align-top">
                        <span className="font-bold text-slate-900 block leading-snug">
                          {row.namaLengkap}
                        </span>
                      </td>

                      {/* 2. NIK (Disensor demi privasi seluruh peserta) */}
                      <td className="py-3.5 px-4 sm:px-6 align-top">
                        <div className="inline-flex items-center gap-1.5 flex-wrap">
                          <div className="inline-flex items-center gap-1.5 font-mono font-semibold text-slate-700 cursor-default select-text">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span
                              className={
                                isMasked
                                  ? 'tracking-wider text-slate-700 font-medium bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200'
                                  : ''
                              }
                            >
                              {isMasked
                                ? (row.nik ? maskNik(row.nik) : '•••• •••••••• ••••')
                                : (row.nik || '-')}
                            </span>
                          </div>

                          {isAdminLoggedIn && (
                            <button
                              type="button"
                              onClick={() => toggleRowPhoneMask(row.id)}
                              className="p-1 text-slate-400 hover:text-[#003366] hover:bg-slate-100 rounded-md transition-colors cursor-pointer shrink-0"
                              title={isMasked ? 'Buka sensor NIK & No HP' : 'Sensor kembali'}
                            >
                              {isMasked ? (
                                <Eye className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5 text-emerald-600 hover:text-emerald-800" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 3. No Hp (Disensor demi privasi seluruh peserta) */}
                      <td className="py-3.5 px-4 sm:px-6 align-top">
                        <div className="inline-flex items-center gap-1.5 flex-wrap">
                          <div
                            className="inline-flex items-center gap-1.5 font-mono font-semibold text-slate-700 cursor-default select-text"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span
                              className={
                                isMasked
                                  ? 'tracking-wider text-slate-700 font-medium bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200'
                                  : ''
                              }
                            >
                              {isMasked ? maskPhoneNumber(row.noHp) : row.noHp}
                            </span>
                          </div>

                          {isAdminLoggedIn && (
                            <button
                              type="button"
                              onClick={() => toggleRowPhoneMask(row.id)}
                              className="p-1 text-slate-400 hover:text-[#003366] hover:bg-slate-100 rounded-md transition-colors cursor-pointer shrink-0"
                              title={isMasked ? 'Buka sensor nomor HP ini' : 'Sensor kembali'}
                            >
                              {isMasked ? (
                                <Eye className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5 text-emerald-600 hover:text-emerald-800" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 4. Dokumen (Terlampir / Belum Terlampir) */}
                      <td className="py-3.5 px-4 sm:px-6 align-top">
                        {isAdminLoggedIn ? (
                          /* Interactive dropdown for logged in admin */
                          <div className="relative inline-block w-full max-w-[170px]">
                            <select
                              value={row.dokumen}
                              onChange={(e) =>
                                handleStatusChange(row.id, e.target.value as DocumentStatus)
                              }
                              className={`w-full py-1.5 pl-3 pr-7 text-xs font-extrabold rounded-xl border appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2 ${
                                isTerlampir
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-emerald-400'
                                  : 'bg-amber-50 text-amber-800 border-amber-300 focus:ring-amber-400'
                              }`}
                            >
                              <option value="Terlampir">Terlampir</option>
                              <option value="Belum Terlampir">Belum Terlampir</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                              </svg>
                            </div>
                          </div>
                        ) : (
                          /* Public view badge */
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                              isTerlampir
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {isTerlampir ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Terlampir</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Belum Terlampir</span>
                              </>
                            )}
                          </span>
                        )}
                      </td>

                      {/* 5. Formulir DOCX (Hanya saat admin login) */}
                      {isAdminLoggedIn && (
                        <td className="py-3.5 px-3 sm:px-4 align-top text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setDocxModalRegistrant(row);
                              setIsDocxModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#003366]/5 text-[#003366] hover:bg-[#003366] hover:text-white border border-[#003366]/20 hover:border-[#003366] transition-all shadow-2xs cursor-pointer group/docx"
                            title={`Ekspor Formulir Word (.docx) untuk ${row.namaLengkap}`}
                          >
                            <FileDown className="w-3.5 h-3.5 text-[#003366] group-hover/docx:text-white transition-colors" />
                            <span>DOCX</span>
                          </button>
                        </td>
                      )}

                      {/* Admin action column */}
                      {isAdminLoggedIn && (
                        <td className="py-3.5 px-3 sm:px-4 align-top text-center">
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(row.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus baris pendaftar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info in table */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Nomor NIK dan HP peserta <strong>disensor otomatis</strong> demi perlindungan data pribadi (PDP).
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>
              Persyaratan lengkap: <strong>Foto KTP Asli</strong>, <strong>Foto KK Asli</strong>, dan <strong>Foto diri terbaru (selfi)</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* Admin Login Modal (Triggered by 'Login Petugas' button) */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-scaleUp">
            <div className="bg-gradient-to-r from-[#003366] via-[#0b4870] to-[#007b5e] p-6 text-white text-center relative select-none">
              <button
                type="button"
                onClick={() => {
                  setIsLoginModalOpen(false);
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-emerald-200 mb-3">
                <Users className="w-3.5 h-3.5 text-amber-300" />
                <span>Pengelolaan Administrator</span>
              </div>

              <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300 shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold tracking-tight">Login Petugas / Admin</h3>
              <p className="text-xs text-emerald-100 mt-1">
                Masuk untuk mengubah status dokumen, menambah, atau menghapus catatan pendaftar
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Gagal Masuk</p>
                    <p className="text-[11px] mt-0.5">{authError}</p>
                  </div>
                </div>
              )}

              {authSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{authSuccess}</span>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Administrator
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    autoFocus
                    required
                    value={authEmail}
                    onChange={(e) => {
                      setAuthEmail(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="cs.sapalewa@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-[#003366] focus:bg-white text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password Administrator
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showKeyText ? 'text' : 'password'}
                    required
                    value={authPassword}
                    onChange={(e) => {
                      setAuthPassword(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-[#003366] focus:bg-white text-slate-800 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyText(!showKeyText)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full py-3 bg-[#003366] hover:bg-[#002244] disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmittingAuth ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 text-emerald-300" />
                      <span>Masuk Administrator</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Data Pendaftar Manual (Khusus Petugas) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-5 bg-gradient-to-r from-[#003366] to-[#007b5e] text-white flex items-center justify-between">
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-300" />
                Tambah Pendaftar Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 sm:p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#003366]"
                />
              </div>

              {/* NIK & Nama Ibu Kandung */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No KTP (NIK)
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={newNik}
                    onChange={(e) => setNewNik(e.target.value.replace(/\D/g, ''))}
                    placeholder="16 digit NIK"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#003366] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Ibu Kandung
                  </label>
                  <input
                    type="text"
                    value={newNamaIbuKandung}
                    onChange={(e) => setNewNamaIbuKandung(e.target.value)}
                    placeholder="Nama ibu kandung"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#003366]"
                  />
                </div>
              </div>

              {/* Alamat */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Lengkap <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={newAlamat}
                  onChange={(e) => setNewAlamat(e.target.value)}
                  placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#003366] resize-none"
                />
              </div>

              {/* No Hp */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor HP / WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={newNoHp}
                  onChange={(e) => setNewNoHp(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#003366]"
                />
              </div>

              {/* Status Dokumen */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Dokumen
                </label>
                <select
                  value={newDokumen}
                  onChange={(e) => setNewDokumen(e.target.value as DocumentStatus)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#003366] font-bold"
                >
                  <option value="Belum Terlampir">Belum Terlampir</option>
                  <option value="Terlampir">Terlampir</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#003366] hover:bg-sky-900 text-white rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Simpan Pendaftar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Hapus Catatan Pendaftar?</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Data pendaftar ini akan dihapus dari sistem. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supabase Database Settings Modal */}
      <SupabaseSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        localRegistrants={registrants}
        onConfigSaved={() => {
          loadData();
          setSupabaseConfig(getSupabaseConfig());
        }}
      />

      {/* Export to Word (.docx) Modal */}
      <ExportDocxModal
        isOpen={isDocxModalOpen}
        onClose={() => {
          setIsDocxModalOpen(false);
          setDocxModalRegistrant(null);
        }}
        registrant={docxModalRegistrant}
        onSaveRegistrant={(updated) => {
          setRegistrants((prev) =>
            prev.map((r) => (r.id === updated.id ? updated : r))
          );
          setDocxModalRegistrant(updated);
        }}
      />
    </section>
  );
};
