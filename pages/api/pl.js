// pages/api/pl.js
// Combines sales + expenses into a P&L for a given period

import { getCloverSales } from '../../lib/clover';
import { getStripeSales } from '../../lib/stripe';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'expenses.json');

function getExpenses(period) {
  try {
    if (!fs.existsSync(DATA_FILE)) return { items: [], total: 0 };
    const all = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return all[period] || { items: [], total: 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  let { start, end } = req.query;
  if (!start || !end) {
    const now = new Date();
    const y = now.getFullYear(), mo = now.getMonth(), d = now.getDate();
    if (d <= 15) {
      start = new Date(y, mo, 1).toISOString().split('T')[0];
      end = new Date(y, mo, 15).toISOString().split('T')[0];
    } else {
      start = new Date(y, mo, 16).toISOString().split('T')[0];
      end = new Date(y, mo + 1, 0).toISOString().split('T')[0];
    }
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);
  const startMs = startDate.getTime(), endMs = endDate.getTime();
  const startTs = Math.floor(startMs / 1000), endTs = Math.floor(endMs / 1000);
  const period = `${start}_${end}`;

  const pl = { period, start, end, income: {}, expenses: {}, summary: {}, errors: [] };

  // Income
  try {
    pl.income.clover = await getCloverSales(startMs, endMs);
  } catch (e) { pl.errors.push({ source: 'clover', message: e.message }); }

  try {
    pl.income.stripe = await getStripeSales(startTs, endTs);
  } catch (e) { pl.errors.push({ source: 'stripe', message: e.message }); }

  const totalIncome =
    (pl.income.clover?.netSales || 0) + (pl.income.stripe?.netSales || 0);

  // Expenses
  const expData = getExpenses(period);
  pl.expenses = expData;

  // Summary
  const totalExpenses = expData.total || 0;
  pl.summary = {
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    margin: totalIncome > 0
      ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1)
      : '0',
  };

  return res.status(200).json(pl);
}
