import React from 'react';
import { PaymentPeriod, RegistrationFormData, PROGRAM_DATA, formatRupiah } from '../types';
import { Calculator, AlertCircle, CalendarClock, Check, Info } from 'lucide-react';

interface Props {
  formData: RegistrationFormData;
  errors: Record<string, string>;
  onChange: <K extends keyof RegistrationFormData>(field: K, value: RegistrationFormData[K]) => void;
  onClearError: (field: string) => void;
}

export const PaymentPeriodSelector: React.FC<Props> = ({
  formData,
  errors,
  onChange,
  onClearError
}) => {
  const periods: PaymentPeriod[] = [1, 2, 3, 6, 12];

  // Selected program rate, default to 16,800 if not yet chosen so user can see calculation preview
  const currentProgram = formData.program ? PROGRAM_DATA[formData.program] : null;
  const monthlyRate = currentProgram ? currentProgram.monthlyRate : 16800;

  const handleSelectPeriod = (p: PaymentPeriod) => {
    onChange('periodePembayaran', p);
    if (errors.periodePembayaran) onClearError('periodePembayaran');
  };

  const calculateTotal = (period: PaymentPeriod) => {
    return period * monthlyRate;
  };

  const selectedTotal = formData.periodePembayaran ? calculateTotal(formData.periodePembayaran) : 0;

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-100 text-[#003366] flex items-center justify-center font-bold text-sm">
            4
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Periode Pembayaran Iuran
          </h2>
        </div>
        <span className="text-xs text-red-500 font-semibold">* Wajib dipilih</span>
      </div>

      <p className="text-xs sm:text-sm text-slate-600">
        Pilih jangka waktu pembayaran iuran yang Anda kehendaki. Total dihitung otomatis berdasarkan program yang Anda pilih di atas:
      </p>

      {/* Grid of period options */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {periods.map((p) => {
          const isSelected = formData.periodePembayaran === p;
          const cost = calculateTotal(p);
          const periodLabel = p === 1 ? '1 Bulan' : `${p} Bulan`;

          return (
            <label
              key={p}
              onClick={() => handleSelectPeriod(p)}
              className={`relative flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#003366] bg-[#003366]/5 shadow-sm ring-1 ring-[#003366]'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700">
                  {periodLabel}
                </span>
                <input
                  type="radio"
                  name="periodePembayaran"
                  value={p}
                  checked={isSelected}
                  onChange={() => handleSelectPeriod(p)}
                  className="w-4 h-4 text-[#003366] border-slate-300 focus:ring-[#003366]"
                />
              </div>

              <div className="mt-1">
                <span className="text-sm font-extrabold text-[#003366] block">
                  {formatRupiah(cost)}
                </span>
                <span className="text-[10px] text-slate-500">
                  {p === 1 ? '1 x bulanan' : `${p} x ${formatRupiah(monthlyRate)}`}
                </span>
              </div>

              {p === 12 && (
                <div className="mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-center border border-emerald-200">
                  Bebas Repot 1 Thn
                </div>
              )}
            </label>
          );
        })}
      </div>

      {errors.periodePembayaran && (
        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {errors.periodePembayaran}
        </p>
      )}

      {/* Dynamic Summary Card of Program & Period */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-[#003366] text-white rounded-2xl shadow-md">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
          <Calculator className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold tracking-wider uppercase text-emerald-300">
            Kalkulator & Ringkasan Iuran
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-300 block mb-0.5">Program Dipilih:</span>
            <span className="font-bold text-sm text-white">
              {currentProgram ? currentProgram.title : 'Belum dipilih'}
            </span>
            <span className="text-[11px] text-slate-300 block">
              {currentProgram ? `Tarif ${formatRupiah(monthlyRate)} / bulan` : 'Pilih program di atas'}
            </span>
          </div>

          <div>
            <span className="text-slate-300 block mb-0.5">Periode Pembayaran:</span>
            <span className="font-bold text-sm text-white">
              {formData.periodePembayaran ? `${formData.periodePembayaran} Bulan` : 'Belum dipilih'}
            </span>
            <span className="text-[11px] text-slate-300 block">
              {formData.periodePembayaran ? `Dihitung untuk ${formData.periodePembayaran} bulan` : 'Pilih periode di atas'}
            </span>
          </div>

          <div className="sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
            <span className="text-slate-300 block mb-0.5">Estimasi Total Iuran:</span>
            <span className="font-extrabold text-xl sm:text-2xl text-emerald-400">
              {formData.periodePembayaran ? formatRupiah(selectedTotal) : 'Rp0'}
            </span>
            <span className="text-[10px] text-slate-300 block">
              *Tepat sesuai tarif resmi program
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
