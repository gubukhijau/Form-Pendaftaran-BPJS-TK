import React, { useState, useEffect, useMemo } from 'react';
import { AdminRegistrant, DocumentStatus, maskPhoneNumber } from '../types';
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
  signOutSupabaseAuth,
  getCurrentSupabaseSession
} from '../services/supabaseService';
import { SupabaseSettingsModal } from './SupabaseSettingsModal';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Trash2,
  Download,
  Phone,
  MapPin,
  FileCheck,
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
  Cloud,
  Loader2,
  Mail,
  LogOut,
  ShieldCheck,
  Sparkles,
  Info,
  FileText
} from 'lucide-react';

interface Props {
  onBackToForm: () => void;
  isAdminLoggedIn?: boolean;
  onLoginSuccess?: (email: string) => void;
  onLogout?: () => void;
}

const ADMIN_SECRET_KEY = 'SAPALEWA';
const DEFAULT_ADMIN_EMAIL = 'cs.sapalewa@gmail.com';

export const AdminPage: React.FC<Props> = ({
  onBackToForm,
  isAdminLoggedIn,
  onLoginSuccess,
  onLogout
}) => {
  // Authentication lock state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      if (isAdminLoggedIn) return true;
      return sessionStorage.getItem('bpjs_admin_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    try {
      return sessionStorage.getItem('bpjs_admin_email') || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    if (isAdminLoggedIn) {
      setIsAuthenticated(true);
    }
  }, [isAdminLoggedIn]);

  // Supabase Auth credentials state (kosongkan secara default agar tidak terlihat)
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [showKeyText, setShowKeyText] = useState(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Fitur Rahasia: Sembunyikan tombol Setting dan Daftar Akun (hanya admin yang tahu cara membukanya)
  const [showSecretControls, setShowSecretControls] = useState(false);
  const [secretClickCount, setSecretClickCount] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut rahasia: Alt + S atau Ctrl + Shift + S
      if ((e.altKey && (e.key === 's' || e.key === 'S')) || (e.ctrlKey && e.shiftKey && (e.key === 's' || e.key === 'S'))) {
        e.preventDefault();
        setShowSecretControls((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSecretLogoClick = () => {
    const nextCount = secretClickCount + 1;
    if (nextCount >= 3) {
      setShowSecretControls((prev) => !prev);
      setSecretClickCount(0);
    } else {
      setSecretClickCount(nextCount);
      setTimeout(() => {
        setSecretClickCount(0);
      }, 2500);
    }
  };

  const [registrants, setRegistrants] = useState<AdminRegistrant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | DocumentStatus>('Semua');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseConfig());
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sensor nomor HP peserta: aktif secara default demi privasi
  const [isGlobalMaskingEnabled, setIsGlobalMaskingEnabled] = useState(true);
  const [revealedPhoneIds, setRevealedPhoneIds] = useState<Record<string, boolean>>({});

  const toggleRowPhoneMask = (id: string) => {
    setRevealedPhoneIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const isRowPhoneMasked = (id: string) => {
    if (!isGlobalMaskingEnabled) return false;
    return !revealedPhoneIds[id];
  };

  // New manual entry form state
  const [newNama, setNewNama] = useState('');
  const [newAlamat, setNewAlamat] = useState('');
  const [newNoHp, setNewNoHp] = useState('');
  const [newDokumen, setNewDokumen] = useState<DocumentStatus>('Belum Terlampir');
  const [formError, setFormError] = useState('');

  // Check active Supabase session on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const session = await getCurrentSupabaseSession();
        if (session?.user) {
          setIsAuthenticated(true);
          const email = session.user.email || DEFAULT_ADMIN_EMAIL;
          setCurrentUserEmail(email);
          try {
            sessionStorage.setItem('bpjs_admin_unlocked', 'true');
            sessionStorage.setItem('bpjs_admin_email', email);
          } catch {}
        }
      } catch (err) {
        console.warn('Error checking supabase session:', err);
      }
    };
    checkActiveSession();
  }, []);

  const loadData = async () => {
    setIsSyncingCloud(true);
    try {
      const res = await fetchAndSyncRegistrants();
      setRegistrants(res.data);
    } catch {
      setRegistrants(getRegistrants());
    } finally {
      setSupabaseConfig(getSupabaseConfig());
      setIsSyncingCloud(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

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
        // Attempt Supabase Auth login
        const res = await signInWithSupabaseAuth(trimmedEmail, authPassword);
        if (res.success) {
          setIsAuthenticated(true);
          const loggedEmail = res.user?.email || trimmedEmail;
          setCurrentUserEmail(loggedEmail);
          try {
            sessionStorage.setItem('bpjs_admin_unlocked', 'true');
            sessionStorage.setItem('bpjs_admin_email', loggedEmail);
          } catch {}
          setAuthSuccess('Berhasil login via Supabase Auth!');
          onLoginSuccess?.(loggedEmail);
          return;
        } else {
          // Display error from Supabase
          setAuthError(res.error || 'Email atau password salah di Supabase Auth.');
        }
      } else {
        // Supabase belum dihubungkan / diatur
        if (
          (trimmedEmail.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() && authPassword === ADMIN_SECRET_KEY) ||
          authPassword === ADMIN_SECRET_KEY
        ) {
          setIsAuthenticated(true);
          const loggedEmail = trimmedEmail || DEFAULT_ADMIN_EMAIL;
          setCurrentUserEmail(loggedEmail);
          try {
            sessionStorage.setItem('bpjs_admin_unlocked', 'true');
            sessionStorage.setItem('bpjs_admin_email', loggedEmail);
          } catch {}
          onLoginSuccess?.(loggedEmail);
          return;
        } else {
          setAuthError('Email atau password tidak sesuai. Pastikan Anda memasukkan akun administrator yang benar.');
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
      setAuthError('Supabase belum terhubung. Silakan atur URL dan Anon Key di tombol "Setting Supabase" di bawah terlebih dahulu.');
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
          setIsAuthenticated(true);
          const loggedEmail = res.user?.email || trimmedEmail;
          setCurrentUserEmail(loggedEmail);
          try {
            sessionStorage.setItem('bpjs_admin_unlocked', 'true');
            sessionStorage.setItem('bpjs_admin_email', loggedEmail);
          } catch {}
          setAuthSuccess('Pendaftaran berhasil dan Anda langsung masuk!');
          onLoginSuccess?.(loggedEmail);
        } else {
          setAuthSuccess(res.message || 'Akun berhasil didaftarkan di Supabase Auth! Silakan coba klik tombol "Masuk via Supabase Auth".');
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

  const handleLockAdmin = async () => {
    try {
      await signOutSupabaseAuth();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    setIsAuthenticated(false);
    setCurrentUserEmail('');
    setAuthError('');
    setAuthSuccess('');
    try {
      sessionStorage.removeItem('bpjs_admin_unlocked');
      sessionStorage.removeItem('bpjs_admin_email');
    } catch {}
    onLogout?.();
  };

  const handleStatusChange = (id: string, newStatus: DocumentStatus) => {
    const updated = updateRegistrantDocumentStatus(id, newStatus);
    setRegistrants(updated);
  };

  const handleDelete = (id: string) => {
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
      dokumen: newDokumen
    });

    setRegistrants([created, ...registrants]);
    setNewNama('');
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
      `"${isGlobalMaskingEnabled ? maskPhoneNumber(r.noHp) : r.noHp}"`,
      `"${r.dokumen}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `data_pendaftar_bpjs_bpu_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Locked View (Supabase Auth Login: cs.sapalewa@gmail.com / SAPALEWA)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
          {/* Top Header */}
          <div className="bg-gradient-to-r from-[#003366] via-[#0b4870] to-[#007b5e] p-6 text-white text-center relative select-none">
            {/* Top pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-emerald-200 mb-3">
              <Users className="w-3.5 h-3.5 text-amber-300" />
              <span>Menu Data Peserta</span>
              <Lock className="w-3 h-3 text-white/70 ml-0.5" />
            </div>

            <button
              type="button"
              onClick={handleSecretLogoClick}
              title="Kunci Administrator"
              aria-label="Kunci Administrator"
              className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300 shadow-inner cursor-pointer active:scale-95 transition-transform"
            >
              <Users className="w-7 h-7" />
            </button>
            <h2 className="text-xl font-extrabold tracking-tight">Login Administrator</h2>
            <p className="text-xs text-emerald-100 mt-1">
              Halaman Data Peserta akan muncul setelah administrator berhasil login
            </p>
            {showSecretControls && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900 shadow-xs animate-fadeIn">
                <span>Pengaturan Rahasia Terbuka</span>
                <button
                  type="button"
                  onClick={() => setShowSecretControls(false)}
                  className="ml-1 text-slate-800 hover:text-black font-extrabold text-[11px] cursor-pointer"
                  title="Sembunyikan kembali"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Form Body */}
          <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
            {/* Supabase status badge & Setting button - Disembunyikan (Hanya tampil jika mode rahasia aktif) */}
            {showSecretControls && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${supabaseConfig.isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="font-semibold text-slate-700">
                    {supabaseConfig.isEnabled ? 'Supabase Auth Cloud Aktif' : 'Supabase Belum Dihubungkan'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-[11px] font-bold text-[#003366] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Database className="w-3 h-3 text-emerald-600" />
                  <span>Setting</span>
                </button>
              </div>
            )}

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Gagal Masuk</p>
                  <p className="text-[11px] mt-0.5 leading-relaxed">{authError}</p>
                </div>
              </div>
            )}

            {authSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* Email Field */}
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
                  placeholder="admin@email.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-[#003366] focus:bg-white transition-all text-slate-800 font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
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
                  placeholder="Masukkan password..."
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-[#003366] focus:bg-white transition-all text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowKeyText(!showKeyText)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showKeyText ? 'Sembunyikan Password' : 'Tampilkan Password'}
                >
                  {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isSubmittingAuth || isSigningUp}
                className="w-full py-3 bg-[#003366] hover:bg-[#002244] active:scale-[0.99] disabled:opacity-60 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmittingAuth ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{showSecretControls ? 'Masuk via Supabase Auth' : 'Masuk Administrator'}</span>
                  </>
                )}
              </button>

              {/* Tombol Sign Up disembunyikan - hanya muncul jika mode rahasia aktif */}
              {showSecretControls && supabaseConfig.isEnabled && (
                <button
                  type="button"
                  onClick={handleSignUpWithSupabase}
                  disabled={isSubmittingAuth || isSigningUp}
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer animate-fadeIn"
                  title="Daftarkan akun administrator ke Supabase jika belum terdaftar"
                >
                  {isSigningUp ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>Mendaftarkan ke Supabase...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Daftarkan Akun Ini ke Supabase (Sign Up)</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onBackToForm}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Formulir Pendaftaran</span>
              </button>
            </div>
          </form>
        </div>

        {/* Modal Pengaturan Supabase (Bisa diakses langsung dari halaman Login) */}
        <SupabaseSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => {
            setIsSettingsOpen(false);
            setSupabaseConfig(getSupabaseConfig());
          }}
          localRegistrants={getRegistrants()}
          onConfigSaved={() => {
            setSupabaseConfig(getSupabaseConfig());
            setAuthError('');
          }}
        />
      </div>
    );
  }

  // Unlocked View
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-gradient-to-r from-[#003366] via-[#0b4870] to-[#007b5e] text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Menu Navigasi: Formulir & Data Peserta */}
              <div className="inline-flex items-center bg-black/25 backdrop-blur-md p-1 rounded-xl border border-white/20 text-xs">
                <button
                  type="button"
                  onClick={onBackToForm}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 font-semibold transition-colors cursor-pointer"
                  title="Kembali ke Formulir Pendaftaran"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Formulir Pendaftaran</span>
                </button>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-bold shadow-xs">
                  <Users className="w-3.5 h-3.5" />
                  <span>Data Peserta</span>
                </div>
              </div>

              <div className="h-6 w-px bg-white/20 hidden md:block" />

              <div className="hidden md:block">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Halaman Data Peserta</span>
                </h1>
                <p className="text-[11px] text-emerald-100">
                  Data pendaftar BPJS Ketenagakerjaan BPU ({supabaseConfig.isEnabled ? 'Supabase Cloud' : 'Lokal'})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl border border-white/20 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-emerald-100 font-medium max-w-[190px] truncate" title={currentUserEmail}>
                  {currentUserEmail}
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-400/20 text-emerald-200 rounded border border-emerald-400/30">
                  {supabaseConfig.isEnabled ? 'Supabase Auth' : 'Admin'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all border border-emerald-300/40 cursor-pointer"
                title="Pengaturan Koneksi Supabase Database & Auth"
              >
                <Database className="w-4 h-4 text-emerald-300" />
                <span>Setting Supabase</span>
                {supabaseConfig.isEnabled && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={loadData}
                disabled={isSyncingCloud}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/20 cursor-pointer"
                title="Muat ulang dan sinkronkan data dari Supabase/Lokal"
              >
                <RefreshCw className={`w-4 h-4 text-emerald-300 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Data</span>
              </button>

              <button
                type="button"
                onClick={exportToCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors border border-white/20 cursor-pointer"
                title="Download Data CSV (Excel)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>

              <button
                type="button"
                onClick={handleLockAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-500/20 hover:bg-red-500/35 active:bg-red-500/40 text-red-200 hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors border border-red-400/30 ml-1 cursor-pointer"
                title="Keluar dari sesi Supabase Auth & Kunci Admin"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar (Logout)</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 space-y-6">
        {/* Supabase Cloud Status Banner */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 px-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                supabaseConfig.isEnabled
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm">
                  {supabaseConfig.isEnabled
                    ? 'Sinkronisasi Supabase Aktif'
                    : 'Penyimpanan Database Lokal'}
                </span>
                {supabaseConfig.isEnabled ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online ({supabaseConfig.tableName})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Mode Lokal (Offline)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                {supabaseConfig.isEnabled
                  ? 'Data pendaftar tersinkronisasi otomatis ke cloud Supabase dan dapat diakses dari perangkat mana pun.'
                  : 'Data saat ini tersimpan di browser ini. Hubungkan database Supabase agar dapat diakses dari mana saja.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSyncingCloud && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#003366] font-semibold animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyinkronkan cloud...</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
            >
              <Database className="w-3.5 h-3.5 text-[#003366]" />
              <span>Setting Supabase</span>
            </button>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Pendaftar
              </span>
              <span className="text-2xl font-black text-slate-900 mt-0.5 block">
                {stats.total}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-[#003366] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Dokumen Terlampir
              </span>
              <span className="text-2xl font-black text-emerald-700 mt-0.5 block">
                {stats.terlampir}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Belum Terlampir
              </span>
              <span className="text-2xl font-black text-amber-600 mt-0.5 block">
                {stats.belumTerlampir}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, alamat, atau nomor HP..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366] focus:bg-white transition-all"
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
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white">
                      {stats.terlampir}
                    </span>
                  )}
                  {status === 'Belum Terlampir' && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white">
                      {stats.belumTerlampir}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* The Table - Exactly specified columns: Nama Lengkap, Alamat, No Hp, Dokumen */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Tabel Catatan Pendaftar
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Menampilkan {filteredRegistrants.length} dari total {registrants.length} pendaftar
              </p>
            </div>

            {/* Tombol Kontrol Sensor Nomor HP */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsGlobalMaskingEnabled((prev) => !prev);
                  setRevealedPhoneIds({});
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  isGlobalMaskingEnabled
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 shadow-xs'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
                title={
                  isGlobalMaskingEnabled
                    ? 'Klik untuk membuka sensor nomor HP seluruh peserta'
                    : 'Klik untuk mengaktifkan sensor nomor HP peserta'
                }
              >
                {isGlobalMaskingEnabled ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sensor HP: Aktif</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                    <span>Sensor HP: Terbuka</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[11px]">
                  <th scope="col" className="py-3.5 px-4 sm:px-6 w-1/4">
                    Nama Lengkap
                  </th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6 w-2/5">
                    Alamat
                  </th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6 w-1/5">
                    <div className="flex items-center gap-1.5">
                      <span>No Hp</span>
                      {isGlobalMaskingEnabled && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 normal-case">
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                          Disensor
                        </span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6 w-1/5">
                    Dokumen
                  </th>
                  <th scope="col" className="py-3.5 px-3 sm:px-4 text-center w-12">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRegistrants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-slate-700 text-sm">
                          Tidak ada data pendaftar yang cocok
                        </p>
                        <p className="text-xs text-slate-400">
                          {searchQuery || statusFilter !== 'Semua'
                            ? 'Coba ubah kata kunci pencarian atau filter status dokumen.'
                            : 'Belum ada peserta yang mendaftar.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRegistrants.map((row) => {
                    const isTerlampir = row.dokumen === 'Terlampir';

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

                        {/* 2. Alamat */}
                        <td className="py-3.5 px-4 sm:px-6 align-top text-slate-600 leading-relaxed">
                          <span>{row.alamat}</span>
                        </td>

                        {/* 3. No Hp (Disensor demi pelindungan data pribadi) */}
                        <td className="py-3.5 px-4 sm:px-6 align-top">
                          <div className="inline-flex items-center gap-1.5 flex-wrap">
                            <a
                              href={`https://wa.me/${row.noHp.replace(/\D/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(`Halo ${row.namaLengkap}, terkait pendaftaran BPJS Ketenagakerjaan BPU...`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-mono font-semibold text-[#003366] hover:text-emerald-700 hover:underline"
                              title={
                                isRowPhoneMasked(row.id)
                                  ? 'Hubungi via WhatsApp (Klik ikon mata untuk lihat nomor)'
                                  : 'Hubungi via WhatsApp'
                              }
                            >
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span
                                className={
                                  isRowPhoneMasked(row.id)
                                    ? 'tracking-wider text-slate-700 font-medium bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200'
                                    : ''
                                }
                              >
                                {isRowPhoneMasked(row.id) ? maskPhoneNumber(row.noHp) : row.noHp}
                              </span>
                            </a>
                            <button
                              type="button"
                              onClick={() => toggleRowPhoneMask(row.id)}
                              className="p-1 text-slate-400 hover:text-[#003366] hover:bg-slate-100 rounded-md transition-colors cursor-pointer shrink-0"
                              title={
                                isRowPhoneMasked(row.id)
                                  ? 'Buka sensor nomor HP ini'
                                  : 'Sensor kembali nomor HP ini'
                              }
                              aria-label={
                                isRowPhoneMasked(row.id)
                                  ? 'Buka sensor nomor HP'
                                  : 'Sensor nomor HP'
                              }
                            >
                              {isRowPhoneMasked(row.id) ? (
                                <Eye className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5 text-emerald-600 hover:text-emerald-800" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* 4. Dokumen (Pilihan: Terlampir / Belum Terlampir) */}
                        <td className="py-3.5 px-4 sm:px-6 align-top">
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
                        </td>

                        {/* Quick Delete action button */}
                        <td className="py-3.5 px-3 sm:px-4 align-top text-center">
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(row.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus baris"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Nomor HP peserta <strong>disensor otomatis</strong> demi perlindungan data pribadi (PDP). Klik tombol mata untuk membuka sensor per peserta.
              </span>
            </div>
            <span>
              Kolom <strong>Dokumen</strong> dapat langsung diubah statusnya antara <strong>Terlampir</strong> dan <strong>Belum Terlampir</strong>.
            </span>
          </div>
        </div>
      </main>

      {/* Modal: Tambah Data Pendaftar Manual */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-5 bg-gradient-to-r from-[#003366] to-[#007b5e] text-white flex items-center justify-between">
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-300" />
                Catat Pendaftar Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
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
                  placeholder="Contoh: Rahmat Hidayat"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#003366]"
                />
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
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#003366] hover:bg-sky-900 text-white rounded-xl shadow-md transition-colors"
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
              Data pendaftar ini akan dihapus dari tabel admin. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
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
    </div>
  );
};
