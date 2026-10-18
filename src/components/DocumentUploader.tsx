import React, { useRef, useState } from 'react';
import { RegistrationFormData } from '../types';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  RefreshCw,
  AlertCircle,
  Eye,
  X,
  FileCheck,
  Info
} from 'lucide-react';

interface Props {
  formData: RegistrationFormData;
  errors: Record<string, string>;
  onChange: <K extends keyof RegistrationFormData>(field: K, value: RegistrationFormData[K]) => void;
  onClearError: (field: string) => void;
}

export const DocumentUploader: React.FC<Props> = ({
  formData,
  errors,
  onChange,
  onClearError
}) => {
  const ktpInputRef = useRef<HTMLInputElement>(null);
  const kkInputRef = useRef<HTMLInputElement>(null);

  const [modalImage, setModalImage] = useState<{ url: string; title: string } | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: 'ktp' | 'kk'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB = 5 * 1024 * 1024 bytes)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert(`Ukuran file ${file.name} melebihi batas maksimal 5 MB. Silakan pilih foto dengan ukuran lebih kecil.`);
      e.target.value = '';
      return;
    }

    // Validate format
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      alert('Format file tidak didukung. Harap gunakan format JPG, JPEG, PNG, atau WEBP.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const sizeStr = formatFileSize(file.size);

      if (docType === 'ktp') {
        onChange('ktpFile', file);
        onChange('ktpPreview', result);
        onChange('ktpFileName', file.name);
        onChange('ktpFileSize', sizeStr);
        if (errors.ktp) onClearError('ktp');
      } else {
        onChange('kkFile', file);
        onChange('kkPreview', result);
        onChange('kkFileName', file.name);
        onChange('kkFileSize', sizeStr);
        if (errors.kk) onClearError('kk');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveKtp = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('ktpFile', null);
    onChange('ktpPreview', null);
    onChange('ktpFileName', '');
    onChange('ktpFileSize', '');
    if (ktpInputRef.current) ktpInputRef.current.value = '';
  };

  const handleRemoveKk = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('kkFile', null);
    onChange('kkPreview', null);
    onChange('kkFileName', '');
    onChange('kkFileSize', '');
    if (kkInputRef.current) kkInputRef.current.value = '';
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-100 text-[#003366] flex items-center justify-center font-bold text-sm">
            5
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Upload Dokumen Persyaratan (KTP & KK)
          </h2>
        </div>
        <span className="text-xs text-red-500 font-semibold">* Wajib keduanya</span>
      </div>

      {/* Clear notice regarding WhatsApp and Document mechanism */}
      <div className="bg-sky-50 border border-sky-200/80 rounded-2xl p-4 text-xs sm:text-sm text-sky-900 space-y-2">
        <div className="flex items-start gap-2.5">
          <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sky-950">
              Petunjuk Pengiriman Dokumen (2 Langkah Mudah)
            </h4>
            <p className="text-sky-800 leading-relaxed text-xs">
              Karena kebijakan privasi WhatsApp tidak mengizinkan pengiriman file foto secara otomatis lewat tautan URL,
              sistem kami membagi pendaftaran menjadi dua langkah:
            </p>
            <ol className="list-decimal list-inside text-sky-900 text-xs font-medium space-y-0.5 mt-1">
              <li>
                <strong>Langkah 1:</strong> Formulir website otomatis menyiapkan pesan data pendaftaran ke WhatsApp petugas.
              </li>
              <li>
                <strong>Langkah 2:</strong> Setelah WhatsApp terbuka, lampirkan kedua foto KTP dan KK yang telah Anda siapkan di bawah ini ke chat WhatsApp petugas.
              </li>
            </ol>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* A. Upload Foto KTP */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>A. Upload Foto KTP</span>
              <span className="text-red-500">*</span>
            </label>
            {formData.ktpPreview && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Foto Siap
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-500 mb-2">
            Ambil langsung dengan kamera HP atau pilih dari galeri. Format JPG, PNG, WEBP (maks. 5 MB).
          </p>

          <input
            ref={ktpInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFileChange(e, 'ktp')}
          />

          {!formData.ktpPreview ? (
            <div
              onClick={() => ktpInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-white hover:bg-slate-50 min-h-[190px] ${
                errors.ktp
                  ? 'border-red-400 bg-red-50/20 ring-2 ring-red-100'
                  : 'border-slate-300 hover:border-[#003366]'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-sky-50 text-[#003366] flex items-center justify-center mb-3">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 mb-1">
                Ketuk untuk Ambil Foto KTP / Galeri
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs">
                Pastikan tulisan NIK, nama, dan foto pada KTP terlihat jelas dan tidak silau.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl p-3 bg-white shadow-xs space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-slate-900 max-h-48 flex items-center justify-center group">
                <img
                  src={formData.ktpPreview}
                  alt="Preview KTP"
                  className="w-full h-44 object-contain"
                />
                <button
                  type="button"
                  onClick={() => setModalImage({ url: formData.ktpPreview!, title: 'Preview Foto KTP' })}
                  className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold"
                >
                  <Eye className="w-4 h-4" />
                  Perbesar Foto
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                <div className="truncate max-w-[200px]">
                  <span className="font-semibold text-slate-800 block truncate">{formData.ktpFileName}</span>
                  <span className="text-[11px] text-slate-400">{formData.ktpFileSize}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => ktpInputRef.current?.click()}
                    className="p-1.5 text-slate-600 hover:text-[#003366] hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                    title="Ganti Foto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ganti</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveKtp}
                    className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                    title="Hapus Foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {errors.ktp && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.ktp}
            </p>
          )}
        </div>

        {/* B. Upload Foto Kartu Keluarga (KK) */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>B. Upload Foto Kartu Keluarga (KK)</span>
              <span className="text-red-500">*</span>
            </label>
            {formData.kkPreview && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Foto Siap
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-500 mb-2">
            Ambil langsung dengan kamera HP atau pilih dari galeri. Format JPG, PNG, WEBP (maks. 5 MB).
          </p>

          <input
            ref={kkInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFileChange(e, 'kk')}
          />

          {!formData.kkPreview ? (
            <div
              onClick={() => kkInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-white hover:bg-slate-50 min-h-[190px] ${
                errors.kk
                  ? 'border-red-400 bg-red-50/20 ring-2 ring-red-100'
                  : 'border-slate-300 hover:border-[#003366]'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 mb-1">
                Ketuk untuk Ambil Foto KK / Galeri
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs">
                Pastikan lembar Kartu Keluarga terlihat utuh, nomor KK dan susunan keluarga terbaca jelas.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl p-3 bg-white shadow-xs space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-slate-900 max-h-48 flex items-center justify-center group">
                <img
                  src={formData.kkPreview}
                  alt="Preview KK"
                  className="w-full h-44 object-contain"
                />
                <button
                  type="button"
                  onClick={() => setModalImage({ url: formData.kkPreview!, title: 'Preview Foto Kartu Keluarga (KK)' })}
                  className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold"
                >
                  <Eye className="w-4 h-4" />
                  Perbesar Foto
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                <div className="truncate max-w-[200px]">
                  <span className="font-semibold text-slate-800 block truncate">{formData.kkFileName}</span>
                  <span className="text-[11px] text-slate-400">{formData.kkFileSize}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => kkInputRef.current?.click()}
                    className="p-1.5 text-slate-600 hover:text-[#003366] hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                    title="Ganti Foto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ganti</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveKk}
                    className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                    title="Hapus Foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {errors.kk && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.kk}
            </p>
          )}
        </div>
      </div>

      {/* Modal Zoom Preview */}
      {modalImage && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">
                {modalImage.title}
              </h3>
              <button
                type="button"
                onClick={() => setModalImage(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={modalImage.url}
                alt={modalImage.title}
                className="max-h-[60vh] max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="p-3 bg-slate-50 text-right">
              <button
                type="button"
                onClick={() => setModalImage(null)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-900"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
