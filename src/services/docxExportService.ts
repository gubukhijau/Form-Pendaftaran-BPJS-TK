import {
  Document,
  Paragraph,
  TextRun,
  Packer,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
  UnderlineType
} from 'docx';
import { saveAs } from 'file-saver';
import { AdminRegistrant, formatDateToDDMMYYYY } from '../types';
import { BPJS_LOGO_BASE64, REMAKO_LOGO_BASE64 } from './logosBase64';

const EMPTY_DOTS = '................................................................................................';

export interface DocxParticipantDetails {
  namaLengkap: string;
  nik?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  alamat: string;
  pekerjaanUtama?: string;
  pekerjaanSampingan?: string;
  namaIbuKandung?: string;
  noHp: string;
  email?: string;
  programBPJS?: string;
}

export function prepareParticipantDetails(
  registrant: AdminRegistrant,
  overrides?: Partial<DocxParticipantDetails>
): DocxParticipantDetails {
  let tempatTanggalLahir = '';
  if (registrant.tempatLahir && registrant.tanggalLahir) {
    tempatTanggalLahir = `${registrant.tempatLahir}, ${formatDateToDDMMYYYY(registrant.tanggalLahir)}`;
  } else if (registrant.tanggalLahir) {
    tempatTanggalLahir = formatDateToDDMMYYYY(registrant.tanggalLahir);
  } else if (registrant.tempatLahir) {
    tempatTanggalLahir = registrant.tempatLahir;
  }

  const base: DocxParticipantDetails = {
    namaLengkap: registrant.namaLengkap ? registrant.namaLengkap.toUpperCase() : '',
    nik: registrant.nik || '',
    tempatLahir: registrant.tempatLahir || '',
    tanggalLahir: registrant.tanggalLahir ? formatDateToDDMMYYYY(registrant.tanggalLahir) : '',
    alamat: registrant.alamat || '',
    pekerjaanUtama: registrant.pekerjaan || 'Pedagang',
    pekerjaanSampingan: registrant.pekerjaanSampingan || '',
    namaIbuKandung: registrant.namaIbuKandung ? registrant.namaIbuKandung.toUpperCase() : '',
    noHp: registrant.noHp || '',
    email: registrant.email || '',
    programBPJS: registrant.program || 'JKK & JKM'
  };

  if (overrides) {
    return { ...base, ...overrides };
  }

  return base;
}

