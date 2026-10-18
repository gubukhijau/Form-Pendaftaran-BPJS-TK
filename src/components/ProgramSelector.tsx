import React from 'react';
import { ProgramType, RegistrationFormData, PROGRAM_DATA, formatRupiah } from '../types';
import { Shield, ShieldAlert, CheckCircle2, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';

interface Props {
  formData: RegistrationFormData;
  errors: Record<string, string>;
  onChange: <K extends keyof RegistrationFormData>(field: K, value: RegistrationFormData[K]) => void;
  onClearError: (field: string) => void;
}

export const ProgramSelector: React.FC<Props> = ({
  formData,
  errors,
  onChange,
  onClearError
}) => {
  const handleSelectProgram = (program: ProgramType) => {
    onChange('program', program);
    if (errors.program) onClearError('program');
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-100 text-[#003366] flex items-center justify-center font-bold text-sm">
            3
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Pilihan Program BPJS Ketenagakerjaan
          </h2>
        </div>
        <span className="text-xs text-red-500 font-semibold">* Wajib dipilih</span>
      </div>

      <p className="text-xs sm:text-sm text-slate-600">
        Pilih skema jaminan sosial yang ingin Anda ikuti sesuai kebutuhan proteksi dan masa depan Anda:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pilihan A: JKK dan JKM */}
        {(() => {
          const prog = PROGRAM_DATA.JKK_JKM;
          const isSelected = formData.program === 'JKK_JKM';
          return (
            <div
              onClick={() => handleSelectProgram('JKK_JKM')}
              className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {/* Top Row with Radio and Badge */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="program"
                    value="JKK_JKM"
                    checked={isSelected}
                    onChange={() => handleSelectProgram('JKK_JKM')}
                    className="w-5 h-5 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
                      Pilihan A
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                      {prog.title}
                    </h3>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {prog.badge}
                </span>
              </div>

              {/* Price display - clear in bottom of choice */}
              <div className="my-2 p-3 bg-white/90 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-xs text-slate-500 block">Iuran bulanan:</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-emerald-700">
                    {formatRupiah(prog.monthlyRate)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ bulan</span>
                </div>
              </div>

              {/* Description & Benefits */}
              <p className="text-xs text-slate-600 mb-3 font-medium">
                {prog.description}
              </p>

              <ul className="space-y-1.5 text-xs text-slate-600 mt-auto pt-2 border-t border-slate-100">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Jaminan Kecelakaan Kerja (Biaya pengobatan unlimited)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Jaminan Kematian (Santunan hingga Rp42 Juta)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Beasiswa untuk 2 orang anak bagi peserta yang memenuhi syarat</span>
                </li>
              </ul>
            </div>
          );
        })()}

        {/* Pilihan B: JKK, JKM, dan JHT */}
        {(() => {
          const prog = PROGRAM_DATA.JKK_JKM_JHT;
          const isSelected = formData.program === 'JKK_JKM_JHT';
          return (
            <div
              onClick={() => handleSelectProgram('JKK_JKM_JHT')}
              className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#003366] bg-sky-50/50 shadow-md ring-2 ring-[#003366]/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {/* Top Row with Radio and Badge */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="program"
                    value="JKK_JKM_JHT"
                    checked={isSelected}
                    onChange={() => handleSelectProgram('JKK_JKM_JHT')}
                    className="w-5 h-5 text-[#003366] border-slate-300 focus:ring-[#003366]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-[#003366] uppercase tracking-wider block">
                      Pilihan B
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                      {prog.title}
                    </h3>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-100 text-[#003366] border border-sky-300">
                  {prog.badge}
                </span>
              </div>

              {/* Price display - clear in bottom of choice */}
              <div className="my-2 p-3 bg-white/90 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-xs text-slate-500 block">Iuran bulanan:</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-[#003366]">
                    {formatRupiah(prog.monthlyRate)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ bulan</span>
                </div>
              </div>

              {/* Description & Benefits */}
              <p className="text-xs text-slate-600 mb-3 font-medium">
                {prog.description}
              </p>

              <ul className="space-y-1.5 text-xs text-slate-600 mt-auto pt-2 border-t border-slate-100">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#003366] mt-0.5 shrink-0" />
                  <span>Seluruh manfaat JKK dan JKM</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <span>Jaminan Hari Tua (Tabungan + Hasil Pengembangan dana)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#003366] mt-0.5 shrink-0" />
                  <span>Dana tabungan dapat dicairkan 100% saat tidak aktif bekerja</span>
                </li>
              </ul>
            </div>
          );
        })()}
      </div>

      {errors.program && (
        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {errors.program}
        </p>
      )}

      {/* Mandatory note according to specification */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-500 text-xs leading-relaxed">
        <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold text-slate-700">Catatan:</span> Nominal iuran pada halaman ini mengikuti data formulir referensi dan perlu dikonfirmasi kembali sebelum digunakan sebagai informasi resmi.
        </p>
      </div>
    </div>
  );
};
