// lib/stripe.js
// Fetches sales data from Stripe API

import Stripe from 'stripe';

export async function getStripeSales(startTs, endTs) {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY env var');
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });

  // Fetch balance transactions in range
  const transactions = await stripe.balanceTransactions.list({
    created: { gte: startTs, lte: endTs },
    limit: 100,
    type: 'charge',
  });

  let grossSales = 0;
  let fees = 0;
  let txCount = 0;

  for (const tx of transactions.data) {
    grossSales += tx.amount;
    fees += tx.fee;
    txCount++;
  }

  // Also get refunds
  const refundTxs = await stripe.balanceTransactions.list({
    created: { gte: startTs, lte: endTs },
    limit: 100,
    type: 'refund',
  });

  let refunds = 0;
  for (const tx of refundTxs.data) {
    refunds += Math.abs(tx.amount);
  }

  // Stripe amounts in cents
  return {
    source: 'stripe',
    label: 'Online (Stripe)',
    grossSales: grossSales / 100,
    netSales: (grossSales - refunds) / 100,
    refunds: refunds / 100,
    fees: fees / 100,
    transactionCount: txCount,
  };
}
