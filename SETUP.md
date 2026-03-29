# RX Skin — Local Dev Setup

Run these commands once from the `rx-skin` folder on your Windows machine.

---

## Step 1 — Install dependencies

Open PowerShell or Terminal in this folder, then:

```powershell
npm install
```

---

## Step 2 — Configure environment variables

```powershell
copy .env.example .env.local
```

Open `.env.local` and fill in your ConnectWise API credentials:

```
CW_BASE_URL=https://na.myconnectwise.net/v4_6_release/apis/3.0
CW_COMPANY_ID=rxtech          # your CW company ID
CW_CLIENT_ID=                  # from developer.connectwise.com
CW_PUBLIC_KEY=                 # from your CW API member
CW_PRIVATE_KEY=                # from your CW API member
DATABASE_URL=postgresql://...  # Supabase connection string (Phase 2)
NEXTAUTH_SECRET=               # run: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3001
ENCRYPTION_KEY=                # run: openssl rand -hex 32
```

---

## Step 3 — Start the dev server

```powershell
npm run dev
```

Open your browser to: **http://localhost:3001**

---

## Step 4 — Push to GitHub (one-time)

```powershell
git init
git branch -M main
git add .
git commit -m "feat: initial scaffold — RX Skin ConnectWise frontend portal"
```

Create a new **private** repo at https://github.com/new named `rx-skin`
(do NOT initialize it with a README), then:

```powershell
git remote add origin https://github.com/travislbrown/rx-skin.git
git push -u origin main
```

---

## Getting CW API credentials

1. In ConnectWise Manage: **System → Members → New Member**
2. Member Type: **API**
3. Note the **Public Key** and **Private Key**
4. Register your Client ID at: https://developer.connectwise.com

---

## Notes

- `.env.local` is git-ignored — never commit it
- App runs on port **3001** (not 3000)
- Database (Prisma/Supabase) is not required for Phase 1 UI work
