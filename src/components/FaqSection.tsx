import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Apa itu BPJS Ketenagakerjaan BPU (Bukan Penerima Upah)?',
      a: 'BPU adalah segmen kepesertaan BPJS Ketenagakerjaan khusus bagi pekerja mandiri yang bekerja secara independen, tidak terikat oleh majikan/perusahaan tetap, seperti pedagang, tukang, pengemudi ojek online, petani, nelayan, seniman, dokter praktik mandiri, pengacara, dan wirausahawan.'
    },
    {
      q: 'Apa perbedaan antara Program JKK + JKM dengan JKK + JKM + JHT?',
      a: 'Program JKK + JKM (Rp16.800/bulan) memberikan perlindungan asuransi terhadap risiko kecelakaan kerja dan santunan kematian. Program JKK + JKM + JHT (Rp36.800/bulan) mencakup perlindungan kecelakaan kerja, kematian, plus tabungan Jaminan Hari Tua (JHT) yang dapat dicairkan di masa mendatang dengan imbal hasil investasi.'
    },
    {
      q: 'Bagaimana cara mengirimkan dokumen persyaratan (Foto KTP Asli, Foto KK Asli, dan Foto Diri/Selfie)?',
      a: 'Anda tidak perlu mengunggah foto di website ini. Cukup isi data diri di formulir, lalu tekan tombol "Kirim Pendaftaran via WhatsApp". Setelah WhatsApp terbuka dan pesan pendaftaran terkirim, Anda dapat langsung melampirkan berkas persyaratan berupa Foto KTP Asli, Foto KK Asli, dan Foto diri terbaru (selfi) ke obrolan WhatsApp petugas kami (0857-4367-8786).'
    },
    {
      q: 'Bagaimana cara pembayaran iuran untuk bulan-bulan berikutnya?',
      a: 'Setelah nomor kepesertaan Anda aktif dan terbit e-card, Anda dapat membayar iuran lanjutan melalui Indomaret, Alfamart, ATM bank pemerintah (BRI, Mandiri, BNI, BTN), Mobile Banking, Kantor Pos, maupun aplikasi digital seperti Tokopedia, Shopee, dan GoPay.'
    }
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <HelpCircle className="w-5 h-5 text-[#003366]" />
        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
          Pertanyaan Umum (FAQ) Pendaftaran BPU
        </h3>
      </div>

      <div className="space-y-2">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full text-left p-3.5 bg-slate-50/70 hover:bg-slate-100 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-slate-800 transition-colors"
              >
                <span>{faq.q}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-[#003366] shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className="p-3.5 bg-white text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
