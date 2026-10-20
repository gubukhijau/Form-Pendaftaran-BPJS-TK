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

function getStoredSupabaseConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        return {
          url: parsed.url || '',
          anonKey: parsed.anonKey || '',
          tableName: parsed.tableName || 'pendaftar_bpjs_bpu',
          isEnabled: Boolean(parsed.isEnabled && parsed.url && parsed.anonKey),
          lastSyncedAt: parsed.lastSyncedAt
        };
      }
    }
  } catch (err) {
    console.warn('Error reading config file:', err);
  }

  const envUrl = process.env.VITE_SUPABASE_URL || '';
  const envKey = process.env.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: envUrl,
    anonKey: envKey,
    tableName: 'pendaftar_bpjs_bpu',
    isEnabled: Boolean(envUrl && envKey),
    lastSyncedAt: undefined
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
  const config = getStoredSupabaseConfig();
  if (config.isEnabled && config.url && config.anonKey) {
    try {
      const client = createClient(config.url.trim(), config.anonKey.trim(), {
        auth: { persistSession: false }
      });
      const targetTable = config.tableName || 'pendaftar_bpjs_bpu';
      const { data, error } = await client
        .from(targetTable)
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
