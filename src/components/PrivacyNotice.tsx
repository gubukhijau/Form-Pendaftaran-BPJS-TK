import React from 'react';
import { Shield, Lock, EyeOff, ServerOff, HelpCircle } from 'lucide-react';

export const PrivacyNotice: React.FC = () => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
        <Shield className="w-5 h-5 text-[#003366]" />
        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
          Kebijakan Privasi & Keamanan Data Calon Peserta
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kerahasiaan Terjaga</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            Data NIK dan nomor kontak Anda hanya digunakan untuk keperluan verifikasi pengajuan BPJS Ketenagakerjaan BPU.
          </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <ServerOff className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tanpa Penyimpanan Publik</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            Sistem tidak menyimpan NIK atau dokumen Anda ke penyimpanan publik atau cache browser permanen.
          </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <EyeOff className="w-3.5 h-3.5 text-emerald-600" />
            <span>Enkripsi WhatsApp</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            Pengiriman langsung diteruskan ke WhatsApp petugas dengan enkripsi end-to-end resmi WhatsApp.
          </p>
        </div>
      </div>

      {/* Official Disclaimer */}
      <div className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
        <span className="font-bold text-slate-700">Pemberitahuan Transparansi Layanan: </span>
        Website formulir ini disediakan sebagai fasilitas bantuan pendaftaran mandiri calon peserta Bukan Penerima Upah (BPU) yang dihubungkan langsung ke nomor layanan WhatsApp petugas pendaftaran resmi (0857-4367-8786). Website ini bukan portal tunggal resmi bpjsketenagakerjaan.go.id, melainkan sarana bantu pengumpulan dan penyerahan data untuk mempermudah masyarakat pekerja mandiri mendapatkan perlindungan jaminan sosial ketenagakerjaan.
      </div>
    </div>
  );
};
