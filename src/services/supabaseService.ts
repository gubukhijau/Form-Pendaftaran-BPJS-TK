import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AdminRegistrant, DocumentStatus, SupabaseConfig } from '../types';

const SUPABASE_CONFIG_KEY = 'bpjs_bpu_supabase_config';
export const DEFAULT_TABLE_NAME = 'pendaftar_bpjs_bpu';
export const DEFAULT_SUPABASE_URL = 'https://bbjsfjrqoebafnojkmva.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJianNmanJxb2ViYWZub2prbXZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0ODg3NDIsImV4cCI6MjEwODA2NDc0Mn0.iDS01sDXKLqgfZ3aGnhe92sqbsT9HaFGc-uVkkVEW2w';

let cachedClient: { url: string; key: string; client: SupabaseClient } | null = null;

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = ((import.meta as any).env?.VITE_SUPABASE_URL || '').trim();
  const envKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim();

  let storedUrl = '';
  let storedKey = '';
  let storedTable = DEFAULT_TABLE_NAME;
  let storedEnabled = true;
  let storedLastSyncedAt: string | undefined = undefined;

  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      storedUrl = (parsed.url || '').trim();
      storedKey = (parsed.anonKey || '').trim();
      storedTable = (parsed.tableName || DEFAULT_TABLE_NAME).trim();
      storedEnabled = parsed.isEnabled !== false;
      storedLastSyncedAt = parsed.lastSyncedAt;
    }
  } catch {
    // Ignore storage parse error
  }

  const effectiveUrl = envUrl || storedUrl || DEFAULT_SUPABASE_URL;
  const effectiveKey = envKey || storedKey || DEFAULT_SUPABASE_ANON_KEY;
  const effectiveTable = storedTable || DEFAULT_TABLE_NAME;
  const effectiveEnabled = Boolean(effectiveUrl && effectiveKey);

  return {
    url: effectiveUrl,
    anonKey: effectiveKey,
    tableName: effectiveTable,
    isEnabled: effectiveEnabled,
    lastSyncedAt: storedLastSyncedAt
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  try {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
    cachedClient = null; // Clear cached client on config change
  } catch {
    // Ignore
  }

  // Also sync to server so all visitors on any device can access Supabase data
  try {
    fetch('/api/supabase-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    }).catch(() => {
      // Ignore background error
    });
  } catch {
    // Ignore
  }
}

export async function syncSupabaseConfigFromServer(): Promise<SupabaseConfig> {
  try {
    const res = await fetch('/api/supabase-config');
    if (res.ok) {
      const serverConfig = await res.json();
      if (serverConfig && serverConfig.url && serverConfig.anonKey) {
        const local = getSupabaseConfig();
        const merged: SupabaseConfig = {
          url: serverConfig.url || local.url,
          anonKey: serverConfig.anonKey || local.anonKey,
          tableName: serverConfig.tableName || local.tableName || DEFAULT_TABLE_NAME,
          isEnabled: Boolean(serverConfig.isEnabled !== false && serverConfig.url && serverConfig.anonKey),
          lastSyncedAt: serverConfig.lastSyncedAt || local.lastSyncedAt
        };
        try {
          localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(merged));
          cachedClient = null;
        } catch {}
        return merged;
      }
    }
  } catch (err) {
    console.warn('Could not sync config from server:', err);
  }
  return getSupabaseConfig();
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey || !config.isEnabled) {
    return null;
  }

  // Check cached client
  if (
    cachedClient &&
    cachedClient.url === config.url &&
    cachedClient.key === config.anonKey
  ) {
    return cachedClient.client;
  }

  try {
    const client = createClient(config.url.trim(), config.anonKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    cachedClient = { url: config.url, key: config.anonKey, client };
    return client;
  } catch {
    return null;
  }
}

export interface SupabaseAuthResult {
  success: boolean;
  message?: string;
  error?: string;
  user?: any;
  session?: any;
}

