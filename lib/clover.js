const CLOVER_BASE = 'https://api.clover.com/v3';

export async function getCloverSales(startMs, endMs) {
  const merchantId = process.env.CLOVER_MERCHANT_ID;
  const token = process.env.CLOVER_API_TOKEN;

  if (!merchantId || !token) {
    throw new Error('Missing CLOVER_MERCHANT_ID or CLOVER_API_TOKEN env vars');
  }

  const url = `${CLOVER_BASE}/merchants/${merchantId}/payments?filter=createdTime>=${startMs}&filter=createdTime<=${endMs}&limit=1000`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Clover API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const payments = data.elements || [];

  let grossSales = 0;
  let refunds = 0;

  for (const payment of payments) {
    if (payment.result === 'SUCCESS') {
      grossSales += payment.amount || 0;
      refunds += payment.refundAmount || 0;
    }
  }

  return {
    source: 'clover',
    label: 'Store (Clover)',
    grossSales: grossSales / 100,
    netSales: (grossSales - refunds) / 100,
    refunds: refunds / 100,
    discounts: 0,
    orderCount: payments.length,
  };
}
