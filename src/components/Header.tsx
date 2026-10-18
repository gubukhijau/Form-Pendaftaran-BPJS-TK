import React from 'react';
import { ShieldCheck, UserCheck, MessageSquare, Clock, PhoneCall } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-[#003366] via-[#0b4870] to-[#007b5e] text-white pt-8 pb-14 px-4 sm:px-6 shadow-lg">
      {/* Decorative background grid and blurs */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto">
        {/* Top bar with official badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-medium text-emerald-200 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Pendaftaran Peserta Mandiri (BPU)</span>
          </div>

          <a
            href="https://wa.me/6285743678786"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-white/90 bg-emerald-600/70 hover:bg-emerald-600 transition-colors px-3 py-1.5 rounded-full border border-emerald-400/30 font-medium"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-200" />
            <span>WA Petugas: 0857-4367-8786</span>
          </a>
        </div>

        {/* Main Brand Title & Emblem */}
        <div className="flex items-start gap-4 sm:gap-5 mb-5">
          <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center p-2 border-2 border-emerald-400/30">
            <div className="w-full h-full rounded-xl bg-gradient-to-tr from-[#003366] to-[#00a86b] flex items-center justify-center text-white shadow-inner">
              <ShieldCheck className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-300" />
            </div>
          </div>

          <div>
            <div className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-1">
              PEKERJA BUKAN PENERIMA UPAH (BPU)
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              FORMULIR PENDAFTARAN BPJS KETENAGAKERJAAN
            </h1>
          </div>
        </div>

        {/* Description */}
        <p className="text-slate-100/90 text-sm sm:text-base leading-relaxed max-w-2xl mb-6">
          Lengkapi data diri Anda dengan benar untuk pengajuan pendaftaran peserta BPJS Ketenagakerjaan BPU.
          Setelah formulir selesai, data otomatis terangkai dan terkirim ke WhatsApp petugas resmi kami.
        </p>

        {/* Highlight feature pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-100">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">
            <UserCheck className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Tanpa Login / Akun Rumit</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">
            <Clock className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Proses Cepat & Praktis</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">
            <MessageSquare className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Langsung Terhubung WhatsApp</span>
          </div>
        </div>
      </div>
    </header>
  );
};
