import React, { useRef } from 'react';
import { RegistrationFormData, parseDDMMYYYY, formatDateToDDMMYYYY } from '../types';
import { User, CreditCard, Home, MapPin, Calendar, Phone, Mail, AlertCircle, CheckCircle2, Heart } from 'lucide-react';

interface Props {
  formData: RegistrationFormData;
  errors: Record<string, string>;
  onChange: <K extends keyof RegistrationFormData>(field: K, value: RegistrationFormData[K]) => void;
  onClearError: (field: string) => void;
}

export const PersonalDataFields: React.FC<Props> = ({
  formData,
  errors,
  onChange,
  onClearError
}) => {
  const hiddenDateInputRef = React.useRef<HTMLInputElement>(null);

  const handleNikChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and max 16 digits
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 16);
    onChange('nik', digitsOnly);
    if (errors.nik) onClearError('nik');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clean characters for phone number
    const cleaned = e.target.value.replace(/[^\d+]/g, '');
    onChange('nomorHp', cleaned);
    if (errors.nomorHp) onClearError('nomorHp');
  };

  // Handle dd/mm/yyyy formatted text input with automatic slashes
  const handleDateTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/[^\d/]/g, '');
    
    // Auto-insert slash after day and month if user is just typing numbers
    const digitsOnly = input.replace(/\D/g, '').slice(0, 8);
    if (digitsOnly.length > 4) {
      input = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4)}`;
    } else if (digitsOnly.length > 2) {
      input = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
    } else {
      input = digitsOnly;
    }

    onChange('tanggalLahir', input);
    if (errors.tanggalLahir) onClearError('tanggalLahir');
  };

  // Handle calendar picker selection (returns YYYY-MM-DD -> convert to DD/MM/YYYY)
  const handleNativeDatePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const formatted = formatDateToDDMMYYYY(e.target.value);
      onChange('tanggalLahir', formatted);
      if (errors.tanggalLahir) onClearError('tanggalLahir');
    }
  };

  // Calculate age helper if tanggalLahir is filled
  const getAgeText = (dateString: string) => {
    if (!dateString) return null;
    const birthDate = parseDDMMYYYY(dateString);
    if (!birthDate || isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 0 || age > 120) return null;
    return `Usia: ${age} tahun`;
  };

  const ageText = getAgeText(formData.tanggalLahir);

  return (
    <div className="space-y-5">
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-100 text-[#003366] flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Data Diri Calon Peserta
          </h2>
        </div>
        <span className="text-xs text-slate-500">
          <span className="text-red-500 font-semibold">*</span> Kolom wajib diisi
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Nama Lengkap */}
        <div className="md:col-span-2">
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
            Nama Lengkap <span className="text-red-500">*</span>
            <span className="text-xs font-normal text-slate-500 ml-1">(Sesuai KTP)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={formData.namaLengkap}
              onChange={(e) => {
                onChange('namaLengkap', e.target.value);
                if (errors.namaLengkap) onClearError('namaLengkap');
              }}
              placeholder="Contoh: Budi Santoso"
              className={`w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm bg-white border rounded-xl shadow-xs transition-all focus:outline-none ${
                errors.namaLengkap
                  ? 'border-red-400 ring-2 ring-red-100 focus:border-red-500'
                  : 'border-slate-300 focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10'
              }`}
            />
          </div>
          {errors.namaLengkap && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.namaLengkap}
            </p>
          )}
        </div>

        {/* NIK */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs sm:text-sm font-semibold text-slate-700">
              Nomor KTP / NIK (16 Digit) <span className="text-red-500">*</span>
            </label>
            <span
              className={`text-xs font-mono font-medium ${
                formData.nik.length === 16 ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              {formData.nik.length}/16 digit
            </span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={16}
              value={formData.nik}
              onChange={handleNikChange}
              placeholder="16 digit angka NIK KTP Anda"
              className={`w-full pl-10 pr-10 py-2.5 sm:py-3 text-sm font-mono tracking-wider bg-white border rounded-xl shadow-xs transition-all focus:outline-none ${
                errors.nik
                  ? 'border-red-400 ring-2 ring-red-100 focus:border-red-500'
                  : formData.nik.length === 16
                  ? 'border-emerald-400 ring-1 ring-emerald-200'
                  : 'border-slate-300 focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10'
              }`}
            />
            {formData.nik.length === 16 && (
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-emerald-500">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
          </div>
          {errors.nik ? (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.nik}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-slate-500">
              Pastikan NIK terdiri dari tepat 16 digit angka sesuai yang tertera pada e-KTP.
            </p>
          )}
        </div>

        {/* Tempat Lahir */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
            Tempat Lahir <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={formData.tempatLahir}
              onChange={(e) => {
                onChange('tempatLahir', e.target.value);
                if (errors.tempatLahir) onClearError('tempatLahir');
              }}
              placeholder="Contoh: Surabaya"
              className={`w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm bg-white border rounded-xl shadow-xs transition-all focus:outline-none ${
                errors.tempatLahir
                  ? 'border-red-400 ring-2 ring-red-100 focus:border-red-500'
                  : 'border-slate-300 focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10'
              }`}
            />
          </div>
          {errors.tempatLahir && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.tempatLahir}
            </p>
          )}
        </div>

        {/* Tanggal Lahir */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs sm:text-sm font-semibold text-slate-700">
              Tanggal Lahir (dd/mm/yyyy) <span className="text-red-500">*</span>
            </label>
            {ageText && (
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {ageText}
              </span>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="dd/mm/yyyy (Contoh: 17/08/1990)"
              value={formData.tanggalLahir}
              onChange={handleDateTextChange}
              className={`w-full pl-10 pr-11 py-2.5 sm:py-3 text-sm font-mono tracking-wider bg-white border rounded-xl shadow-xs transition-all focus:outline-none ${
                errors.tanggalLahir
                  ? 'border-red-400 ring-2 ring-red-100 focus:border-red-500'
                  : 'border-slate-300 focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10'
              }`}
            />
            {/* Native calendar picker trigger button */}
            <button
              type="button"
              onClick={() => {
                if (hiddenDateInputRef.current) {
                  if (typeof (hiddenDateInputRef.current as any).showPicker === 'function') {
                    (hiddenDateInputRef.current as any).showPicker();
                  } else {
                    hiddenDateInputRef.current.click();
                  }
                }
              }}
              title="Pilih dari Kalender"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#003366] transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
            </button>
            {/* Hidden native date input for calendar UI */}
            <input
              ref={hiddenDateInputRef}
              type="date"
              max={new Date().toISOString().split('T')[0]}
              className="sr-only"
              tabIndex={-1}
              onChange={handleNativeDatePicked}
            />
          </div>
          {errors.tanggalLahir ? (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.tanggalLahir}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-slate-500">
              Ketik dengan format <span className="font-semibold text-slate-700">dd/mm/yyyy</span> atau klik ikon kalender.
            </p>
          )}
        </div>

        {/* Nama Ibu Kandung */}
        <div className="md:col-span-2">
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
            Nama Ibu Kandung <span className="text-red-500">*</span>
            <span className="text-xs font-normal text-slate-500 ml-1">(Sesuai Kartu Keluarga untuk verifikasi kepesertaan)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Heart className="w-4 h-4 text-pink-500" />
            </div>
            <input
              type="text"
              value={formData.namaIbuKandung}
              onChange={(e) => {
                onChange('namaIbuKandung', e.target.value);
                if (errors.namaIbuKandung) onClearError('namaIbuKandung');
              }}
              placeholder="Contoh: Kartini"
              className={`w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm bg-white border rounded-xl shadow-xs transition-all focus:outline-none ${
                errors.namaIbuKandung
                  ? 'border-red-400 ring-2 ring-red-100 focus:border-red-500'
                  : 'border-slate-300 focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10'
              }`}
            />
          </div>
          {errors.namaIbuKandung && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.namaIbuKandung}
            </p>
          )}
        </div>

        {/* Alamat Rumah */}
        <div className="md:col-span-2">
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
            Alamat Rumah Lengkap <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
              <Home className="w-4 h-4" />
            </div>
            <textarea
              rows={3}
              value={formData.alamatRumah}
              onChange={(e) => {
                onChange('alamatRumah', e.target.value);
                if (errors.alamatRumah) onClearError('alamatRumah');
              }}
              placeholder="Jalan, RT/RW, Kelurahan/Desa, Kecamatan, Kota/Kabupaten, Provinsi"
              className={`w-full pl-10 pr-4 py-2.5 text-sm bg-white border rounded-xl shadow-xs transition-all focus:outline-none resize-none ${
                errors.alamatRumah
                  ? 'border-red-400 ring-2 ring-red-100 focus:border-red-500'
                  : 'border-slate-300 focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10'
              }`}
            />
          </div>
          {errors.alamatRumah && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.alamatRumah}
            </p>
          )}
        </div>

        {/* Nomor HP Aktif */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
            Nomor HP / WhatsApp Aktif <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="tel"
              value={formData.nomorHp}
              onChange={handlePhoneChange}
              placeholder="Contoh: 081234567890"
              className={`w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm bg-white border rounded-xl shadow-xs transition-all focus:outline-none ${
                errors.nomorHp
                  ? 'border-red-400 ring-2 ring-red-100 focus:border-red-500'
                  : 'border-slate-300 focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10'
              }`}
            />
          </div>
          {errors.nomorHp ? (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.nomorHp}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-slate-500">
              Pastikan nomor terhubung dengan WhatsApp untuk konfirmasi aktivasi kartu.
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs sm:text-sm font-semibold text-slate-700">
              Alamat Email
            </label>
            <span className="text-xs text-slate-400 font-normal">Opsional</span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                onChange('email', e.target.value);
                if (errors.email) onClearError('email');
              }}
              placeholder="Contoh: nama@gmail.com"
              className={`w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm bg-white border rounded-xl shadow-xs transition-all focus:outline-none ${
                errors.email
                  ? 'border-red-400 ring-2 ring-red-100 focus:border-red-500'
                  : 'border-slate-300 focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10'
              }`}
            />
          </div>
          {errors.email ? (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.email}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-slate-500">
              Kartu digital (e-card) & bukti kepesertaan dapat dikirimkan ke email Anda jika diisi.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
