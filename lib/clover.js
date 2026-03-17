// lib/clover.js
// Fetches sales data from Clover API

const CLOVER_BASE = 'https://api.clover.com/v3';

export async function getCloverSales(startMs, endMs) {
  const merchantId = process.env.CLOVER_MERCHANT_ID;
  const token = process.env.CLOVER_API_TOKEN;

  if (!merchantId || !token) {
    throw new Error('Missing CLOVER_MERCHANT_ID or CLOVER_API_TOKEN env vars');
  }

  // Fetch orders in the date range
  const url = `${CLOVER_BASE}/merchants/${merchantId}/orders?filter=createdTime>=${startMs}&filter=createdTime<=${endMs}&expand=lineItems&limit=1000`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Clover API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const orders = data.elements || [];

  // Calculate totals
  let grossSales = 0;
  let refunds = 0;
  let discounts = 0;
  let totalOrders = orders.length;

  for (const order of orders) {
    if (order.state === 'locked' || order.paymentState === 'PAID' || order.paymentState === 'REFUNDED') {
      grossSales += order.total || 0;
      discounts += order.discountAmount || 0;
    }
    if (order.paymentState === 'REFUNDED') {
      refunds += order.total || 0;
    }
  }

  // Clover amounts are in cents
  return {
    source: 'clover',
    label: 'Store (Clover)',
    grossSales: grossSales / 100,
    netSales: (grossSales - refunds - discounts) / 100,
    refunds: refunds / 100,
    discounts: discounts / 100,
    orderCount: totalOrders,
  };
}
