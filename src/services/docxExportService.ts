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
  UnderlineType,
  VerticalAlign,
  PageOrientation
} from 'docx';
import { saveAs } from 'file-saver';
import { AdminRegistrant, formatDateToDDMMYYYY } from '../types';
import { BPJS_LOGO_BASE64, REMAKO_LOGO_BASE64 } from './logosBase64';

const EMPTY_DOTS = '................................................';

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

  const rawProgram = (registrant.program || '').trim();
  const normalizedProgram = rawProgram
    ? rawProgram.toUpperCase().includes('JHT')
      ? 'JKK, JKM, dan JHT'
      : 'JKK & JKM'
    : 'JKK & JKM';

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
    programBPJS: normalizedProgram
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

  const cleanEmail = details.email && details.email.trim() ? details.email.trim() : '-';

  const items = [
    { no: '1.', label: 'Nama Lengkap', value: details.namaLengkap ? details.namaLengkap.toUpperCase() : EMPTY_DOTS, isBold: Boolean(details.namaLengkap) },
    { no: '2.', label: 'No KTP (NIK)', value: details.nik || EMPTY_DOTS, isBold: Boolean(details.nik) },
    { no: '3.', label: 'Tempat, Tanggal Lahir', value: tglLahirDisplay, isBold: false },
    { no: '4.', label: 'Alamat', value: details.alamat || EMPTY_DOTS, isBold: false },
    { no: '5.', label: 'Pekerjaan Utama', value: details.pekerjaanUtama || 'Pedagang', isBold: false },
    { no: '6.', label: 'Pekerjaan Sampingan', value: details.pekerjaanSampingan || '-', isBold: false },
    { no: '7.', label: 'Nama Ibu Kandung', value: details.namaIbuKandung ? details.namaIbuKandung.toUpperCase() : EMPTY_DOTS, isBold: false },
    { no: '8.', label: 'No Hp / WhatsApp', value: details.noHp || EMPTY_DOTS, isBold: false },
    { no: '9.', label: 'Email (Jika ada)', value: cleanEmail, isBold: false },
    { no: '10.', label: 'Program BPJS', value: details.programBPJS || 'JKK & JKM', isBold: true }
  ];

  const noTableBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' }
  };

  const noCellBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' }
  };

  // Header Table for Logos - strictly vertically centered so both logos align
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noTableBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: noCellBorders,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 0, after: 0 },
                children: [
                  new ImageRun({
                    data: bpjsBuffer,
                    transformation: { width: 165, height: 42 },
                    type: 'png'
                  })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: noCellBorders,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 0, after: 0 },
                children: [
                  new ImageRun({
                    data: remakoBuffer,
                    transformation: { width: 52, height: 52 },
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

  // Table for items 1-10 with dedicated colon column, font size 12 (size: 24), 1.5 line spacing, and hidden borders
  const detailRows = items.map((item) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 4, type: WidthType.PERCENTAGE },
          borders: noCellBorders,
          verticalAlign: VerticalAlign.TOP,
          children: [
            new Paragraph({
              spacing: { line: 360, before: 16, after: 16 },
              children: [
                new TextRun({
                  text: item.no,
                  font: 'Arial',
                  size: 24
                })
              ]
            })
          ]
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          borders: noCellBorders,
          verticalAlign: VerticalAlign.TOP,
          children: [
            new Paragraph({
              spacing: { line: 360, before: 16, after: 16 },
              children: [
                new TextRun({
                  text: item.label,
                  font: 'Arial',
                  size: 24
                })
              ]
            })
          ]
        }),
        new TableCell({
          width: { size: 2, type: WidthType.PERCENTAGE },
          borders: noCellBorders,
          verticalAlign: VerticalAlign.TOP,
          children: [
            new Paragraph({
              spacing: { line: 360, before: 16, after: 16 },
              children: [
                new TextRun({
                  text: ':',
                  font: 'Arial',
                  size: 24
                })
              ]
            })
          ]
        }),
        new TableCell({
          width: { size: 64, type: WidthType.PERCENTAGE },
          borders: noCellBorders,
          verticalAlign: VerticalAlign.TOP,
          children: [
            new Paragraph({
              spacing: { line: 360, before: 16, after: 16 },
              children: [
                new TextRun({
                  text: item.value,
                  font: 'Arial',
                  size: 24,
                  bold: item.isBold
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
    borders: noTableBorders,
    rows: detailRows
  });

  let todayFormatted = '';
  try {
    todayFormatted = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date());
  } catch {
    todayFormatted = '......................... 20..';
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906, // A4: 210mm
              height: 16838, // A4: 297mm
              orientation: PageOrientation.PORTRAIT
            },
            margin: {
              top: 1134, // 2 cm (1134 twips)
              right: 1134, // 2 cm
              bottom: 1134, // 2 cm
              left: 1134 // 2 cm
            }
          }
        },
        children: [
          headerTable,
          new Paragraph({ spacing: { before: 80, after: 20 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: 360, before: 0, after: 10 },
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
            spacing: { line: 360, before: 0, after: 100 },
            children: [
              new TextRun({
                text: 'BUKAN PENERIMA UPAH (BPU)',
                font: 'Arial',
                size: 24, // 12pt
                bold: true
              })
            ]
          }),
          new Paragraph({
            spacing: { line: 360, before: 30, after: 50 },
            children: [
              new TextRun({
                text: 'Dalam rangka memberikan perlindungan terhadap diri resiko sosial yang mungkin dan pasti terjadi, yang bertanda tangan di bawah ini :',
                font: 'Arial',
                size: 24 // 12pt
              })
            ]
          }),
          detailTable,
          new Paragraph({
            spacing: { line: 360, before: 60, after: 40 },
            children: [
              new TextRun({
                text: '*Wajib Melampirkan Foto KTP asli, Foto KK Asli dan Foto Diri Terbaru Calon Peserta*',
                font: 'Arial',
                size: 24, // 12pt
                bold: true
              })
            ]
          }),
          new Paragraph({
            spacing: { line: 360, before: 30, after: 40 },
            children: [
              new TextRun({
                text: 'Dengan ini saya menyatakan untuk mendaftarkan diri menjadi peserta BPJS Ketenagakerjaan secara mandiri (Bukan Penerima Upah). Dan saya menyatakan, saat ini saya mendaftar BPJS Ketenagakerjaan dalam kondisi ',
                font: 'Arial',
                size: 24 // 12pt
              }),
              new TextRun({
                text: 'aktif bekerja',
                font: 'Arial',
                size: 24, // 12pt
                bold: true
              }),
              new TextRun({
                text: ' dan dalam keadaan ',
                font: 'Arial',
                size: 24 // 12pt
              }),
              new TextRun({
                text: "sehat wal'afiyat.",
                font: 'Arial',
                size: 24, // 12pt
                bold: true
              })
            ]
          }),
          new Paragraph({
            spacing: { line: 360, before: 30, after: 80 },
            children: [
              new TextRun({
                text: 'Demikian apabila data dan pernyataan saya ini tidak benar, saya dan ahliwaris saya bersedia untuk tidak menerima hak dan manfaat dari BPJS Ketenagakerjaan sesuai dengan peraturan yang berlaku.',
                font: 'Arial',
                size: 24 // 12pt
              })
            ]
          }),
          // Signature Block
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { line: 360, before: 40, after: 10 },
            children: [
              new TextRun({
                text: `Brebes, ${todayFormatted}          `,
                font: 'Arial',
                size: 24 // 12pt
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { line: 360, before: 0, after: 0 },
            children: [
              new TextRun({
                text: 'Calon Peserta,                      ',
                font: 'Arial',
                size: 24 // 12pt
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { line: 360, before: 600, after: 0 },
            children: [
              new TextRun({
                text: '(  ',
                font: 'Arial',
                size: 24 // 12pt
              }),
              new TextRun({
                text: details.namaLengkap ? details.namaLengkap.toUpperCase() : '................................................',
                font: 'Arial',
                size: 24, // 12pt
                bold: true,
                underline: { type: UnderlineType.SINGLE }
              }),
              new TextRun({
                text: '  )      ',
                font: 'Arial',
                size: 24 // 12pt
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
