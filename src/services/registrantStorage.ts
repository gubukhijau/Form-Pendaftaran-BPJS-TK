import { AdminRegistrant, DocumentStatus } from '../types';
import {
  fetchRegistrantsFromSupabase,
  insertRegistrantToSupabase,
  updateRegistrantInSupabase,
  deleteRegistrantFromSupabase,
  getSupabaseConfig
} from './supabaseService';

const STORAGE_KEY = 'bpjs_bpu_admin_registrants';

const INITIAL_SAMPLE_REGISTRANTS: AdminRegistrant[] = [
  {
    id: 'REG-1001',
    namaLengkap: 'Budi Santoso',
    alamat: 'Jl. Melati No. 14, RT 02/RW 04, Kel. Sukamaju, Kec. Cilodong, Depok',
    noHp: '081234567890',
    dokumen: 'Terlampir',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'REG-1002',
    namaLengkap: 'Siti Aminah',
    alamat: 'Pasar Baru Blok B No. 12, RT 01/RW 02, Bandung',
    noHp: '085712348899',
    dokumen: 'Belum Terlampir',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'REG-1003',
    namaLengkap: 'Ahmad Fauzi',
    alamat: 'Dusun Krajan RT 03/RW 01, Desa Kalisat, Jember, Jawa Timur',
    noHp: '082198765432',
    dokumen: 'Terlampir',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 'REG-1004',
    namaLengkap: 'Dewi Lestari',
    alamat: 'Jl. Raya Godean Km. 7 No. 45, Sidoarum, Sleman, D.I. Yogyakarta',
    noHp: '087811223344',
    dokumen: 'Belum Terlampir',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

export function getLocalRegistrants(): AdminRegistrant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_REGISTRANTS));
      return INITIAL_SAMPLE_REGISTRANTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SAMPLE_REGISTRANTS;
  } catch {
    return INITIAL_SAMPLE_REGISTRANTS;
  }
}

export function setLocalRegistrants(list: AdminRegistrant[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('registrants_updated', { detail: list }));
    window.dispatchEvent(new Event('storage'));
  } catch {
    // Ignore storage quota
  }
}

export function getRegistrants(): AdminRegistrant[] {
  return getLocalRegistrants();
}

export async function fetchAndSyncRegistrants(): Promise<{
  data: AdminRegistrant[];
  source: 'supabase' | 'local';
}> {
  try {
    const remoteData = await fetchRegistrantsFromSupabase();
    if (remoteData !== null) {
      // Merge with any existing local details (like nik, namaIbuKandung, etc.)
      const localMap = new Map(getLocalRegistrants().map((item) => [item.id, item]));
      const mergedData = remoteData.map((remote) => {
        const local = localMap.get(remote.id);
        if (local) {
          return {
            ...local,
            ...remote,
            nik: remote.nik || local.nik,
            tempatLahir: remote.tempatLahir || local.tempatLahir,
            tanggalLahir: remote.tanggalLahir || local.tanggalLahir,
            namaIbuKandung: remote.namaIbuKandung || local.namaIbuKandung,
            pekerjaan: remote.pekerjaan || local.pekerjaan,
            pekerjaanSampingan: remote.pekerjaanSampingan || local.pekerjaanSampingan,
            email: remote.email || local.email,
            program: remote.program || local.program
          };
        }
        return remote;
      });

      setLocalRegistrants(mergedData);
      return { data: mergedData, source: 'supabase' };
    }
  } catch (err) {
    console.warn('Failed to fetch from Supabase, fallback to local', err);
  }
  return { data: getLocalRegistrants(), source: 'local' };
}

export async function saveRegistrantAsync(
  data: Omit<AdminRegistrant, 'id' | 'createdAt'>
): Promise<AdminRegistrant> {
  const current = getLocalRegistrants();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const newEntry: AdminRegistrant = {
    ...data,
    id: `REG-${randomSuffix}`,
    namaLengkap: data.namaLengkap.trim(),
    alamat: data.alamat.trim(),
    noHp: data.noHp.trim(),
    dokumen: data.dokumen || 'Belum Terlampir',
    createdAt: new Date().toISOString()
  };

  const updated = [newEntry, ...current];
  setLocalRegistrants(updated);

  // Save directly to Supabase
  try {
    await insertRegistrantToSupabase(newEntry);
  } catch (err) {
    console.warn('Direct Supabase insert error:', err);
  }

  return newEntry;
}

export function saveRegistrant(
  data: Omit<AdminRegistrant, 'id' | 'createdAt'>
): AdminRegistrant {
  const current = getLocalRegistrants();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const newEntry: AdminRegistrant = {
    ...data,
    id: `REG-${randomSuffix}`,
    namaLengkap: data.namaLengkap.trim(),
    alamat: data.alamat.trim(),
    noHp: data.noHp.trim(),
    dokumen: data.dokumen || 'Belum Terlampir',
    createdAt: new Date().toISOString()
  };

  const updated = [newEntry, ...current];
  setLocalRegistrants(updated);

  // Background sync to Supabase if configured
  insertRegistrantToSupabase(newEntry).catch((err) => {
    console.warn('Background Supabase insert error:', err);
  });

  return newEntry;
}

export function updateRegistrantDocumentStatus(
  id: string,
  newStatus: DocumentStatus
): AdminRegistrant[] {
  const current = getLocalRegistrants();
  const updated = current.map((item) =>
    item.id === id ? { ...item, dokumen: newStatus } : item
  );
  setLocalRegistrants(updated);

  // Background sync to Supabase if configured
  updateRegistrantInSupabase(id, newStatus).catch((err) => {
    console.warn('Background Supabase update error:', err);
  });

  return updated;
}

export function updateRegistrantDetails(
  id: string,
  details: Partial<AdminRegistrant>
): AdminRegistrant[] {
  const current = getLocalRegistrants();
  const updated = current.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        ...details,
        namaLengkap: details.namaLengkap !== undefined ? details.namaLengkap.trim() : item.namaLengkap,
        alamat: details.alamat !== undefined ? details.alamat.trim() : item.alamat,
        noHp: details.noHp !== undefined ? details.noHp.trim() : item.noHp,
        nik: details.nik !== undefined ? details.nik.trim() : item.nik,
        tempatLahir: details.tempatLahir !== undefined ? details.tempatLahir.trim() : item.tempatLahir,
        tanggalLahir: details.tanggalLahir !== undefined ? details.tanggalLahir.trim() : item.tanggalLahir,
        namaIbuKandung: details.namaIbuKandung !== undefined ? details.namaIbuKandung.trim() : item.namaIbuKandung,
        pekerjaan: details.pekerjaan !== undefined ? details.pekerjaan.trim() : item.pekerjaan,
        pekerjaanSampingan: details.pekerjaanSampingan !== undefined ? details.pekerjaanSampingan.trim() : item.pekerjaanSampingan,
        email: details.email !== undefined ? details.email.trim() : item.email,
        program: details.program !== undefined ? details.program.trim() : item.program
      };
    }
    return item;
  });

  setLocalRegistrants(updated);

  // Background sync to Supabase and server
  updateRegistrantInSupabase(id, details).catch((err) => {
    console.warn('Background update sync error:', err);
  });

  return updated;
}

export function deleteRegistrant(id: string): AdminRegistrant[] {
  const current = getLocalRegistrants();
  const updated = current.filter((item) => item.id !== id);
  setLocalRegistrants(updated);

  // Background delete in Supabase if configured
  deleteRegistrantFromSupabase(id).catch((err) => {
    console.warn('Background Supabase delete error:', err);
  });

  return updated;
}
