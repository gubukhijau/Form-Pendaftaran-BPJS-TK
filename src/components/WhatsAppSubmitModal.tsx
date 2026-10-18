import React, { useState } from 'react';
import { RegistrationFormData, PROGRAM_DATA, formatRupiah, WA_TARGET_INTERNATIONAL, WA_TARGET_NUMBER } from '../types';
import {
  Send,
  CheckCircle,
  Copy,
  Check,
  ExternalLink,
  X,
  FileImage,
  AlertTriangle,
  Download,
  ShieldCheck,
  MessageCircle
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  formData: RegistrationFormData;
}

export const WhatsAppSubmitModal: React.FC<Props> = ({
  isOpen,
  onClose,
  formData
}) => {
  const [copied, setCopied] = useState(false);
  const [hasOpenedWhatsApp, setHasOpenedWhatsApp] = useState(false);

  if (!isOpen) return null;

  const currentProgram = formData.program ? PROGRAM_DATA[formData.program] : null;
  const monthlyRate = currentProgram ? currentProgram.monthlyRate : 0;
  const totalIuran = formData.periodePembayaran && monthlyRate ? formData.periodePembayaran * monthlyRate : 0;

  // Formatted job title
  const getJobString = () => {
    if (formData.pekerjaan === 'Tukang') {
      return `Tukang (${formData.detailPekerjaanTukang || 'Tukang'})`;
    }
    if (formData.pekerjaan === 'Lain-lain') {
      return formData.detailPekerjaanLain || 'Lain-lain';
    }
    return formData.pekerjaan || '-';
  };

  // Format date to Indonesian human readable
  const formatTanggalIndo = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Build exact formatted WhatsApp message according to requirements
  const buildWhatsAppMessage = (): string => {
    const jobText = getJobString();
    const emailText = formData.email.trim() ? formData.email.trim() : 'Tidak diisi';
    const tglLahirText = formatTanggalIndo(formData.tanggalLahir);

    return (
`Halo, saya ingin mendaftar BPJS Ketenagakerjaan BPU.

DATA PESERTA
Nama Lengkap: ${formData.namaLengkap.trim()}
NIK: ${formData.nik.trim()}
Alamat Rumah: ${formData.alamatRumah.trim()}
Tempat Lahir: ${formData.tempatLahir.trim()}
Tanggal Lahir: ${tglLahirText}
Nomor HP: ${formData.nomorHp.trim()}
Email: ${emailText}
Pekerjaan: ${jobText}

PROGRAM
Program yang dipilih: ${currentProgram?.title || '-'}
Tarif bulanan: ${formatRupiah(monthlyRate)}
Periode pembayaran: ${formData.periodePembayaran} Bulan
Estimasi total iuran: ${formatRupiah(totalIuran)}

DOKUMEN
Foto KTP: Sudah dipilih
Foto KK: Sudah dipilih

PERNYATAAN
Peserta menyatakan data yang diisi benar dan menyetujui pernyataan pendaftaran.

Mohon informasi mengenai proses selanjutnya. Terima kasih.`
    );
  };

  const messageText = buildWhatsAppMessage();
  const whatsappUrl = `https://wa.me/${WA_TARGET_INTERNATIONAL}?text=${encodeURIComponent(messageText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    setHasOpenedWhatsApp(true);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const downloadFile = (dataUrl: string | null, filename: string) => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 my-auto animate-scaleUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#003366] via-[#004f7a] to-[#007b5e] p-5 sm:p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-200 tracking-wider uppercase">
              Konfirmasi Pendaftaran BPU
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
            Data Pendaftaran Siap Dikirim ke WhatsApp
          </h3>
          <p className="text-xs sm:text-sm text-slate-100/90 mt-1">
            Tujuan: Petugas BPJS BPU ({WA_TARGET_NUMBER})
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Important 2-step instruction */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs sm:text-sm text-amber-900 space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-950">
                  PENTING: Pengiriman Dokumen KTP & KK di WhatsApp
                </h4>
                <p className="text-xs text-amber-800 leading-relaxed mt-1">
                  1. Tekan tombol hijau <strong>&ldquo;Buka WhatsApp Sekarang&rdquo;</strong> di bawah. Pesan data formulir Anda akan otomatis terbuka di aplikasi WhatsApp.
                </p>
                <p className="text-xs text-amber-800 leading-relaxed mt-1">
                  2. <strong>Tekan tombol Kirim (Send)</strong> di WhatsApp.
                </p>
                <p className="text-xs text-amber-800 leading-relaxed mt-1">
                  3. <strong>Lampirkan kedua foto (KTP & KK)</strong> secara manual melalui ikon lampiran/galeri WhatsApp pada ruang obrolan tersebut.
                </p>
              </div>
            </div>
          </div>

          {/* Preview of WhatsApp Message Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                Format Pesan WhatsApp Otomatis:
              </label>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#003366] hover:text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Pesan</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono leading-relaxed max-h-44 overflow-y-auto whitespace-pre-wrap select-all border border-slate-800">
              {messageText}
            </div>
          </div>

          {/* Quick Photo Access for Attachment */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileImage className="w-4 h-4 text-[#003366]" />
                Foto Dokumen yang Telah Anda Unggah
              </span>
              <span className="text-[11px] text-slate-500">Siap dilampirkan</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {formData.ktpPreview && (
                <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img src={formData.ktpPreview} alt="KTP" className="w-8 h-8 rounded object-cover shrink-0" />
                    <span className="truncate text-[11px] font-medium text-slate-700">Foto KTP</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadFile(formData.ktpPreview, `KTP-${formData.namaLengkap.replace(/\s+/g, '_')}.jpg`)}
                    className="p-1 text-slate-500 hover:text-[#003366] hover:bg-slate-100 rounded"
                    title="Unduh Foto KTP"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {formData.kkPreview && (
                <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img src={formData.kkPreview} alt="KK" className="w-8 h-8 rounded object-cover shrink-0" />
                    <span className="truncate text-[11px] font-medium text-slate-700">Foto KK</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadFile(formData.kkPreview, `KK-${formData.namaLengkap.replace(/\s+/g, '_')}.jpg`)}
                    className="p-1 text-slate-500 hover:text-[#003366] hover:bg-slate-100 rounded"
                    title="Unduh Foto KK"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Status notice after clicking WhatsApp */}
          {hasOpenedWhatsApp && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1 animate-fadeIn">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                WhatsApp Sedang Dibuka
              </div>
              <p>
                Silakan tekan tombol <strong>Kirim</strong> di obrolan WhatsApp, kemudian kirimkan foto KTP dan Kartu Keluarga Anda ke nomor <strong>{WA_TARGET_NUMBER}</strong> agar pendaftaran segera diproses.
              </p>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            Kembali ke Formulir
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-[#25D366] hover:bg-[#1ebc57] active:bg-[#189b47] text-white text-sm sm:text-base font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5"
          >
            <Send className="w-4 h-4" />
            <span>Buka WhatsApp Sekarang</span>
            <ExternalLink className="w-4 h-4 opacity-80" />
          </button>
        </div>
      </div>
    </div>
  );
};
