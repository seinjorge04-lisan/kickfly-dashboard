# Kickfly Dashboard

Live dashboard pulling real sales from Clover (in-store) and Stripe (online), with manual expense entry. Auto-periods on the 1st–15th and 16th–end of month.

---

## Deploy in 5 steps

### Step 1 — GitHub
1. Go to github.com → New repository → name it `kickfly-dashboard` → Create
2. Upload all these files to the repo (drag & drop works)

### Step 2 — Vercel
1. Go to vercel.com → Sign up free (use your GitHub account)
2. Click "Add New Project"
3. Import your `kickfly-dashboard` repo
4. Click Deploy — it will fail (missing env vars) but that's fine

### Step 3 — Add your API keys (SECURE)
In Vercel:
1. Go to your project → Settings → Environment Variables
2. Add these one by one:

| Name | Value |
|------|-------|
| `CLOVER_API_TOKEN` | Your Clover API token |
| `CLOVER_MERCHANT_ID` | Your Clover merchant ID |
| `STRIPE_SECRET_KEY` | Your Stripe secret key (sk_live_...) |

3. Click Save

### Step 4 — Redeploy
In Vercel → Deployments → click the 3 dots on latest → Redeploy

### Step 5 — Open your app
Your dashboard is live at `https://kickfly-dashboard.vercel.app`

Bookmark it. Share it with no one (it has your financial data).

---

## Where to find your keys

### Clover API Token
1. Go to clover.com/developers
2. Log in with your Clover account
3. Go to your merchant → Settings → API Access
4. Generate or copy your API token
5. Your Merchant ID is in the URL: `clover.com/merchants/XXXXXXXX`

### Stripe Secret Key
1. Go to dashboard.stripe.com
2. Click Developers (top right)
3. Click API Keys
4. Copy the Secret key (starts with sk_live_)

---

## How it works
- Opens to current period (auto-detected: 1st–15th or 16th–end)
- Pulls Clover orders in real time
- Pulls Stripe transactions in real time
- You enter expenses once per period → saved
- P&L tab shows full breakdown

## Local development
```bash
cp .env.example .env.local
# fill in your keys in .env.local
npm install
npm run dev
# open http://localhost:3000
```