export async function signInWithSupabaseAuth(
  email: string,
  password: string
): Promise<SupabaseAuthResult> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase belum dikonfigurasi atau belum diaktifkan. Silakan buka Pengaturan Supabase terlebih dahulu.'
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      let msg = error.message;
      if (error.message.includes('Invalid login credentials')) {
        msg = 'Email atau password salah di Supabase Auth. Jika akun ini belum didaftarkan di proyek Supabase Anda, klik "Daftarkan Akun Ini".';
      } else if (error.message.includes('Email not confirmed')) {
        msg = 'Email belum dikonfirmasi di Supabase. Anda dapat menonaktifkan "Confirm email" di Dashboard Supabase > Authentication > Providers > Email.';
      }
      return {
        success: false,
        error: msg
      };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
      message: 'Login Supabase Auth berhasil!'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Terjadi gangguan saat menghubungi Supabase Auth.'
    };
  }
}

export async function signUpWithSupabaseAuth(
  email: string,
  password: string
): Promise<SupabaseAuthResult> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase belum dikonfigurasi. Silakan atur URL dan Anon Key terlebih dahulu.'
    };
  }

  try {
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
      message: data.session
        ? 'Pendaftaran akun Supabase berhasil dan sesi login langsung aktif!'
        : 'Pendaftaran akun Supabase berhasil! Silakan coba login sekarang atau periksa verifikasi email jika diaktifkan di Supabase.'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Gagal mendaftarkan akun di Supabase.'
    };
  }
}

export async function signOutSupabaseAuth(): Promise<void> {
  try {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
  } catch (err) {
    console.warn('Sign out error:', err);
  }
}

export async function getCurrentSupabaseUser(): Promise<any | null> {
  try {
    const client = getSupabaseClient();
    if (!client) return null;
    const { data } = await client.auth.getUser();
    return data?.user || null;
  } catch {
    return null;
  }
}

export async function getCurrentSupabaseSession(): Promise<any | null> {
  try {
    const client = getSupabaseClient();
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data?.session || null;
  } catch {
    return null;
  }
}

