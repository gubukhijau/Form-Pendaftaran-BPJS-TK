/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { PersonalDataFields } from './components/PersonalDataFields';
import { JobSelector } from './components/JobSelector';
import { ProgramSelector } from './components/ProgramSelector';
import { PaymentPeriodSelector } from './components/PaymentPeriodSelector';
import { StatementSection } from './components/StatementSection';
import { RegistrationSummary } from './components/RegistrationSummary';
import { WhatsAppSubmitModal } from './components/WhatsAppSubmitModal';
import { PrivacyNotice } from './components/PrivacyNotice';
import { FaqSection } from './components/FaqSection';
import { AdminPage } from './components/AdminPage';
import { ParticipantDirectoryPage } from './components/ParticipantDirectoryPage';
import { saveRegistrant } from './services/registrantStorage';
import { syncSupabaseConfigFromServer } from './services/supabaseService';
import { RegistrationFormData, WA_TARGET_NUMBER, parseDDMMYYYY } from './types';
import {
  Loader2,
  AlertCircle,
  Sparkles,
  Users,
  UserCheck
} from 'lucide-react';

const initialFormData: RegistrationFormData = {
  namaLengkap: '',
  nik: '',
  alamatRumah: '',
  tempatLahir: '',
  tanggalLahir: '',
  nomorHp: '',
  email: '',
  pekerjaan: '',
  detailPekerjaanTukang: '',
  detailPekerjaanLain: '',
  program: '',
  periodePembayaran: 0,
  pernyataanData: false,
  pernyataanKesehatan: false
};

