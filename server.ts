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

// GET /api/registrants - Returns list of registrants from Supabase
app.get('/api/registrants', async (_req, res) => {
  const ctx = getSupabaseAdminClient();
  if (ctx) {
    try {
      const { data, error } = await ctx.client
        .from(ctx.table)
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const formatted = data.map((row: any) => ({
          id: String(row.id || `REG-${Date.now()}`),
          namaLengkap: String(row.nama_lengkap || row.namaLengkap || '-'),
          alamat: String(row.alamat || '-'),
          noHp: String(row.no_hp || row.noHp || '-'),
          dokumen: row.dokumen === 'Terlampir' ? 'Terlampir' : 'Belum Terlampir',
          createdAt: row.created_at || row.createdAt || new Date().toISOString()
        }));
        return res.json({ success: true, source: 'supabase', data: formatted });
      } else if (error) {
        console.warn('Supabase fetch query error:', error.message);
      }
    } catch (err: any) {
      console.warn('Error connecting to Supabase:', err.message);
    }
  }

  return res.json({ success: true, source: 'none', data: [] });
});

// POST /api/registrants - Upsert a registrant into Supabase
app.post('/api/registrants', async (req, res) => {
  const ctx = getSupabaseAdminClient();
  if (!ctx) {
    return res.status(503).json({ success: false, error: 'Supabase client not initialized' });
  }

  const { id, namaLengkap, alamat, noHp, dokumen, createdAt } = req.body;
  if (!namaLengkap || !alamat || !noHp) {
    return res.status(400).json({ success: false, error: 'Missing required registrant fields' });
  }

  try {
    const payload = {
      id: id || `REG-${Date.now().toString().slice(-6)}`,
      nama_lengkap: String(namaLengkap).trim(),
      alamat: String(alamat).trim(),
      no_hp: String(noHp).trim(),
      dokumen: dokumen === 'Terlampir' ? 'Terlampir' : 'Belum Terlampir',
      created_at: createdAt || new Date().toISOString()
    };

    const { error } = await ctx.client.from(ctx.table).upsert(payload);
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.json({ success: true, data: payload });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/registrants/:id - Update document status
app.patch('/api/registrants/:id', async (req, res) => {
  const ctx = getSupabaseAdminClient();
  if (!ctx) {
    return res.status(503).json({ success: false, error: 'Supabase client not initialized' });
  }

  const { id } = req.params;
  const { dokumen } = req.body;

  try {
    const { error } = await ctx.client
      .from(ctx.table)
      .update({ dokumen: dokumen === 'Terlampir' ? 'Terlampir' : 'Belum Terlampir' })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.json({ success: true, id, dokumen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/registrants/:id - Delete registrant
app.delete('/api/registrants/:id', async (req, res) => {
  const ctx = getSupabaseAdminClient();
  if (!ctx) {
    return res.status(503).json({ success: false, error: 'Supabase client not initialized' });
  }

  const { id } = req.params;

  try {
    const { error } = await ctx.client.from(ctx.table).delete().eq('id', id);
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.json({ success: true, id });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
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
