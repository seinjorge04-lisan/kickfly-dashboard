// pages/api/expenses.js
// GET returns expenses for a period, POST saves new expenses

import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'expenses.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

export default async function handler(req, res) {
  ensureDataFile();

  if (req.method === 'GET') {
    const { period } = req.query; // e.g. "2026-03-01_2026-03-15"
    const all = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (period) {
      return res.status(200).json(all[period] || { items: [], total: 0 });
    }
    return res.status(200).json(all);
  }

  if (req.method === 'POST') {
    // Body: { period: "2026-03-01_2026-03-15", items: [{label, amount}, ...] }
    const { period, items } = req.body;
    if (!period || !items) {
      return res.status(400).json({ error: 'Missing period or items' });
    }
    const all = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    all[period] = { items, total, updatedAt: new Date().toISOString() };
    fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2));
    return res.status(200).json({ ok: true, period, total });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
