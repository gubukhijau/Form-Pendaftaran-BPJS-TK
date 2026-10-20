import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AdminRegistrant, DocumentStatus, SupabaseConfig } from '../types';

const SUPABASE_CONFIG_KEY = 'bpjs_bpu_supabase_config';
export const DEFAULT_TABLE_NAME = 'pendaftar_bpjs_bpu';

let cachedClient: { url: string; key: string; client: SupabaseClient } | null = null;

export function getSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        url: parsed.url || '',
        anonKey: parsed.anonKey || '',
        tableName: parsed.tableName || DEFAULT_TABLE_NAME,
        isEnabled: Boolean(parsed.isEnabled && parsed.url && parsed.anonKey),
        lastSyncedAt: parsed.lastSyncedAt
      };
    }
  } catch {
    // Ignore storage parse error
  }

  // Check if env vars exist
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: envUrl,
    anonKey: envKey,
    tableName: DEFAULT_TABLE_NAME,
    isEnabled: Boolean(envUrl && envKey),
    lastSyncedAt: undefined
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  try {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
    cachedClient = null; // Clear cached client on config change
  } catch {
    // Ignore
  }
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
      auth: { persistSession: false }
    });
    cachedClient = { url: config.url, key: config.anonKey, client };
    return client;
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
  const client = getSupabaseClient();
  if (!client) return null;

  const config = getSupabaseConfig();
  const targetTable = config.tableName || DEFAULT_TABLE_NAME;

  try {
    const { data, error } = await client
      .from(targetTable)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      return null;
    }

    if (!Array.isArray(data)) return [];

    return data.map((row: any) => ({
      id: String(row.id || `REG-${Date.now()}`),
      namaLengkap: String(row.nama_lengkap || row.namaLengkap || '-'),
      alamat: String(row.alamat || '-'),
      noHp: String(row.no_hp || row.noHp || '-'),
      dokumen: (row.dokumen === 'Terlampir' ? 'Terlampir' : 'Belum Terlampir') as DocumentStatus,
      createdAt: row.created_at || row.createdAt || new Date().toISOString()
    }));
  } catch (err) {
    console.warn('Supabase network error:', err);
    return null;
  }
}

export async function insertRegistrantToSupabase(
  entry: AdminRegistrant
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const config = getSupabaseConfig();
  const targetTable = config.tableName || DEFAULT_TABLE_NAME;

  try {
    const payload = {
      id: entry.id,
      nama_lengkap: entry.namaLengkap,
      alamat: entry.alamat,
      no_hp: entry.noHp,
      dokumen: entry.dokumen,
      created_at: entry.createdAt || new Date().toISOString()
    };

    const { error } = await client.from(targetTable).upsert(payload);
    if (error) {
      console.warn('Supabase insert error:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function updateRegistrantInSupabase(
  id: string,
  newStatus: DocumentStatus
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const config = getSupabaseConfig();
  const targetTable = config.tableName || DEFAULT_TABLE_NAME;

  try {
    const { error } = await client
      .from(targetTable)
      .update({ dokumen: newStatus })
      .eq('id', id);

    if (error) {
      console.warn('Supabase update error:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function deleteRegistrantFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const config = getSupabaseConfig();
  const targetTable = config.tableName || DEFAULT_TABLE_NAME;

  try {
    const { error } = await client.from(targetTable).delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete error:', error.message);
      return false;
    }
    return true;
  } catch {
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
