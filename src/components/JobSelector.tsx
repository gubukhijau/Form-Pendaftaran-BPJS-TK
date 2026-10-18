import React from 'react';
import { JobType, RegistrationFormData } from '../types';
import { Store, Hammer, Briefcase, AlertCircle } from 'lucide-react';

interface Props {
  formData: RegistrationFormData;
  errors: Record<string, string>;
  onChange: <K extends keyof RegistrationFormData>(field: K, value: RegistrationFormData[K]) => void;
  onClearError: (field: string) => void;
}

export const JobSelector: React.FC<Props> = ({
  formData,
  errors,
  onChange,
  onClearError
}) => {
  const jobs: { type: JobType; label: string; desc: string; icon: React.FC<{ className?: string }> }[] = [
    {
      type: 'Pedagang',
      label: 'Pedagang',
      desc: 'Toko kelontong, pedagang pasar, kuliner, online shop, kaki lima',
      icon: Store
    },
    {
      type: 'Tukang',
      label: 'Tukang',
      desc: 'Tukang bangunan, kayu, las, service elektronik, jahit, dll.',
      icon: Hammer
    },
    {
      type: 'Lain-lain',
      label: 'Lain-lain',
      desc: 'Ojol/Driver, petani, nelayan, buruh harian lepas, freelance, dll.',
      icon: Briefcase
    }
  ];

  const handleSelectJob = (type: JobType) => {
    onChange('pekerjaan', type);
    if (errors.pekerjaan) onClearError('pekerjaan');
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-100 text-[#003366] flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Pekerjaan Calon Peserta
          </h2>
        </div>
        <span className="text-xs text-red-500 font-semibold">* Wajib dipilih</span>
      </div>

      <p className="text-xs sm:text-sm text-slate-600">
        Pilih kategori profesi atau aktivitas usaha yang sedang Anda jalankan saat ini:
      </p>

      {/* Radio options as interactive cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {jobs.map((item) => {
          const isSelected = formData.pekerjaan === item.type;
          const Icon = item.icon;

          return (
            <label
              key={item.type}
              onClick={() => handleSelectJob(item.type)}
              className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#003366] bg-sky-50/70 shadow-sm ring-1 ring-[#003366]'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-[#003366] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <input
                  type="radio"
                  name="pekerjaan"
                  value={item.type}
                  checked={isSelected}
                  onChange={() => handleSelectJob(item.type)}
                  className="w-4 h-4 text-[#003366] border-slate-300 focus:ring-[#003366]"
                />
              </div>

              <span className="font-bold text-sm sm:text-base text-slate-800 mb-1">
                {item.label}
              </span>
              <span className="text-xs text-slate-500 leading-relaxed">
                {item.desc}
              </span>
            </label>
          );
        })}
      </div>

      {errors.pekerjaan && (
        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {errors.pekerjaan}
        </p>
      )}

      {/* Conditional Input: Tukang */}
      {formData.pekerjaan === 'Tukang' && (
        <div className="mt-3 p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2 animate-fadeIn">
          <label className="block text-xs sm:text-sm font-semibold text-slate-800">
            Jenis Pekerjaan Tukang <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.detailPekerjaanTukang}
            onChange={(e) => {
              onChange('detailPekerjaanTukang', e.target.value);
              if (errors.detailPekerjaanTukang) onClearError('detailPekerjaanTukang');
            }}
            placeholder="Contoh: Tukang Bangunan / Tukang Kayu / Tukang Las / Tukang Listrik"
            className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg shadow-xs focus:outline-none ${
              errors.detailPekerjaanTukang
                ? 'border-red-400 ring-2 ring-red-100 focus:border-red-500'
                : 'border-slate-300 focus:border-[#003366] focus:ring-1 focus:ring-[#003366]'
            }`}
          />
          {errors.detailPekerjaanTukang ? (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.detailPekerjaanTukang}
            </p>
          ) : (
            <p className="text-[11px] text-slate-500">
              Sebutkan bidang keahlian tukang yang Anda kerjakan.
            </p>
          )}
        </div>
      )}

      {/* Conditional Input: Lain-lain */}
      {formData.pekerjaan === 'Lain-lain' && (
        <div className="mt-3 p-4 bg-sky-50/70 border border-sky-200/80 rounded-xl space-y-2 animate-fadeIn">
          <label className="block text-xs sm:text-sm font-semibold text-slate-800">
            Sebutkan Pekerjaan Anda <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.detailPekerjaanLain}
            onChange={(e) => {
              onChange('detailPekerjaanLain', e.target.value);
              if (errors.detailPekerjaanLain) onClearError('detailPekerjaanLain');
            }}
            placeholder="Contoh: Pengemudi Ojek Online, Petani Padi, Nelayan, Penjahit Rumahan"
            className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg shadow-xs focus:outline-none ${
              errors.detailPekerjaanLain
                ? 'border-red-400 ring-2 ring-red-100 focus:border-red-500'
                : 'border-slate-300 focus:border-[#003366] focus:ring-1 focus:ring-[#003366]'
            }`}
          />
          {errors.detailPekerjaanLain ? (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.detailPekerjaanLain}
            </p>
          ) : (
            <p className="text-[11px] text-slate-500">
              Tuliskan nama pekerjaan atau profesi mandiri Anda dengan jelas.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
