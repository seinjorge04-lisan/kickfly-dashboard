// pages/api/sales.js
// Called by the frontend to get combined sales from Clover + Stripe

import { getCloverSales } from '../../lib/clover';
import { getStripeSales } from '../../lib/stripe';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Accept ?start=YYYY-MM-DD&end=YYYY-MM-DD
  // If not provided, default to current period (1st–15th or 16th–end of month)
  let { start, end } = req.query;

  const now = new Date();

  if (!start || !end) {
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    if (day <= 15) {
      // First half
      start = new Date(year, month, 1).toISOString().split('T')[0];
      end = new Date(year, month, 15, 23, 59, 59).toISOString().split('T')[0];
    } else {
      // Second half
      start = new Date(year, month, 16).toISOString().split('T')[0];
      end = new Date(year, month + 1, 0, 23, 59, 59).toISOString().split('T')[0];
    }
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);

  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  const startTs = Math.floor(startMs / 1000);
  const endTs = Math.floor(endMs / 1000);

  const results = { start, end, clover: null, stripe: null, errors: [] };

  // Fetch Clover
  try {
    results.clover = await getCloverSales(startMs, endMs);
  } catch (e) {
    results.errors.push({ source: 'clover', message: e.message });
  }

  // Fetch Stripe
  try {
    results.stripe = await getStripeSales(startTs, endTs);
  } catch (e) {
    results.errors.push({ source: 'stripe', message: e.message });
  }

  // Combined totals
  const totalGross =
    (results.clover?.grossSales || 0) + (results.stripe?.grossSales || 0);
  const totalNet =
    (results.clover?.netSales || 0) + (results.stripe?.netSales || 0);

  results.combined = {
    grossSales: totalGross,
    netSales: totalNet,
  };

  return res.status(200).json(results);
}
