import React, { useState, useEffect } from 'react';
import { AdminRegistrant } from '../types';
import {
  DocxParticipantDetails,
  prepareParticipantDetails,
  exportParticipantToDocx
} from '../services/docxExportService';
import { updateRegistrantDetails } from '../services/registrantStorage';
import {
  FileText,
  Download,
  X,
  User,
  CreditCard,
  MapPin,
  Calendar,
  Home,
  Briefcase,
  Heart,
  Phone,
  Mail,
  Shield,
  Loader2,
  Check,
  Database,
  Save
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  registrant: AdminRegistrant | null;
  onSaveRegistrant?: (updated: AdminRegistrant) => void;
}

const FALLBACK_DETAILS: DocxParticipantDetails = {
  namaLengkap: '',
  nik: '',
  tempatLahir: '',
  tanggalLahir: '',
  alamat: '',
  pekerjaanUtama: 'Pedagang',
  pekerjaanSampingan: '',
  namaIbuKandung: '',
  noHp: '',
  email: '',
  programBPJS: 'JKK & JKM'
};

export const ExportDocxModal: React.FC<Props> = ({
  isOpen,
  onClose,
  registrant,
  onSaveRegistrant
}) => {
  const [details, setDetails] = useState<DocxParticipantDetails>(() =>
    registrant ? prepareParticipantDetails(registrant) : FALLBACK_DETAILS
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isSavingDb, setIsSavingDb] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (registrant) {
      setDetails(prepareParticipantDetails(registrant));
      setSaveSuccessMessage('');
    }
  }, [registrant]);

  if (!isOpen || !registrant) return null;

  const handleChange = (field: keyof DocxParticipantDetails, value: string) => {
    setDetails((prev) => ({ ...prev, [field]: value }));
  };

  const persistToDatabase = (): AdminRegistrant | undefined => {
    if (!registrant) return undefined;
    const updatedFields: Partial<AdminRegistrant> = {
      namaLengkap: details.namaLengkap.trim(),
      nik: (details.nik || '').trim(),
      tempatLahir: (details.tempatLahir || '').trim(),
      tanggalLahir: (details.tanggalLahir || '').trim(),
      namaIbuKandung: (details.namaIbuKandung || '').trim(),
      alamat: (details.alamat || '').trim(),
      pekerjaan: (details.pekerjaanUtama || '').trim(),
      pekerjaanSampingan: (details.pekerjaanSampingan || '').trim(),
      noHp: (details.noHp || '').trim(),
      email: (details.email || '').trim(),
      program: (details.programBPJS || '').trim()
    };
    const updatedList = updateRegistrantDetails(registrant.id, updatedFields);
    const updatedObj = updatedList.find((r) => r.id === registrant.id);
    if (updatedObj && onSaveRegistrant) {
      onSaveRegistrant(updatedObj);
    }
    return updatedObj;
  };

  const handleSaveOnly = async () => {
    setIsSavingDb(true);
    try {
      persistToDatabase();
      setSaveSuccessMessage('Data NIK, TTL & rincian peserta berhasil disimpan ke database!');
      setTimeout(() => setSaveSuccessMessage(''), 3000);
    } finally {
      setIsSavingDb(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // 1. Simpan NIK, Tempat/Tanggal Lahir ke database secara otomatis
      persistToDatabase();

      // 2. Buat dan unduh dokumen DOCX
      await exportParticipantToDocx(registrant, details);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Export DOCX error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 my-auto animate-scaleUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#003366] via-[#0b4870] to-[#007b5e] p-5 sm:p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">
              Ekspor Dokumen Resmi (.docx)
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-300" />
            Formulir Pendaftaran BPJS BPU
          </h3>
          <p className="text-xs text-slate-100/90 mt-1">
            Format resmi lengkap dengan logo BPJS Ketenagakerjaan & Remako Kalimati siap cetak (Word / DOCX).
          </p>
        </div>

        {/* Content Body - Edit & Review Fields */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {saveSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 text-xs text-blue-900">
            <strong>Data Tersinkronisasi ke Database:</strong> Isian NIK, Tempat & Tanggal Lahir, serta Nama Ibu Kandung akan otomatis tersimpan ke database peserta saat Anda mengklik <em>Simpan ke Database</em> atau <em>Simpan & Unduh DOCX</em>.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            {/* 1. Nama Lengkap */}
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                1. Nama Lengkap
              </label>
              <input
                type="text"
                value={details.namaLengkap}
                onChange={(e) => handleChange('namaLengkap', e.target.value)}
                placeholder="Contoh: KUNTORO"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#003366]"
              />
            </div>

            {/* 2. No KTP (NIK) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>2. No KTP (NIK)</span>
                </label>
                {details.nik ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                    Ada di Database
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Lengkapi NIK
                  </span>
                )}
              </div>
              <input
                type="text"
                maxLength={16}
                value={details.nik || ''}
                onChange={(e) => handleChange('nik', e.target.value.replace(/\D/g, ''))}
                placeholder="16 digit NIK KTP"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-[#003366]"
              />
            </div>

            {/* 3. Tempat, Tanggal Lahir */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>3. Tempat, Tanggal Lahir</span>
                </label>
                {(details.tempatLahir || details.tanggalLahir) ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                    Ada di Database
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Lengkapi TTL
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={details.tempatLahir || ''}
                  onChange={(e) => handleChange('tempatLahir', e.target.value)}
                  placeholder="Kota / Kab Lahir"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-[#003366]"
                />
                <input
                  type="text"
                  value={details.tanggalLahir || ''}
                  onChange={(e) => handleChange('tanggalLahir', e.target.value)}
                  placeholder="dd/mm/yyyy"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-[#003366]"
                />
              </div>
            </div>

            {/* 4. Alamat */}
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-slate-400" />
                4. Alamat Lengkap
              </label>
              <textarea
                rows={2}
                value={details.alamat}
                onChange={(e) => handleChange('alamat', e.target.value)}
                placeholder="Dukuh, RT/RW, Desa, Kecamatan, Kabupaten"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-[#003366] resize-none"
              />
            </div>

            {/* 5. Pekerjaan Utama */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                5. Pekerjaan Utama
              </label>
              <input
                type="text"
                value={details.pekerjaanUtama || ''}
                onChange={(e) => handleChange('pekerjaanUtama', e.target.value)}
                placeholder="Contoh: Pedagang / Petani / Tukang"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-[#003366]"
              />
            </div>

            {/* 6. Pekerjaan Sampingan */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                6. Pekerjaan Sampingan (Jika ada)
              </label>
              <input
                type="text"
                value={details.pekerjaanSampingan || ''}
                onChange={(e) => handleChange('pekerjaanSampingan', e.target.value)}
                placeholder="Kosongkan bila tidak ada"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-[#003366]"
              />
            </div>

            {/* 7. Nama Ibu Kandung */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-pink-500" />
                7. Nama Ibu Kandung <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={details.namaIbuKandung || ''}
                onChange={(e) => handleChange('namaIbuKandung', e.target.value)}
                placeholder="Contoh: KARTINI"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#003366]"
              />
            </div>

            {/* 8. No Hp / WhatsApp */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                8. No Hp / WhatsApp
              </label>
              <input
                type="text"
                value={details.noHp}
                onChange={(e) => handleChange('noHp', e.target.value)}
                placeholder="081234567890"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-[#003366]"
              />
            </div>

            {/* 9. Email */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                9. Email (Jika ada)
              </label>
              <input
                type="email"
                value={details.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="nama@email.com (opsional)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-[#003366]"
              />
            </div>

            {/* 10. Program BPJS */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                10. Program BPJS
              </label>
              <select
                value={details.programBPJS || 'JKK & JKM'}
                onChange={(e) => handleChange('programBPJS', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-[#003366]"
              >
                <option value="JKK & JKM">JKK & JKM</option>
                <option value="JKK, JKM, dan JHT">JKK, JKM, dan JHT</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={handleSaveOnly}
              disabled={isSavingDb || isExporting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-50 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              title="Simpan NIK, Tempat/Tanggal Lahir & seluruh rincian ke database"
            >
              {isSavingDb ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#003366]" />
                  <span>Menyimpan ke DB...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-emerald-600" />
                  <span>Simpan ke Database</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#003366] hover:bg-[#0b4870] active:bg-[#002244] disabled:bg-slate-300 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-sky-900/20 transition-all cursor-pointer"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                  <span>Menyimpan DB & Unduh...</span>
                </>
              ) : isSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Tersimpan & Diunduh!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-emerald-300" />
                  <span>Simpan & Unduh DOCX</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
