import React, { useState, useEffect, useMemo } from 'react';
import { AdminRegistrant, maskPhoneNumber } from '../types';
import { getRegistrants } from '../services/registrantStorage';
import {
  Users,
  Search,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  EyeOff,
  Phone,
  MapPin,
  UserCheck,
  User,
  Sparkles,
  X
} from 'lucide-react';

interface Props {
  onBackToForm: () => void;
  onOpenAdmin: () => void;
}

export const ParticipantDirectoryPage: React.FC<Props> = ({
  onBackToForm,
  onOpenAdmin
}) => {
  const [registrants, setRegistrants] = useState<AdminRegistrant[]>([]);
  const [searchName, setSearchName] = useState('');
  const [filterDokumen, setFilterDokumen] = useState<'Semua' | 'Terlampir' | 'Belum Terlampir'>('Semua');

  useEffect(() => {
    setRegistrants(getRegistrants());
  }, []);

  const filteredRegistrants = useMemo(() => {
    return registrants.filter((p) => {
      // Fitur pencarian nama peserta
      const matchesName = p.namaLengkap.toLowerCase().includes(searchName.toLowerCase());
      const matchesDokumen =
        filterDokumen === 'Semua' ? true : p.dokumen === filterDokumen;
      return matchesName && matchesDokumen;
    });
  }, [registrants, searchName, filterDokumen]);

  const stats = useMemo(() => {
    const total = registrants.length;
    const terlampir = registrants.filter((r) => r.dokumen === 'Terlampir').length;
    const belumTerlampir = registrants.filter((r) => r.dokumen === 'Belum Terlampir').length;
    return { total, terlampir, belumTerlampir };
  }, [registrants]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Header Banner */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#003366] via-[#0b4870] to-[#007b5e] text-white pt-7 pb-12 px-4 sm:px-6 shadow-lg">
        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          {/* Top navigation row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <button
              type="button"
              onClick={onBackToForm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-semibold text-white transition-colors border border-white/20 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Formulir Pendaftaran</span>
            </button>

            <button
              type="button"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600/70 hover:bg-emerald-600 text-xs sm:text-sm font-semibold text-white transition-colors border border-emerald-400/30 cursor-pointer shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
              <span>Akses Admin</span>
            </button>
          </div>

          {/* Title & Description */}
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white shadow-xl flex items-center justify-center p-2 border-2 border-emerald-400/30">
              <div className="w-full h-full rounded-xl bg-gradient-to-tr from-[#003366] to-[#00a86b] flex items-center justify-center text-white">
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-300" />
              </div>
            </div>

            <div>
              <div className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-1">
                Transparansi Kepesertaan BPU
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                DAFTAR PESERTA BPJS KETENAGAKERJAAN
              </h1>
              <p className="text-slate-100/90 text-xs sm:text-sm leading-relaxed max-w-2xl mt-1">
                Data calon peserta yang telah diinput dan tercatat dalam sistem admin. Demi menjaga keamanan privasi calon peserta, bagian nomor telepon seluler disensor otomatis.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 -mt-6 pb-16 relative z-10 space-y-6">
        {/* Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Peserta Tercatat
              </span>
              <span className="text-2xl font-black text-slate-900 mt-0.5 block">
                {stats.total}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#003366] flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Dokumen Terlampir
              </span>
              <span className="text-2xl font-black text-emerald-700 mt-0.5 block">
                {stats.terlampir}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Dokumen Belum Terlampir
              </span>
              <span className="text-2xl font-black text-amber-600 mt-0.5 block">
                {stats.belumTerlampir}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
          {/* Fitur Pencarian Nama Peserta */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Cari nama peserta yang terdaftar..."
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-[#003366] focus:bg-white transition-all shadow-2xs"
            />
            {searchName && (
              <button
                type="button"
                onClick={() => setSearchName('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Status Dokumen */}
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0">
            {(['Semua', 'Terlampir', 'Belum Terlampir'] as const).map((filter) => {
              const isActive = filterDokumen === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setFilterDokumen(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#003366] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Directory Table Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Daftar Peserta Terdaftar</span>
                <span className="text-xs font-normal text-slate-500">
                  ({filteredRegistrants.length} data ditemukan)
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Data diperbarui secara otomatis dari input admin
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              <span>Privasi: No HP Disensor</span>
            </div>
          </div>

          {/* Desktop & Tablet Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[11px]">
                  <th scope="col" className="py-3.5 px-4 sm:px-6 w-1/4">
                    Nama Lengkap
                  </th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6 w-2/5">
                    Alamat
                  </th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6 w-1/5">
                    No Hp (Disensor)
                  </th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6 w-1/6">
                    Dokumen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRegistrants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-14 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="w-9 h-9 text-slate-300" />
                        <p className="font-bold text-slate-800 text-sm">
                          {searchName
                            ? `Tidak ada peserta bernama "${searchName}"`
                            : 'Belum ada data peserta yang terdaftar'}
                        </p>
                        <p className="text-xs text-slate-400 max-w-sm">
                          {searchName
                            ? 'Pastikan penulisan nama sudah benar atau coba gunakan sebagian nama.'
                            : 'Data peserta akan otomatis tampil setelah diinput oleh admin.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRegistrants.map((peserta) => {
                    const isTerlampir = peserta.dokumen === 'Terlampir';

                    return (
                      <tr
                        key={peserta.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        {/* Nama Lengkap */}
                        <td className="py-4 px-4 sm:px-6 align-top">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-sky-100 text-[#003366] flex items-center justify-center font-bold text-xs shrink-0">
                              {peserta.namaLengkap.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-900 leading-snug">
                              {peserta.namaLengkap}
                            </span>
                          </div>
                        </td>

                        {/* Alamat */}
                        <td className="py-4 px-4 sm:px-6 align-top text-slate-600 leading-relaxed">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span>{peserta.alamat}</span>
                          </div>
                        </td>

                        {/* No HP (Disensor) */}
                        <td className="py-4 px-4 sm:px-6 align-top whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 font-mono text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span className="tracking-wider font-semibold">
                              {maskPhoneNumber(peserta.noHp)}
                            </span>
                          </div>
                        </td>

                        {/* Status Dokumen */}
                        <td className="py-4 px-4 sm:px-6 align-top whitespace-nowrap">
                          {isTerlampir ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Terlampir</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Belum Terlampir</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
            <span>
              Keterangan Status Dokumen: <strong>Terlampir</strong> menandakan foto KTP dan KK telah diterima dan diverifikasi oleh admin.
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 px-4 border-t border-slate-800 text-center space-y-1 mt-auto">
        <p className="text-slate-300 font-semibold">
          Direktori Peserta Terdaftar BPJS Ketenagakerjaan BPU
        </p>
        <p className="text-slate-500 text-[10px]">
          &copy; {new Date().getFullYear()} BPJS Ketenagakerjaan BPU. Privasi Nomor Kontak Dilindungi.
        </p>
      </footer>
    </div>
  );
};
