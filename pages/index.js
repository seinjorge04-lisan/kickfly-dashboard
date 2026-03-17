// pages/index.js
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

const EXPENSE_CATEGORIES = [
  'Inventory / merchandise',
  'Rent',
  'Payroll & commissions',
  'Marketing & advertising',
  'POS / systems',
  'Packaging & bags',
  'Shipping & labels',
  'Other expenses',
];

function fmt(n) {
  if (n === undefined || n === null) return '—';
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtSign(n) {
  if (n === undefined || n === null) return '—';
  return (n < 0 ? '-' : '') + fmt(n);
}

function getPeriodLabel(start, end) {
  if (!start || !end) return '';
  const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${s} – ${e}`;
}

function getCurrentPeriods() {
  const now = new Date();
  const y = now.getFullYear(), mo = now.getMonth(), d = now.getDate();
  const periods = [];
  // Current period
  if (d <= 15) {
    periods.push({
      label: 'Current (1st–15th)',
      start: new Date(y, mo, 1).toISOString().split('T')[0],
      end: new Date(y, mo, 15).toISOString().split('T')[0],
    });
  } else {
    periods.push({
      label: 'Current (16th–end)',
      start: new Date(y, mo, 16).toISOString().split('T')[0],
      end: new Date(y, mo + 1, 0).toISOString().split('T')[0],
    });
  }
  // Previous period
  if (d <= 15) {
    periods.push({
      label: 'Previous (16th–end)',
      start: new Date(y, mo - 1, 16).toISOString().split('T')[0],
      end: new Date(y, mo, 0).toISOString().split('T')[0],
    });
  } else {
    periods.push({
      label: 'Previous (1st–15th)',
      start: new Date(y, mo, 1).toISOString().split('T')[0],
      end: new Date(y, mo, 15).toISOString().split('T')[0],
    });
  }
  return periods;
}

export default function Home() {
  const [tab, setTab] = useState('overview');
  const [pl, setPl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [periods] = useState(getCurrentPeriods);
  const [selectedPeriod, setSelectedPeriod] = useState(0);
  const [expenses, setExpenses] = useState(
    EXPENSE_CATEGORIES.map(label => ({ label, amount: '' }))
  );
  const [savingExpenses, setSavingExpenses] = useState(false);
  const [expenseSaved, setExpenseSaved] = useState(false);

  const period = periods[selectedPeriod];

  const fetchPL = useCallback(async () => {
    if (!period) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pl?start=${period.start}&end=${period.end}`);
      const data = await res.json();
      setPl(data);
      // Pre-fill expenses if they exist
      if (data.expenses?.items?.length) {
        const filled = EXPENSE_CATEGORIES.map(label => {
          const found = data.expenses.items.find(i => i.label === label);
          return { label, amount: found ? String(found.amount) : '' };
        });
        setExpenses(filled);
      } else {
        setExpenses(EXPENSE_CATEGORIES.map(label => ({ label, amount: '' })));
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [period]);

  useEffect(() => { fetchPL(); }, [fetchPL]);

  async function saveExpenses() {
    setSavingExpenses(true);
    const items = expenses
      .filter(e => e.amount && Number(e.amount) > 0)
      .map(e => ({ label: e.label, amount: Number(e.amount) }));
    const periodKey = `${period.start}_${period.end}`;
    await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period: periodKey, items }),
    });
    setSavingExpenses(false);
    setExpenseSaved(true);
    setTimeout(() => setExpenseSaved(false), 2000);
    fetchPL();
  }

  const income = pl?.summary?.totalIncome || 0;
  const expTotal = pl?.summary?.totalExpenses || 0;
  const net = pl?.summary?.netProfit || 0;
  const margin = pl?.summary?.margin || '0';
  const clover = pl?.income?.clover;
  const stripe = pl?.income?.stripe;

  return (
    <div className={styles.wrap}>
      <Head>
        <title>Kickfly Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.brand}>Kickfly</div>
          <div className={styles.brandSub}>
            {period ? getPeriodLabel(period.start, period.end) : ''}
          </div>
        </div>
        <div className={styles.headerRight}>
          <select
            className={styles.periodSel}
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(Number(e.target.value))}
          >
            {periods.map((p, i) => (
              <option key={i} value={i}>{p.label}</option>
            ))}
          </select>
          <button className={styles.refreshBtn} onClick={fetchPL} disabled={loading}>
            {loading ? '...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Nav */}
      <div className={styles.nav}>
        {['overview', 'p&l', 'expenses'].map(t => (
          <button
            key={t}
            className={`${styles.navBtn} ${tab === t ? styles.navActive : ''}`}
            onClick={() => setTab(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {error && (
        <div className={styles.errorBox}>Error: {error}</div>
      )}

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div>
          <div className={styles.metricGrid}>
            <div className={styles.mc}>
              <div className={styles.ml}>Total Revenue</div>
              <div className={styles.mv}>{loading ? '...' : fmt(income)}</div>
              <div className={styles.ms}>
                Store {fmt(clover?.netSales)} · Online {fmt(stripe?.netSales)}
              </div>
            </div>
            <div className={styles.mc}>
              <div className={styles.ml}>Total Expenses</div>
              <div className={styles.mv}>{loading ? '...' : fmt(expTotal)}</div>
            </div>
            <div className={styles.mc}>
              <div className={styles.ml}>Net Profit</div>
              <div className={`${styles.mv} ${net >= 0 ? styles.pos : styles.neg}`}>
                {loading ? '...' : fmtSign(net)}
              </div>
            </div>
            <div className={styles.mc}>
              <div className={styles.ml}>Profit Margin</div>
              <div className={styles.mv}>{loading ? '...' : `${margin}%`}</div>
            </div>
          </div>

          <div className={styles.twoCol}>
            {/* Clover card */}
            <div className={styles.card}>
              <div className={styles.sec}>Store Sales — Clover</div>
              {clover ? (
                <>
                  <div className={styles.bigNum}>{fmt(clover.netSales)}</div>
                  <div className={styles.statRow}>
                    <span>Gross</span><span>{fmt(clover.grossSales)}</span>
                  </div>
                  <div className={styles.statRow}>
                    <span>Discounts</span>
                    <span className={styles.neg}>−{fmt(clover.discounts)}</span>
                  </div>
                  <div className={styles.statRow}>
                    <span>Orders</span><span>{clover.orderCount}</span>
                  </div>
                </>
              ) : (
                <div className={styles.dimText}>{loading ? 'Loading...' : 'No data'}</div>
              )}
            </div>

            {/* Stripe card */}
            <div className={styles.card}>
              <div className={styles.sec}>Online Sales — Stripe</div>
              {stripe ? (
                <>
                  <div className={styles.bigNum}>{fmt(stripe.netSales)}</div>
                  <div className={styles.statRow}>
                    <span>Gross</span><span>{fmt(stripe.grossSales)}</span>
                  </div>
                  <div className={styles.statRow}>
                    <span>Refunds</span>
                    <span className={styles.neg}>−{fmt(stripe.refunds)}</span>
                  </div>
                  <div className={styles.statRow}>
                    <span>Stripe fees</span>
                    <span className={styles.neg}>−{fmt(stripe.fees)}</span>
                  </div>
                  <div className={styles.statRow}>
                    <span>Transactions</span><span>{stripe.transactionCount}</span>
                  </div>
                </>
              ) : (
                <div className={styles.dimText}>{loading ? 'Loading...' : 'No data'}</div>
              )}
            </div>
          </div>

          {pl?.errors?.length > 0 && (
            <div className={styles.warnBox}>
              {pl.errors.map((e, i) => (
                <div key={i}>⚠ {e.source}: {e.message}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* P&L */}
      {tab === 'p&l' && (
        <div className={styles.card}>
          <div className={styles.sec}>
            P&L — {period ? getPeriodLabel(period.start, period.end) : ''}
          </div>
          {loading ? <div className={styles.dimText}>Loading...</div> : (
            <>
              <div className={styles.plRow}>
                <span>Store sales (Clover)</span>
                <span className={styles.pos}>+{fmt(clover?.netSales)}</span>
              </div>
              <div className={styles.plRow}>
                <span>Online sales (Stripe)</span>
                <span className={styles.pos}>+{fmt(stripe?.netSales)}</span>
              </div>
              <div className={`${styles.plRow} ${styles.plTotal}`}>
                <span>Total Revenue</span>
                <span className={styles.pos}>{fmt(income)}</span>
              </div>
              <div style={{ height: 8 }} />
              {(pl?.expenses?.items || []).map((item, i) => (
                <div key={i} className={styles.plRow}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span className={styles.neg}>−{fmt(item.amount)}</span>
                </div>
              ))}
              <div className={`${styles.plRow} ${styles.plTotal}`}>
                <span>Total Expenses</span>
                <span className={styles.neg}>−{fmt(expTotal)}</span>
              </div>
              <div style={{ height: 8 }} />
              <div className={`${styles.plRow} ${styles.plNet}`}>
                <span>Net Result</span>
                <span className={net >= 0 ? styles.pos : styles.neg}>{fmtSign(net)}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* EXPENSES */}
      {tab === 'expenses' && (
        <div className={styles.card}>
          <div className={styles.sec}>
            Enter Expenses — {period ? getPeriodLabel(period.start, period.end) : ''}
          </div>
          <div className={styles.expenseNote}>
            Fill in your expenses for this period. Sales are pulled automatically from Clover and Stripe.
          </div>
          {EXPENSE_CATEGORIES.map((label, i) => (
            <div key={label} className={styles.expenseRow}>
              <label className={styles.expenseLabel}>{label}</label>
              <div className={styles.expenseInputWrap}>
                <span className={styles.dollarSign}>$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={styles.expenseInput}
                  placeholder="0"
                  value={expenses[i].amount}
                  onChange={e => {
                    const updated = [...expenses];
                    updated[i] = { ...updated[i], amount: e.target.value };
                    setExpenses(updated);
                  }}
                />
              </div>
            </div>
          ))}
          <div className={styles.expenseTotal}>
            <span>Total Expenses</span>
            <span>{fmt(expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0))}</span>
          </div>
          <button
            className={styles.saveBtn}
            onClick={saveExpenses}
            disabled={savingExpenses}
          >
            {expenseSaved ? 'Saved!' : savingExpenses ? 'Saving...' : 'Save Expenses'}
          </button>
        </div>
      )}
    </div>
  );
}