export async function testSupabaseConnection(configToTest?: SupabaseConfig): Promise<{
  success: boolean;
  message: string;
  rowCount?: number;
}> {
  const cfg = configToTest || getSupabaseConfig();

  if (!cfg.url || !cfg.anonKey) {
    return {
      success: false,
      message: 'URL Project Supabase dan Anon Key wajib diisi.'
    };
  }

  try {
    const testClient = createClient(cfg.url.trim(), cfg.anonKey.trim(), {
      auth: { persistSession: false }
    });

    const targetTable = (cfg.tableName || DEFAULT_TABLE_NAME).trim();
    const { data, error, count } = await testClient
      .from(targetTable)
      .select('*', { count: 'exact', head: false })
      .limit(1);

    if (error) {
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          success: false,
          message: `Koneksi berhasil ke Supabase, namun tabel "${targetTable}" belum dibuat. Jalankan query SQL pembuatan tabel yang disediakan.`
        };
      }
      return {
        success: false,
        message: `Gagal mengakses tabel "${targetTable}": ${error.message}`
      };
    }

    return {
      success: true,
      message: `Koneksi berhasil! Terhubung ke tabel "${targetTable}".`,
      rowCount: count ?? data?.length ?? 0
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menghubungi Supabase: ${err.message || 'Periksa URL dan koneksi internet Anda.'}`
    };
  }
}

export async function fetchRegistrantsFromSupabase(): Promise<AdminRegistrant[] | null> {
  // First try server endpoint /api/registrants because it integrates Supabase + persisted details
  try {
    const resp = await fetch('/api/registrants');
    if (resp.ok) {
      const json = await resp.json();
      if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Server API registrants error, checking direct Supabase client:', err);
  }

  let client = getSupabaseClient();
  if (!client) {
    // Try syncing config from server first in case another device configured it
    await syncSupabaseConfigFromServer();
    client = getSupabaseClient();
  }

  if (client) {
    const config = getSupabaseConfig();
    const targetTable = config.tableName || DEFAULT_TABLE_NAME;

    try {
      const { data, error } = await client
        .from(targetTable)
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map((row: any) => ({
          id: String(row.id || `REG-${Date.now()}`),
          namaLengkap: String(row.nama_lengkap || row.namaLengkap || '-'),
          alamat: String(row.alamat || '-'),
          noHp: String(row.no_hp || row.noHp || '-'),
          dokumen: (row.dokumen === 'Terlampir' ? 'Terlampir' : 'Belum Terlampir') as DocumentStatus,
          createdAt: row.created_at || row.createdAt || new Date().toISOString(),
          nik: String(row.nik || row.no_ktp || ''),
          tempatLahir: String(row.tempat_lahir || row.tempatLahir || ''),
          tanggalLahir: String(row.tanggal_lahir || row.tanggalLahir || ''),
          namaIbuKandung: String(row.nama_ibu_kandung || row.namaIbuKandung || ''),
          pekerjaan: String(row.pekerjaan || ''),
          pekerjaanSampingan: String(row.pekerjaan_sampingan || ''),
          email: String(row.email || ''),
          program: String(row.program || '')
        }));
      } else if (error) {
        console.warn('Supabase fetch error, trying server API fallback:', error.message);
      }
    } catch (err) {
      console.warn('Supabase network error, trying server API fallback:', err);
    }
  }

  return null;
}

export async function insertRegistrantToSupabase(
  entry: AdminRegistrant
): Promise<boolean> {
  // Always send to server API to ensure full fields (NIK, tempat/tanggal lahir, dll) persist
  try {
    fetch('/api/registrants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    }).catch((err) => console.warn('Server API POST error:', err));
  } catch {}

  const client = getSupabaseClient();
  const config = getSupabaseConfig();
  const targetTable = config.tableName || DEFAULT_TABLE_NAME;

  if (client) {
    try {
      const fullPayload: any = {
        id: entry.id,
        nama_lengkap: entry.namaLengkap,
        alamat: entry.alamat,
        no_hp: entry.noHp,
        dokumen: entry.dokumen,
        created_at: entry.createdAt || new Date().toISOString(),
        nik: entry.nik || '',
        tempat_lahir: entry.tempatLahir || '',
        tanggal_lahir: entry.tanggalLahir || '',
        nama_ibu_kandung: entry.namaIbuKandung || '',
        pekerjaan: entry.pekerjaan || '',
        pekerjaanSampingan: entry.pekerjaanSampingan || '',
        email: entry.email || '',
        program: entry.program || ''
      };

      const { error } = await client.from(targetTable).upsert(fullPayload);
      if (!error) {
        return true;
      }
      // If table lacks some columns, fallback to base payload
      const basePayload = {
        id: entry.id,
        nama_lengkap: entry.namaLengkap,
        alamat: entry.alamat,
        no_hp: entry.noHp,
        dokumen: entry.dokumen,
        created_at: entry.createdAt || new Date().toISOString()
      };
      await client.from(targetTable).upsert(basePayload);
      return true;
    } catch (err) {
      console.warn('Supabase client error, trying server fallback:', err);
    }
  }

  return true;
}

export async function updateRegistrantInSupabase(
  id: string,
  newStatusOrUpdates: DocumentStatus | Partial<AdminRegistrant>
): Promise<boolean> {
  const updates: Partial<AdminRegistrant> =
    typeof newStatusOrUpdates === 'string'
      ? { dokumen: newStatusOrUpdates }
      : newStatusOrUpdates;

  // Sync to server API
  try {
    fetch(`/api/registrants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch((err) => console.warn('Server patch error:', err));
  } catch {}

  const client = getSupabaseClient();
  const config = getSupabaseConfig();
  const targetTable = config.tableName || DEFAULT_TABLE_NAME;

  if (client) {
    try {
      const remoteUpdates: any = {};
      if (updates.dokumen !== undefined) remoteUpdates.dokumen = updates.dokumen;
      if (updates.namaLengkap !== undefined) remoteUpdates.nama_lengkap = updates.namaLengkap;
      if (updates.alamat !== undefined) remoteUpdates.alamat = updates.alamat;
      if (updates.noHp !== undefined) remoteUpdates.no_hp = updates.noHp;
      if (updates.nik !== undefined) remoteUpdates.nik = updates.nik;
      if (updates.tempatLahir !== undefined) remoteUpdates.tempat_lahir = updates.tempatLahir;
      if (updates.tanggalLahir !== undefined) remoteUpdates.tanggal_lahir = updates.tanggalLahir;
      if (updates.namaIbuKandung !== undefined) remoteUpdates.nama_ibu_kandung = updates.namaIbuKandung;
      if (updates.pekerjaan !== undefined) remoteUpdates.pekerjaan = updates.pekerjaan;
      if (updates.pekerjaanSampingan !== undefined) remoteUpdates.pekerjaan_sampingan = updates.pekerjaanSampingan;
      if (updates.email !== undefined) remoteUpdates.email = updates.email;
      if (updates.program !== undefined) remoteUpdates.program = updates.program;

      const { error } = await client
        .from(targetTable)
        .update(remoteUpdates)
        .eq('id', id);

      if (!error) {
        return true;
      }

      // If full columns update failed, try base columns only
      const baseUpdates: any = {};
      if (updates.dokumen !== undefined) baseUpdates.dokumen = updates.dokumen;
      if (updates.namaLengkap !== undefined) baseUpdates.nama_lengkap = updates.namaLengkap;
      if (updates.alamat !== undefined) baseUpdates.alamat = updates.alamat;
      if (updates.noHp !== undefined) baseUpdates.no_hp = updates.noHp;
      if (Object.keys(baseUpdates).length > 0) {
        await client.from(targetTable).update(baseUpdates).eq('id', id);
      }
    } catch (err) {
      console.warn('Supabase client update error, trying server fallback:', err);
    }
  }

  return true;
}

