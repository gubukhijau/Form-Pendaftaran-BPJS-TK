import React from 'react';
import { RegistrationFormData, PROGRAM_DATA, formatRupiah, maskNik, formatDateToDDMMYYYY } from '../types';
import {
  ClipboardList,
  Edit3,
  User,
  CreditCard,
  Phone,
  Briefcase,
  ShieldCheck,
  CalendarClock,
  Calendar,
  Coins,
  Camera,
  MessageCircle,
  Heart
} from 'lucide-react';

interface Props {
  formData: RegistrationFormData;
  onEditSection: (sectionId?: string) => void;
}

export const RegistrationSummary: React.FC<Props> = ({
  formData,
  onEditSection
}) => {
  const currentProgram = formData.program ? PROGRAM_DATA[formData.program] : null;
  const monthlyRate = currentProgram ? currentProgram.monthlyRate : 0;
  const totalIuran = formData.periodePembayaran && monthlyRate ? formData.periodePembayaran * monthlyRate : 0;

  // Formatted job title
  const getJobDisplay = () => {
    if (!formData.pekerjaan) return 'Belum dipilih';
    if (formData.pekerjaan === 'Tukang') {
      return formData.detailPekerjaanTukang
        ? `Tukang (${formData.detailPekerjaanTukang})`
        : 'Tukang';
    }
    if (formData.pekerjaan === 'Lain-lain') {
      return formData.detailPekerjaanLain
        ? `Lain-lain (${formData.detailPekerjaanLain})`
        : 'Lain-lain';
    }
    return formData.pekerjaan;
  };

  return (
    <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-[#003366]" />
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            Ringkasan Data Pendaftaran Sebelum Dikirim
          </h3>
        </div>

        <button
          type="button"
          onClick={() => onEditSection('personal-data')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003366] hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg border border-sky-200 transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
        {/* Nama Lengkap */}
        <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
          <span className="text-slate-400 text-xs block mb-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5" /> Nama Lengkap
          </span>
          <span className="font-bold text-slate-800 text-sm">
            {formData.namaLengkap || <em className="text-slate-400 font-normal">Belum diisi</em>}
          </span>
        </div>

        {/* NIK Disamarkan */}
        <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
          <span className="text-slate-400 text-xs block mb-1 flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5" /> Nomor KTP / NIK (Disamarkan)
          </span>
          <span className="font-mono font-bold text-slate-800 text-sm tracking-wide">
            {formData.nik ? maskNik(formData.nik) : <em className="text-slate-400 font-normal">Belum diisi</em>}
          </span>
        </div>

        {/* Tempat & Tanggal Lahir */}
        <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
          <span className="text-slate-400 text-xs block mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Tempat, Tanggal Lahir
          </span>
          <span className="font-bold text-slate-800 text-sm">
            {formData.tempatLahir ? `${formData.tempatLahir}, ` : ''}
            {formData.tanggalLahir ? formatDateToDDMMYYYY(formData.tanggalLahir) : <em className="text-slate-400 font-normal">Belum diisi</em>}
          </span>
        </div>

        {/* Nama Ibu Kandung */}
        <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
          <span className="text-slate-400 text-xs block mb-1 flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-pink-500" /> Nama Ibu Kandung
          </span>
          <span className="font-bold text-slate-800 text-sm">
            {formData.namaIbuKandung || <em className="text-slate-400 font-normal">Belum diisi</em>}
          </span>
        </div>

        {/* Nomor HP */}
        <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
          <span className="text-slate-400 text-xs block mb-1 flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" /> Nomor HP / WhatsApp
          </span>
          <span className="font-bold text-slate-800">
            {formData.nomorHp || <em className="text-slate-400 font-normal">Belum diisi</em>}
          </span>
        </div>

        {/* Pekerjaan */}
        <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
          <span className="text-slate-400 text-xs block mb-1 flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5" /> Pekerjaan
          </span>
          <span className="font-bold text-slate-800">
            {getJobDisplay()}
          </span>
        </div>

        {/* Program BPJS */}
        <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
          <span className="text-slate-400 text-xs block mb-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Program Terpilih
          </span>
          <span className="font-bold text-emerald-700">
            {currentProgram ? currentProgram.title : <em className="text-slate-400 font-normal">Belum dipilih</em>}
          </span>
          {currentProgram && (
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Tarif {formatRupiah(currentProgram.monthlyRate)}/bulan
            </span>
          )}
        </div>

        {/* Periode Pembayaran */}
        <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
          <span className="text-slate-400 text-xs block mb-1 flex items-center gap-1">
            <CalendarClock className="w-3.5 h-3.5" /> Periode Pembayaran
          </span>
          <span className="font-bold text-slate-800">
            {formData.periodePembayaran ? `${formData.periodePembayaran} Bulan` : <em className="text-slate-400 font-normal">Belum dipilih</em>}
          </span>
        </div>

        {/* Estimasi Total Iuran */}
        <div className="sm:col-span-2 p-3.5 bg-gradient-to-r from-emerald-600 to-[#007b5e] text-white rounded-xl shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-200" />
            <div>
              <span className="text-xs text-emerald-100 block">Estimasi Total Iuran Pendaftaran:</span>
              <span className="text-lg sm:text-xl font-extrabold text-white">
                {totalIuran > 0 ? formatRupiah(totalIuran) : 'Rp0'}
              </span>
            </div>
          </div>
          <span className="text-xs bg-white/20 px-2.5 py-1 rounded-md text-emerald-100 font-medium">
            {formData.periodePembayaran ? `${formData.periodePembayaran} bln x ${formatRupiah(monthlyRate)}` : '-'}
          </span>
        </div>

        {/* Petunjuk Pengiriman Dokumen Persyaratan via WhatsApp */}
        <div className="sm:col-span-2 p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <Camera className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5 w-full">
            <span className="font-bold text-amber-950 block">
              Pengiriman Dokumen Persyaratan:
            </span>
            <p className="text-amber-800 leading-relaxed">
              Anda tidak perlu mengunggah foto di website ini. Silakan kirimkan dokumen persyaratan berupa <strong>Foto KTP Asli</strong>, <strong>Foto KK Asli</strong>, dan <strong>Foto diri terbaru (selfi)</strong> Anda langsung melalui chat WhatsApp petugas setelah pesan formulir pendaftaran ini terkirim.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100/80 border border-amber-300/80 text-amber-900 font-bold text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                Foto KTP Asli
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100/80 border border-amber-300/80 text-amber-900 font-bold text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                Foto KK Asli
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100/80 border border-amber-300/80 text-amber-900 font-bold text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                Foto diri terbaru (selfi)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
