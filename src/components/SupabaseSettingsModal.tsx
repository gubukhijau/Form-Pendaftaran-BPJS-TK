import React, { useState, useEffect } from 'react';
import { SupabaseConfig, AdminRegistrant } from '../types';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  syncAllLocalToSupabase,
  DEFAULT_TABLE_NAME
} from '../services/supabaseService';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  X,
  ExternalLink,
  ShieldCheck,
  Cloud,
  Code2,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  localRegistrants: AdminRegistrant[];
  onConfigSaved: () => void;
}

export const SupabaseSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  localRegistrants,
  onConfigSaved
}) => {
  const [config, setConfig] = useState<SupabaseConfig>(getSupabaseConfig());
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    rowCount?: number;
  } | null>(null);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getSupabaseConfig());
      setTestResult(null);
      setSyncResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentTableName = (config.tableName || DEFAULT_TABLE_NAME).trim();

  const sqlSchemaScript = `-- Jalankan query ini di SQL Editor dashboard Supabase Anda:
create table if not exists ${currentTableName} (
  id text primary key,
  nama_lengkap text not null,
  alamat text not null,
  no_hp text not null,
  dokumen text not null default 'Belum Terlampir',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Aktifkan Row Level Security (RLS)
alter table ${currentTableName} enable row level security;

-- Buat policy agar website bisa membaca dan menulis data pendaftar
create policy "Akses Publik Pendaftar BPJS" on ${currentTableName}
  for all using (true) with check (true);
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setSyncResult(null);
    try {
      const res = await testSupabaseConnection(config);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Gagal menguji koneksi.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    saveSupabaseConfig(config);
    onConfigSaved();
    onClose();
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncResult(null);
    // Ensure config is saved first
    saveSupabaseConfig(config);
    try {
      const res = await syncAllLocalToSupabase(localRegistrants);
      setSyncResult(res);
      if (res.success) {
        onConfigSaved();
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err?.message || 'Gagal sinkronisasi data.'
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-auto animate-scaleUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#003366] via-[#0b4870] to-[#007b5e] p-5 sm:p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-200 tracking-wider uppercase">
              Cloud Database Integration
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-300" />
            Pengaturan Database Supabase
          </h3>
          <p className="text-xs sm:text-sm text-slate-100/90 mt-1">
            Hubungkan database Supabase agar data pendaftar tersinkronisasi otomatis dan dapat diakses dari perangkat mana pun.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Status info bar */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-[#003366]" />
              <span className="font-semibold text-slate-700">Status Database:</span>
              {config.isEnabled && config.url && config.anonKey ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Supabase Aktif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Penyimpanan Lokal (Offline)
                </span>
              )}
            </div>

            {config.lastSyncedAt && (
              <span className="text-[11px] text-slate-400">
                Terakhir disinkronkan: {new Date(config.lastSyncedAt).toLocaleString('id-ID')}
              </span>
            )}
          </div>

          {/* Test & Sync Alerts */}
          {testResult && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <span className="font-bold block">
                  {testResult.success ? 'Koneksi Berhasil!' : 'Koneksi Gagal'}
                </span>
                <p className="leading-relaxed">{testResult.message}</p>
                {testResult.rowCount !== undefined && (
                  <p className="text-xs text-emerald-700 font-semibold mt-1">
                    Total data di Supabase saat ini: {testResult.rowCount} baris.
                  </p>
                )}
              </div>
            </div>
          )}

          {syncResult && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn ${
                syncResult.success
                  ? 'bg-sky-50 border-sky-200 text-sky-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              {syncResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <span className="font-bold block">Hasil Sinkronisasi Data</span>
                <p className="leading-relaxed">{syncResult.message}</p>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Toggle Enable */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-800 block">
                  Aktifkan Sinkronisasi Supabase
                </label>
                <span className="text-[11px] text-slate-500">
                  Gunakan Supabase sebagai sumber data utama di mana pun aplikasi dibuka
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.isEnabled}
                  onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:width-5 after:transition-all peer-checked:bg-[#007b5e]"></div>
              </label>
            </div>

            {/* Supabase URL */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Project URL Supabase <span className="text-red-500">*</span>
                </label>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-[#003366] hover:underline inline-flex items-center gap-1"
                >
                  <span>Buka Dashboard Supabase</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="url"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value.trim() })}
                placeholder="https://xyzabcdefghijklm.supabase.co"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#003366] focus:ring-1 focus:ring-[#003366]"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Dapat dilihat di menu <strong>Project Settings &rarr; API &rarr; Project URL</strong> di Supabase.
              </span>
            </div>

            {/* Supabase Anon Key */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                API Anon / Public Key <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={config.anonKey}
                  onChange={(e) => setConfig({ ...config, anonKey: e.target.value.trim() })}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#003366] focus:ring-1 focus:ring-[#003366]"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  title={showKey ? 'Sembunyikan' : 'Lihat'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Gunakan kunci <strong>anon / public</strong> (bukan service role) agar aman digunakan di browser.
              </span>
            </div>

            {/* Table Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Tabel di Supabase
              </label>
              <input
                type="text"
                value={config.tableName}
                onChange={(e) => setConfig({ ...config, tableName: e.target.value.trim() })}
                placeholder="pendaftar_bpjs_bpu"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#003366]"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Nama tabel database (default: <code>pendaftar_bpjs_bpu</code>).
              </span>
            </div>
          </div>

          {/* SQL Table Creation Helper */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSqlGuide(!showSqlGuide)}
              className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Code2 className="w-4 h-4 text-[#003366]" />
                <span>Lihat Panduan & Query SQL Pembuatan Tabel di Supabase</span>
              </div>
              <span className="text-xs text-[#003366] font-semibold">
                {showSqlGuide ? 'Sembunyikan' : 'Tampilkan'}
              </span>
            </button>

            {showSqlGuide && (
              <div className="p-4 bg-slate-900 text-slate-100 text-xs font-mono space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">
                    Jalankan skrip ini sekali di menu <strong>SQL Editor</strong> Supabase:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-sans text-emerald-300 border border-slate-700"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin SQL</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3 bg-slate-950 rounded-xl overflow-x-auto text-emerald-400 whitespace-pre-wrap leading-relaxed select-all">
                  {sqlSchemaScript}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !config.url || !config.anonKey}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {testing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#003366]" />
                  <span>Menguji...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-[#003366]" />
                  <span>Uji Koneksi</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSyncNow}
              disabled={syncing || !config.url || !config.anonKey}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 disabled:opacity-50 text-emerald-800 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Unggah data pendaftar lokal saat ini ke Supabase"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                  <span>Menyinkronkan...</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Sinkronkan Data Sekarang</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-[#003366] hover:bg-sky-900 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              Simpan Pengaturan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
