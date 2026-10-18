import React from 'react';
import { RegistrationFormData } from '../types';
import { FileText, HeartPulse, AlertCircle, ShieldCheck } from 'lucide-react';

interface Props {
  formData: RegistrationFormData;
  errors: Record<string, string>;
  onChange: <K extends keyof RegistrationFormData>(field: K, value: RegistrationFormData[K]) => void;
  onClearError: (field: string) => void;
}

export const StatementSection: React.FC<Props> = ({
  formData,
  errors,
  onChange,
  onClearError
}) => {
  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-100 text-[#003366] flex items-center justify-center font-bold text-sm">
            6
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Pernyataan Peserta & Kondisi Kesehatan
          </h2>
        </div>
        <span className="text-xs text-red-500 font-semibold">* Wajib disetujui</span>
      </div>

      {/* Kotak Pernyataan Kebenaran Data */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="flex items-start gap-2.5">
          <FileText className="w-5 h-5 text-[#003366] shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Pernyataan Kebenaran Data & Dokumen
            </h4>
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed italic shadow-2xs">
              &ldquo;Saya menyatakan bahwa data yang saya isi adalah benar. Saya memahami bahwa data dan dokumen yang saya berikan akan digunakan untuk keperluan pengajuan pendaftaran BPJS Ketenagakerjaan BPU. Saya bersedia melakukan konfirmasi apabila diperlukan.&rdquo;
            </div>

            <label className="flex items-start gap-3 cursor-pointer pt-1 group">
              <input
                type="checkbox"
                checked={formData.pernyataanData}
                onChange={(e) => {
                  onChange('pernyataanData', e.target.checked);
                  if (errors.pernyataanData) onClearError('pernyataanData');
                }}
                className="mt-0.5 w-4 h-4 text-[#003366] rounded border-slate-300 focus:ring-[#003366] cursor-pointer"
              />
              <span className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-[#003366] transition-colors">
                Saya telah membaca dan menyetujui pernyataan di atas. <span className="text-red-500">*</span>
              </span>
            </label>
            {errors.pernyataanData && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.pernyataanData}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Kotak Pernyataan Kesehatan */}
      <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
        <div className="flex items-start gap-2.5">
          <HeartPulse className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Keterangan Kesehatan & Keaktifan Bekerja
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sesuai dengan ketentuan kepesertaan BPJS Ketenagakerjaan Pekerja Bukan Penerima Upah (BPU), peserta harus dalam kondisi aktif bekerja saat mendaftar.
            </p>

            <label className="flex items-start gap-3 cursor-pointer pt-1 group">
              <input
                type="checkbox"
                checked={formData.pernyataanKesehatan}
                onChange={(e) => {
                  onChange('pernyataanKesehatan', e.target.checked);
                  if (errors.pernyataanKesehatan) onClearError('pernyataanKesehatan');
                }}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
                Saya menyatakan bahwa saat ini dalam kondisi sehat dan aktif bekerja. <span className="text-red-500">*</span>
              </span>
            </label>
            {errors.pernyataanKesehatan && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.pernyataanKesehatan}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