export async function generateDocxBlob(details: DocxParticipantDetails): Promise<Blob> {
  const bpjsBuffer = Uint8Array.from(atob(BPJS_LOGO_BASE64), (c) => c.charCodeAt(0));
  const remakoBuffer = Uint8Array.from(atob(REMAKO_LOGO_BASE64), (c) => c.charCodeAt(0));

  let tglLahirDisplay = '';
  if (details.tempatLahir && details.tanggalLahir) {
    tglLahirDisplay = `${details.tempatLahir}, ${details.tanggalLahir}`;
  } else if (details.tanggalLahir) {
    tglLahirDisplay = details.tanggalLahir;
  } else if (details.tempatLahir) {
    tglLahirDisplay = details.tempatLahir;
  } else {
    tglLahirDisplay = EMPTY_DOTS;
  }

  const items = [
    { no: '1.', label: 'Nama Lengkap', value: details.namaLengkap || EMPTY_DOTS },
    { no: '2.', label: 'No KTP (NIK)', value: details.nik || EMPTY_DOTS },
    { no: '3.', label: 'Tempat, Tanggal Lahir', value: tglLahirDisplay },
    { no: '4.', label: 'Alamat', value: details.alamat || EMPTY_DOTS },
    { no: '5.', label: 'Pekerjaan Utama', value: details.pekerjaanUtama || 'Pedagang' },
    { no: '6.', label: 'Pekerjaan Sampingan', value: details.pekerjaanSampingan || EMPTY_DOTS },
    { no: '7.', label: 'Nama Ibu Kandung', value: details.namaIbuKandung || EMPTY_DOTS },
    { no: '8.', label: 'No Hp / WhatsApp', value: details.noHp || EMPTY_DOTS },
    { no: '9.', label: 'Email (Jika ada)', value: details.email || EMPTY_DOTS },
    { no: '10.', label: 'Program BPJS', value: details.programBPJS || 'JKK & JKM' }
  ];

  const noBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' }
  };

  // Header Table for Logos
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: bpjsBuffer,
                    transformation: { width: 145, height: 38 },
                    type: 'png'
                  })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new ImageRun({
                    data: remakoBuffer,
                    transformation: { width: 62, height: 58 },
                    type: 'png'
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  // Table for items 1-10
  const detailRows = items.map((item) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 5, type: WidthType.PERCENTAGE },
          borders: noBorders,
          children: [
            new Paragraph({
              spacing: { before: 50, after: 50 },
              children: [
                new TextRun({
                  text: item.no,
                  font: 'Arial',
                  size: 21
                })
              ]
            })
          ]
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          borders: noBorders,
          children: [
            new Paragraph({
              spacing: { before: 50, after: 50 },
              children: [
                new TextRun({
                  text: item.label,
                  font: 'Arial',
                  size: 21
                })
              ]
            })
          ]
        }),
        new TableCell({
          width: { size: 65, type: WidthType.PERCENTAGE },
          borders: noBorders,
          children: [
            new Paragraph({
              spacing: { before: 50, after: 50 },
              children: [
                new TextRun({
                  text: `: ${item.value}`,
                  font: 'Arial',
                  size: 21
                })
              ]
            })
          ]
        })
      ]
    });
  });

  const detailTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: detailRows
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 in
              right: 850,
              bottom: 720,
              left: 850
            }
          }
        },
        children: [
          headerTable,
          new Paragraph({ spacing: { before: 200, after: 60 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [
              new TextRun({
                text: 'FORMULIR PENDAFTARAN BPJS KETENAGAKERJAAN',
                font: 'Arial',
                size: 24, // 12pt
                bold: true
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 200 },
            children: [
              new TextRun({
                text: 'BUKAN PENERIMA UPAH (BPU)',
                font: 'Arial',
                size: 24,
                bold: true
              })
            ]
          }),
          new Paragraph({
            spacing: { before: 100, after: 120 },
            children: [
              new TextRun({
                text: 'Dalam rangka memberikan perlindungan terhadap diri resiko sosial yang mungkin dan pasti terjadi, yang bertanda tangan di bawah ini :',
                font: 'Arial',
                size: 21
              })
            ]
          }),
          detailTable,
          new Paragraph({
            spacing: { before: 120, after: 100 },
            children: [
              new TextRun({
                text: '*Wajib Melampirkan Foto KTP asli, Foto KK Asli dan Foto Diri Terbaru Calon Peserta*',
                font: 'Arial',
                size: 21,
                bold: true
              })
            ]
          }),
          new Paragraph({
            spacing: { before: 100, after: 100 },
            children: [
              new TextRun({
                text: 'Dengan ini saya menyatakan untuk mendaftarkan diri menjadi peserta BPJS Ketenagakerjaan secara mandiri (Bukan Penerima Upah). Dan saya menyatakan, saat ini saya mendaftar BPJS Ketenagakerjaan dalam kondisi ',
                font: 'Arial',
                size: 21
              }),
              new TextRun({
                text: 'aktif bekerja',
                font: 'Arial',
                size: 21,
                bold: true
              }),
              new TextRun({
                text: ' dan dalam keadaan ',
                font: 'Arial',
                size: 21
              }),
              new TextRun({
                text: "sehat wal'afiyat.",
                font: 'Arial',
                size: 21,
                bold: true
              })
            ]
          }),
          new Paragraph({
            spacing: { before: 100, after: 240 },
            children: [
              new TextRun({
                text: 'Demikian apabila data dan pernyataan saya ini tidak benar, saya dan ahliwaris saya bersedia untuk tidak menerima hak dan manfaat dari BPJS Ketenagakerjaan sesuai dengan peraturan yang berlaku.',
                font: 'Arial',
                size: 21
              })
            ]
          }),
          // Signature Block
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 120, after: 0 },
            children: [
              new TextRun({
                text: 'Calon Peserta                  ',
                font: 'Arial',
                size: 21
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({
                text: '\n\n\n\n',
                font: 'Arial',
                size: 21
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 600, after: 0 },
            children: [
              new TextRun({
                text: '(  ',
                font: 'Arial',
                size: 21
              }),
              new TextRun({
                text: details.namaLengkap ? details.namaLengkap.toUpperCase() : '................................................',
                font: 'Arial',
                size: 21,
                underline: { type: UnderlineType.SINGLE }
              }),
              new TextRun({
                text: '  )      ',
                font: 'Arial',
                size: 21
              })
            ]
          })
        ]
      }
    ]
  });

  return await Packer.toBlob(doc);
}

export async function exportParticipantToDocx(
  registrant: AdminRegistrant,
  customDetails?: Partial<DocxParticipantDetails>
): Promise<void> {
  const details = prepareParticipantDetails(registrant, customDetails);
  const blob = await generateDocxBlob(details);

  const sanitizedName = (details.namaLengkap || 'Peserta')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');
  const filename = `Formulir_BPJS_BPU_${sanitizedName}.docx`;

  saveAs(blob, filename);
}