export async function deleteRegistrantFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  const config = getSupabaseConfig();
  const targetTable = config.tableName || DEFAULT_TABLE_NAME;

  if (client) {
    try {
      const { error } = await client.from(targetTable).delete().eq('id', id);
      if (!error) {
        return true;
      }
      console.warn('Supabase client delete error, trying server fallback:', error.message);
    } catch (err) {
      console.warn('Supabase client delete error, trying server fallback:', err);
    }
  }

  // Fallback to server API /api/registrants/:id
  try {
    const res = await fetch(`/api/registrants/${id}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.warn('Server fallback delete error:', err);
    return false;
  }
}


export async function syncAllLocalToSupabase(
  localList: AdminRegistrant[]
): Promise<{ success: boolean; count: number; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      count: 0,
      message: 'Supabase belum diaktifkan atau dikonfigurasi.'
    };
  }

  const config = getSupabaseConfig();
  const targetTable = config.tableName || DEFAULT_TABLE_NAME;

  if (localList.length === 0) {
    return {
      success: true,
      count: 0,
      message: 'Tidak ada data lokal untuk disinkronkan.'
    };
  }

  const payload = localList.map((entry) => ({
    id: entry.id,
    nama_lengkap: entry.namaLengkap,
    alamat: entry.alamat,
    no_hp: entry.noHp,
    dokumen: entry.dokumen,
    created_at: entry.createdAt || new Date().toISOString()
  }));

  try {
    const { error } = await client.from(targetTable).upsert(payload);
    if (error) {
      return {
        success: false,
        count: 0,
        message: `Gagal sinkronisasi data ke Supabase: ${error.message}`
      };
    }

    // Update lastSyncedAt
    const updatedConfig: SupabaseConfig = {
      ...config,
      lastSyncedAt: new Date().toISOString()
    };
    saveSupabaseConfig(updatedConfig);

    return {
      success: true,
      count: payload.length,
      message: `Berhasil menyinkronkan ${payload.length} data pendaftar ke Supabase.`
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      message: `Kesalahan jaringan: ${err.message || 'Gagal mengirim data ke Supabase.'}`
    };
  }
}