export default function App() {
  const [currentView, setCurrentView] = useState<'form' | 'admin' | 'participants'>('form');
  const [formData, setFormData] = useState<RegistrationFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const personalDataRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    syncSupabaseConfigFromServer();
  }, []);

  const handleFieldChange = <K extends keyof RegistrationFormData>(
    field: K,
    value: RegistrationFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearError = (field: string) => {
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
    if (generalError) setGeneralError(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Nama Lengkap
    if (!formData.namaLengkap.trim()) {
      newErrors.namaLengkap = 'Nama lengkap wajib diisi sesuai KTP.';
    } else if (formData.namaLengkap.trim().length < 3) {
      newErrors.namaLengkap = 'Nama lengkap minimal 3 karakter.';
    }

    // 2. NIK (16 digit)
    if (!formData.nik.trim()) {
      newErrors.nik = 'Nomor NIK KTP wajib diisi.';
    } else if (!/^\d{16}$/.test(formData.nik.trim())) {
      newErrors.nik = `Nomor NIK harus tepat 16 digit angka (saat ini ${formData.nik.trim().length} digit).`;
    }

    // 3. Alamat Rumah
    if (!formData.alamatRumah.trim()) {
      newErrors.alamatRumah = 'Alamat rumah lengkap wajib diisi.';
    } else if (formData.alamatRumah.trim().length < 10) {
      newErrors.alamatRumah = 'Mohon masukkan alamat lengkap (minimal 10 karakter).';
    }

    // 4. Tempat Lahir
    if (!formData.tempatLahir.trim()) {
      newErrors.tempatLahir = 'Tempat lahir wajib diisi.';
    }

    // 5. Tanggal Lahir (dd/mm/yyyy)
    if (!formData.tanggalLahir.trim()) {
      newErrors.tanggalLahir = 'Tanggal lahir wajib diisi.';
    } else {
      const birth = parseDDMMYYYY(formData.tanggalLahir);
      const today = new Date();
      if (!birth || isNaN(birth.getTime())) {
        newErrors.tanggalLahir = 'Format tanggal lahir harus dd/mm/yyyy (Contoh: 17/08/1990).';
      } else if (birth >= today) {
        newErrors.tanggalLahir = 'Tanggal lahir tidak boleh di masa depan.';
      } else if (today.getFullYear() - birth.getFullYear() > 105) {
        newErrors.tanggalLahir = 'Mohon periksa kembali tahun lahir Anda.';
      }
    }

    // 6. Nomor HP
    if (!formData.nomorHp.trim()) {
      newErrors.nomorHp = 'Nomor HP / WhatsApp wajib diisi.';
    } else {
      const cleanPhone = formData.nomorHp.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        newErrors.nomorHp = 'Nomor HP harus valid (antara 10-15 digit angka).';
      }
    }

    // 7. Email (Opsional)
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Format alamat email tidak valid.';
      }
    }

    // 8. Pekerjaan
    if (!formData.pekerjaan) {
      newErrors.pekerjaan = 'Pilihan pekerjaan wajib dipilih.';
    } else if (formData.pekerjaan === 'Tukang' && !formData.detailPekerjaanTukang.trim()) {
      newErrors.detailPekerjaanTukang = 'Sebutkan jenis pekerjaan tukang Anda.';
    } else if (formData.pekerjaan === 'Lain-lain' && !formData.detailPekerjaanLain.trim()) {
      newErrors.detailPekerjaanLain = 'Sebutkan nama pekerjaan Anda.';
    }

    // 9. Program
    if (!formData.program) {
      newErrors.program = 'Program BPJS Ketenagakerjaan wajib dipilih.';
    }

    // 10. Periode Pembayaran
    if (!formData.periodePembayaran) {
      newErrors.periodePembayaran = 'Periode pembayaran wajib dipilih.';
    }

    // 11. Pernyataan Data
    if (!formData.pernyataanData) {
      newErrors.pernyataanData = 'Anda wajib menyetujui pernyataan kebenaran data.';
    }

    // 12. Pernyataan Kesehatan
    if (!formData.pernyataanKesehatan) {
      newErrors.pernyataanKesehatan = 'Anda wajib menyatakan bahwa saat ini dalam kondisi sehat dan aktif bekerja.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setGeneralError('Terdapat data yang belum lengkap atau belum sesuai. Silakan periksa kolom yang bertanda merah di atas.');
      // Scroll to the first error
      setTimeout(() => {
        const firstErrorEl = document.querySelector('.text-red-600, .border-red-400');
        if (firstErrorEl) {
          firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (formRef.current) {
          formRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return false;
    }

    setGeneralError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Brief loading effect for validation & preparation
    setTimeout(() => {
      const isValid = validateForm();
      setIsSubmitting(false);
      if (isValid) {
        // Record applicant into admin registrant storage
        saveRegistrant({
          namaLengkap: formData.namaLengkap.trim(),
          alamat: formData.alamatRumah.trim(),
          noHp: formData.nomorHp.trim(),
          dokumen: 'Belum Terlampir'
        });
        setIsModalOpen(true);
      }
    }, 350);
  };

  const handleEditSection = () => {
    if (personalDataRef.current) {
      personalDataRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (currentView === 'admin') {
    return (
      <AdminPage
        onBackToForm={() => setCurrentView('form')}
        onOpenParticipants={() => setCurrentView('participants')}
      />
    );
  }

  if (currentView === 'participants') {
    return (
      <ParticipantDirectoryPage
        onBackToForm={() => setCurrentView('form')}
        onOpenAdmin={() => setCurrentView('admin')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Header Banner */}
      <Header
        onOpenAdmin={() => setCurrentView('admin')}
        onOpenParticipants={() => setCurrentView('participants')}
      />

      {/* Main Container - Mobile First Card */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 -mt-8 pb-16 relative z-10">
        {/* Main Card */}
        <div
          ref={formRef}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden"
        >
          {/* Progress / Step Pill Bar */}
          <div className="bg-slate-50 border-b border-slate-100 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Formulir Pendaftaran Calon Peserta BPU</span>
            </div>
            <div className="text-[11px] text-slate-500">
              WhatsApp Layanan: <strong className="text-slate-700">{WA_TARGET_NUMBER}</strong>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-8 sm:space-y-10">
            {/* General Error Banner if submission had errors */}
            {generalError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-red-800">
                    Perhatian: Formulir Belum Lengkap
                  </h4>
                  <p className="text-xs text-red-700 leading-relaxed">
                    {generalError}
                  </p>
                </div>
              </div>
            )}

            {/* Section 1: Data Diri */}
            <div ref={personalDataRef} id="personal-data">
              <PersonalDataFields
                formData={formData}
                errors={errors}
                onChange={handleFieldChange}
                onClearError={handleClearError}
              />
            </div>

            {/* Section 2: Pilihan Pekerjaan */}
            <JobSelector
              formData={formData}
              errors={errors}
              onChange={handleFieldChange}
              onClearError={handleClearError}
            />

            {/* Section 3: Pilihan Program BPJS */}
            <ProgramSelector
              formData={formData}
              errors={errors}
              onChange={handleFieldChange}
              onClearError={handleClearError}
            />

            {/* Section 4: Periode Pembayaran & Kalkulator */}
            <PaymentPeriodSelector
              formData={formData}
              errors={errors}
              onChange={handleFieldChange}
              onClearError={handleClearError}
            />

            {/* Section 5: Pernyataan Peserta */}
            <StatementSection
              formData={formData}
              errors={errors}
              onChange={handleFieldChange}
              onClearError={handleClearError}
            />

            {/* Section 6: Ringkasan Sebelum Submit */}
            <RegistrationSummary
              formData={formData}
              onEditSection={handleEditSection}
            />

            {/* Submit Action Area */}
            <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto min-w-[280px] inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#1ebc57] active:bg-[#189b47] disabled:bg-slate-300 text-white font-extrabold text-base sm:text-lg rounded-2xl shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memproses Formulir...</span>
                  </>
                ) : (
                  <>
                    {/* Authentic WhatsApp SVG Icon */}
                    <svg
                      className="w-6 h-6 fill-current"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span>Kirim Pendaftaran via WhatsApp</span>
                  </>
                )}
              </button>

              <p className="text-xs text-slate-500 text-center max-w-md">
                Pesan formulir pendaftaran akan terbuka otomatis di WhatsApp nomor <span className="font-semibold text-slate-700">{WA_TARGET_NUMBER}</span>. Kirimkan pesan tersebut beserta foto fisik KTP & KK Anda di ruang obrolan.
              </p>
            </div>
          </form>
        </div>

        {/* Informational Sub-sections */}
        <div className="mt-8 space-y-6">
          <PrivacyNotice />
          <FaqSection />
        </div>
      </main>

      {/* Confirmation & WhatsApp Launch Modal */}
      <WhatsAppSubmitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 px-4 border-t border-slate-800 text-center space-y-3">
        <p className="text-slate-300 font-semibold">
          Formulir Pengajuan Kepesertaan Mandiri BPJS Ketenagakerjaan BPU
        </p>
        <p className="max-w-xl mx-auto text-slate-400 text-[11px] leading-relaxed">
          Penyedia formulir bantuan pendaftaran pekerja bukan penerima upah untuk perlindungan JKK, JKM, dan JHT. Teks pesan pendaftaran diteruskan ke nomor layanan WhatsApp 085743678786.
        </p>
        <div className="pt-1 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => setCurrentView('participants')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lihat Data Peserta</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('admin')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Halaman Admin Pencatatan</span>
          </button>
        </div>
        <p className="text-slate-500 text-[10px] pt-1">
          &copy; {new Date().getFullYear()} Formulir Pendaftaran BPJS Ketenagakerjaan BPU. Seluruh Hak Cipta Dilindungi.
        </p>
      </footer>
    </div>
  );
}
