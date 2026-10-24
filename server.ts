import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

const CONFIG_FILE = path.join(process.cwd(), '.supabase-config.json');

const DEFAULT_SUPABASE_URL = 'https://bbjsfjrqoebafnojkmva.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJianNmanJxb2ViYWZub2prbXZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0ODg3NDIsImV4cCI6MjEwODA2NDc0Mn0.iDS01sDXKLqgfZ3aGnhe92sqbsT9HaFGc-uVkkVEW2w';

function getStoredSupabaseConfig() {
  const envUrl = (process.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();

  let fileUrl = '';
  let fileKey = '';
  let fileTable = '';
  let fileEnabled = true;
  let fileLastSyncedAt: string | undefined = undefined;

  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        fileUrl = (parsed.url || '').trim();
        fileKey = (parsed.anonKey || '').trim();
        fileTable = (parsed.tableName || '').trim();
        fileEnabled = parsed.isEnabled !== false;
        fileLastSyncedAt = parsed.lastSyncedAt;
      }
    }
  } catch (err) {
    console.warn('Error reading config file:', err);
  }

  const effectiveUrl = envUrl || fileUrl || DEFAULT_SUPABASE_URL;
  const effectiveKey = envKey || fileKey || DEFAULT_SUPABASE_ANON_KEY;
  const effectiveTable = fileTable || 'pendaftar_bpjs_bpu';
  const effectiveEnabled = Boolean(effectiveUrl && effectiveKey);

  return {
    url: effectiveUrl,
    anonKey: effectiveKey,
    tableName: effectiveTable,
    isEnabled: effectiveEnabled,
    lastSyncedAt: fileLastSyncedAt
  };
}

function getSupabaseAdminClient() {
  const config = getStoredSupabaseConfig();
  if (!config.isEnabled || !config.url || !config.anonKey) {
    return null;
  }
  return {
    client: createClient(config.url, config.anonKey, {
      auth: { persistSession: false }
    }),
    table: config.tableName || 'pendaftar_bpjs_bpu'
  };
}

// GET /api/supabase-config
app.get('/api/supabase-config', (_req, res) => {
  const config = getStoredSupabaseConfig();
  res.json(config);
});

// POST /api/supabase-config
app.post('/api/supabase-config', (req, res) => {
  try {
    const config = req.body;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    res.json({ success: true, config });
  } catch (err: any) {
    console.error('Error saving config:', err);
    res.status(500).json({ error: err.message || 'Failed to save config' });
  }
});

const DETAILS_FILE = path.join(process.cwd(), '.registrants-details.json');

