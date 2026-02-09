# FoodJourney

Aplikasi catatan kuliner berdua (Hasbi & Nadya) dengan:
- Next.js App Router
- Prisma + PostgreSQL (Neon)
- Auth berbasis cookie session
- Integrasi Gemini buat ekstraksi data tempat
- Cloudflare R2 buat upload foto kunjungan

## 1) Local Setup
### Prasyarat
- Node.js 20+
- npm
- Bun (buat jalanin seed script)
- Database PostgreSQL (Neon direkomendasikan)

### Env
Copy template env:
```bash
cp .env.example .env.local
```

Isi semua variabel di `.env.local`:
- `DATABASE_URL`
- `DIRECT_URL` (opsional, tapi direkomendasikan)
- `AUTH_SECRET`
- `GEMINI_API_KEY`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

### Install & run
```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Buka `http://localhost:3000`.

## 2) Deploy ke Vercel
### Project Settings
- Framework: Next.js
- Build Command: `npm run build`
- Install Command: `npm install`
- Output: default Next.js

### Environment Variables (Production)
Set semua env ini di Vercel Project > Settings > Environment Variables:
- `DATABASE_URL`
- `DIRECT_URL` (opsional, fallback ke `DATABASE_URL` kalau kosong)
- `AUTH_SECRET`
- `GEMINI_API_KEY`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

### Deploy Flow
1. Push branch ke GitHub.
2. Import repo ke Vercel.
3. Set env variables.
4. Deploy.

## 3) Post-Deploy Checklist
1. Jalankan migrasi schema ke database production:
```bash
npm run db:push
```
2. Seed data awal (users + config password):
```bash
npm run db:seed
```
3. Cek login Hasbi/Nadya.
4. Cek upload foto (R2).
5. Cek fitur pesan 1 baris di halaman `Rencana`.

## 4) Security Notes
- Jangan commit `.env`, `.env.local`, atau secret apa pun.
- Rotate key kalau pernah ketulis di repo/commit lama.
- `AUTH_SECRET` wajib random kuat (minimal 32 bytes).

## 5) Troubleshooting Cepat
- Error auth/session: pastiin `AUTH_SECRET` terisi.
- Error database: cek `DATABASE_URL` / `DIRECT_URL`.
- Error upload foto: cek semua env `R2_*`.
- Error Gemini: cek `GEMINI_API_KEY`.
