import React, { useState, useEffect, useMemo } from 'react';
import { AdminRegistrant, DocumentStatus } from '../types';
import {
  getRegistrants,
  updateRegistrantDocumentStatus,
  deleteRegistrant,
  saveRegistrant,
  fetchAndSyncRegistrants
} from '../services/registrantStorage';
import { getSupabaseConfig } from '../services/supabaseService';
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
  Loader2
} from 'lucide-react';

interface Props {
  onBackToForm: () => void;
  onOpenParticipants?: () => void;
}

const ADMIN_SECRET_KEY = 'SAPALEWA';

export const AdminPage: React.FC<Props> = ({ onBackToForm, onOpenParticipants }) => {
  // Authentication lock state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('bpjs_admin_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const [inputKey, setInputKey] = useState('');
  const [authError, setAuthError] = useState('');
  const [showKeyText, setShowKeyText] = useState(false);

  const [registrants, setRegistrants] = useState<AdminRegistrant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | DocumentStatus>('Semua');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseConfig());
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New manual entry form state
  const [newNama, setNewNama] = useState('');
  const [newAlamat, setNewAlamat] = useState('');
  const [newNoHp, setNewNoHp] = useState('');
  const [newDokumen, setNewDokumen] = useState<DocumentStatus>('Belum Terlampir');
  const [formError, setFormError] = useState('');
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

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim().toUpperCase() === ADMIN_SECRET_KEY) {
      setIsAuthenticated(true);
      setAuthError('');
      try {
        sessionStorage.setItem('bpjs_admin_unlocked', 'true');
      } catch {
        // Ignore storage error
      }
    } else {
      setAuthError('Kunci akses salah! Pastikan Anda memasukkan kunci yang benar.');
    }
  };

  const handleLockAdmin = () => {
    setIsAuthenticated(false);
    setInputKey('');
    setAuthError('');
    try {
      sessionStorage.removeItem('bpjs_admin_unlocked');
    } catch {
      // Ignore storage error
    }
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
      `"${r.noHp}"`,
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

  // Locked View (Require Security Key "SAPALEWA")
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
          {/* Top Header */}
          <div className="bg-gradient-to-r from-[#003366] via-[#0b4870] to-[#007b5e] p-6 text-white text-center relative">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">Halaman Admin Terkunci</h2>
            <p className="text-xs text-emerald-100 mt-1">
              Khusus pengelola data pendaftaran BPJS Ketenagakerjaan BPU
            </p>
          </div>

          {/* Form Body */}
          <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
            <p className="text-xs sm:text-sm text-slate-600 text-center leading-relaxed">
              Halaman ini dilindungi kunci keamanan. Masukkan kunci akses untuk membuka data catatan pendaftar.
            </p>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kunci Keamanan Akses
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showKeyText ? 'text' : 'password'}
                  autoFocus
                  value={inputKey}
                  onChange={(e) => {
                    setInputKey(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  placeholder="Masukkan kunci keamanan..."
                  className="w-full pl-10 pr-10 py-3 text-sm font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-[#003366] focus:bg-white transition-all uppercase"
                />
                <button
                  type="button"
                  onClick={() => setShowKeyText(!showKeyText)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showKeyText ? 'Sembunyikan Kunci' : 'Tampilkan Kunci'}
                >
                  {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Masukkan kunci akses resmi untuk melanjutkan.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                className="w-full py-3 bg-[#003366] hover:bg-[#002244] active:scale-[0.99] text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Buka Akses Admin</span>
              </button>

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
              <button
                type="button"
                onClick={onBackToForm}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-semibold text-white transition-colors"
                title="Kembali ke Formulir Pendaftaran"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Formulir</span>
              </button>

              {onOpenParticipants && (
                <button
                  type="button"
                  onClick={onOpenParticipants}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-semibold text-white transition-colors"
                  title="Lihat Halaman Data Peserta Publik"
                >
                  <UserCheck className="w-4 h-4 text-emerald-300" />
                  <span className="hidden sm:inline">Data Peserta</span>
                </button>
              )}

              <div className="h-6 w-px bg-white/20 hidden sm:block" />

              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-300" />
                  Halaman Admin — Pencatatan Pendaftar
                </h1>
                <p className="text-xs text-emerald-100 hidden sm:block">
                  Kelola dan catat calon peserta BPJS Ketenagakerjaan BPU
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all border border-emerald-300/40 cursor-pointer"
                title="Pengaturan Koneksi Supabase Database"
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
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-500/20 hover:bg-red-500/35 text-red-200 hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors border border-red-400/30 ml-1 cursor-pointer"
                title="Kunci Akses Admin Kembali"
              >
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">Kunci Akses</span>
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
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Tabel Catatan Pendaftar
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Menampilkan {filteredRegistrants.length} dari total {registrants.length} pendaftar
              </p>
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
                  <th scope="col" className="py-3.5 px-4 sm:px-6 w-1/6">
                    No Hp
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

                        {/* 3. No Hp */}
                        <td className="py-3.5 px-4 sm:px-6 align-top">
                          <a
                            href={`https://wa.me/${row.noHp.replace(/\D/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(`Halo ${row.namaLengkap}, terkait pendaftaran BPJS Ketenagakerjaan BPU...`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono font-semibold text-[#003366] hover:text-emerald-700 hover:underline"
                            title="Hubungi via WhatsApp"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{row.noHp}</span>
                          </a>
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

          <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
            <span>
              Keterangan: Kolom <strong>Dokumen</strong> dapat langsung diubah statusnya antara <strong>Terlampir</strong> dan <strong>Belum Terlampir</strong> sesuai verifikasi berkas di WhatsApp.
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