function getStoredRegistrantDetails(): Record<string, any> {
  try {
    if (fs.existsSync(DETAILS_FILE)) {
      const content = fs.readFileSync(DETAILS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return parsed && typeof parsed === 'object' ? parsed : {};
    }
  } catch (err) {
    console.warn('Error reading details file:', err);
  }
  return {};
}

function upsertStoredRegistrantDetail(id: string, detail: any) {
  try {
    const existing = getStoredRegistrantDetails();
    const updated = {
      ...existing,
      [id]: {
        ...(existing[id] || {}),
        ...detail,
        id
      }
    };
    fs.writeFileSync(DETAILS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return updated[id];
  } catch (err) {
    console.warn('Error saving details file:', err);
    return detail;
  }
}

// GET /api/registrants - Returns list of registrants with full details
app.get('/api/registrants', async (_req, res) => {
  const detailsMap = getStoredRegistrantDetails();
  const ctx = getSupabaseAdminClient();

  if (ctx) {
    try {
      const { data, error } = await ctx.client
        .from(ctx.table)
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const formatted = data.map((row: any) => {
          const detail = detailsMap[row.id] || {};
          return {
            id: String(row.id || `REG-${Date.now()}`),
            namaLengkap: String(row.nama_lengkap || row.namaLengkap || detail.namaLengkap || '-'),
            alamat: String(row.alamat || detail.alamat || '-'),
            noHp: String(row.no_hp || row.noHp || detail.noHp || '-'),
            dokumen: row.dokumen === 'Terlampir' ? 'Terlampir' : 'Belum Terlampir',
            createdAt: row.created_at || row.createdAt || detail.createdAt || new Date().toISOString(),
            nik: String(row.nik || row.no_ktp || detail.nik || ''),
            tempatLahir: String(row.tempat_lahir || row.tempatLahir || detail.tempatLahir || ''),
            tanggalLahir: String(row.tanggal_lahir || row.tanggalLahir || detail.tanggalLahir || ''),
            namaIbuKandung: String(row.nama_ibu_kandung || row.namaIbuKandung || detail.namaIbuKandung || ''),
            pekerjaan: String(row.pekerjaan || detail.pekerjaan || ''),
            pekerjaanSampingan: String(row.pekerjaan_sampingan || detail.pekerjaanSampingan || ''),
            email: String(row.email || detail.email || ''),
            program: String(row.program || detail.program || '')
          };
        });
        return res.json({ success: true, source: 'supabase', data: formatted });
      } else if (error) {
        console.warn('Supabase fetch query error:', error.message);
      }
    } catch (err: any) {
      console.warn('Error connecting to Supabase:', err.message);
    }
  }

  // Fallback to local stored details if Supabase is offline or unconfigured
  const localList = Object.values(detailsMap);
  return res.json({ success: true, source: 'local', data: localList });
});

// POST /api/registrants - Upsert a registrant into database
app.post('/api/registrants', async (req, res) => {
  const {
    id,
    namaLengkap,
    alamat,
    noHp,
    dokumen,
    createdAt,
    nik,
    tempatLahir,
    tanggalLahir,
    namaIbuKandung,
    pekerjaan,
    pekerjaanSampingan,
    email,
    program,
    periodePembayaran
  } = req.body;

  if (!namaLengkap || !alamat || !noHp) {
    return res.status(400).json({ success: false, error: 'Missing required registrant fields' });
  }

  const targetId = id || `REG-${Date.now().toString().slice(-6)}`;
  const cleanDetail = {
    id: targetId,
    namaLengkap: String(namaLengkap).trim(),
    alamat: String(alamat).trim(),
    noHp: String(noHp).trim(),
    dokumen: dokumen === 'Terlampir' ? 'Terlampir' : 'Belum Terlampir',
    createdAt: createdAt || new Date().toISOString(),
    nik: (nik || '').trim(),
    tempatLahir: (tempatLahir || '').trim(),
    tanggalLahir: (tanggalLahir || '').trim(),
    namaIbuKandung: (namaIbuKandung || '').trim(),
    pekerjaan: (pekerjaan || '').trim(),
    pekerjaanSampingan: (pekerjaanSampingan || '').trim(),
    email: (email || '').trim(),
    program: (program || '').trim(),
    periodePembayaran: Number(periodePembayaran) || 1
  };

  // Always persist all details in server storage
  upsertStoredRegistrantDetail(targetId, cleanDetail);

  const ctx = getSupabaseAdminClient();
  if (ctx) {
    try {
      // 1. Try upserting full payload with all columns
      const fullPayload: any = {
        id: targetId,
        nama_lengkap: cleanDetail.namaLengkap,
        alamat: cleanDetail.alamat,
        no_hp: cleanDetail.noHp,
        dokumen: cleanDetail.dokumen,
        created_at: cleanDetail.createdAt,
        nik: cleanDetail.nik,
        tempat_lahir: cleanDetail.tempatLahir,
        tanggal_lahir: cleanDetail.tanggalLahir,
        nama_ibu_kandung: cleanDetail.namaIbuKandung,
        pekerjaan: cleanDetail.pekerjaan,
        pekerjaan_sampingan: cleanDetail.pekerjaanSampingan,
        email: cleanDetail.email,
        program: cleanDetail.program
      };

      const { error: fullError } = await ctx.client.from(ctx.table).upsert(fullPayload);
      if (fullError) {
        // 2. If table doesn't have extra columns yet, fallback to base columns
        console.warn('Supabase full payload warning, falling back to base columns:', fullError.message);
        const basePayload = {
          id: targetId,
          nama_lengkap: cleanDetail.namaLengkap,
          alamat: cleanDetail.alamat,
          no_hp: cleanDetail.noHp,
          dokumen: cleanDetail.dokumen,
          created_at: cleanDetail.createdAt
        };
        await ctx.client.from(ctx.table).upsert(basePayload);
      }
    } catch (err: any) {
      console.warn('Supabase upsert caught warning:', err.message);
    }
  }

  return res.json({ success: true, data: cleanDetail });
});

// PATCH /api/registrants/:id - Update participant details or document status
app.patch('/api/registrants/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Persist update in server store
  const saved = upsertStoredRegistrantDetail(id, updates);

  const ctx = getSupabaseAdminClient();
  if (ctx) {
    try {
      // Prepare remote payload
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

      const { error } = await ctx.client.from(ctx.table).update(remoteUpdates).eq('id', id);
      if (error) {
        // Fallback to base columns only
        const baseUpdates: any = {};
        if (updates.dokumen !== undefined) baseUpdates.dokumen = updates.dokumen;
        if (updates.namaLengkap !== undefined) baseUpdates.nama_lengkap = updates.namaLengkap;
        if (updates.alamat !== undefined) baseUpdates.alamat = updates.alamat;
        if (updates.noHp !== undefined) baseUpdates.no_hp = updates.noHp;
        if (Object.keys(baseUpdates).length > 0) {
          await ctx.client.from(ctx.table).update(baseUpdates).eq('id', id);
        }
      }
    } catch (err: any) {
      console.warn('Supabase patch caught warning:', err.message);
    }
  }

  return res.json({ success: true, id, data: saved });
});

// DELETE /api/registrants/:id - Delete registrant
app.delete('/api/registrants/:id', async (req, res) => {
  const { id } = req.params;

  // Remove from server store
  try {
    const existing = getStoredRegistrantDetails();
    if (existing[id]) {
      delete existing[id];
      fs.writeFileSync(DETAILS_FILE, JSON.stringify(existing, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('Error deleting from details store:', err);
  }

  const ctx = getSupabaseAdminClient();
  if (ctx) {
    try {
      await ctx.client.from(ctx.table).delete().eq('id', id);
    } catch (err: any) {
      console.warn('Error deleting from Supabase:', err.message);
    }
  }

  return res.json({ success: true, id });
});


async function start() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
