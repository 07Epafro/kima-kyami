# Ki Ma Kyami

Luxury shoe e-commerce platform built for the Angolan market — payments via IBAN bank transfer to an Angolan bank account.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Prisma ORM) |
| Auth | NextAuth v5 (beta) |
| Email | Resend |
| Images | Cloudinary |
| OCR | Tesseract.js |
| Tests | Vitest |
| Deploy | Vercel (region: gru1 — São Paulo) |

## Local Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/your-org/kima-kyami.git
   cd kima-kyami
   npm install --legacy-peer-deps
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and fill in your values
   ```

3. **Set up the database**
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Start the dev server**
   ```bash
   npm run dev
   # App runs at http://localhost:3000
   ```

5. **Access the admin panel**
   - URL: http://localhost:3000/admin
   - Credentials: see seed output (defined in `prisma/seed.ts`)

## Environment Variables

| Name | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | Public URL of the app |
| `NEXTAUTH_SECRET` | Yes | Secret key for NextAuth (min 32 chars) |
| `RESEND_API_KEY` | Yes | API key for Resend email service |
| `EMAIL_FROM` | Yes | Sender address for transactional emails |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `IBAN_LOJA` | Yes | Angolan IBAN of the store bank account |
| `TITULAR_LOJA` | Yes | Account holder name for payment instructions |
| `NEXT_PUBLIC_URL` | Yes | Public app URL (accessible in browser) |

See `.env.example` for a full template with comments.

## Scripts

| Script | Command | Description |
|---|---|---|
| Dev server | `npm run dev` | Start Next.js in development mode |
| Build | `npm run build` | Production build |
| Tests | `npm run test` | Run Vitest in watch mode |
| Test coverage | `npm run test:coverage` | Coverage report via v8 |
| Type check | `npm run type-check` | TypeScript check without emitting |
| DB push | `npm run db:push` | Push schema to database |
| DB seed | `npm run db:seed` | Seed initial data |
| DB studio | `npm run db:studio` | Open Prisma Studio |

## Project Structure

```
kima-kyami/
├── app/
│   ├── (shop)/          # Public storefront (catalog, product pages, cart)
│   ├── admin/           # Admin dashboard (orders, products, inventory)
│   ├── api/             # API routes
│   │   ├── auth/        # NextAuth handlers
│   │   ├── pagamentos/  # Payment & comprovante endpoints
│   │   └── produtos/    # Product CRUD
│   └── layout.tsx
├── lib/
│   ├── auth.ts          # NextAuth config
│   ├── prisma.ts        # Prisma client singleton
│   └── rate-limit.ts    # In-memory rate limiter
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── components/          # Shared UI components
└── .github/workflows/   # CI pipeline
```

## Payment Flow

Angola does not have widely available card payment gateways, so Ki Ma Kyami uses IBAN bank transfer:

1. **Client places order** — cart is submitted and an order record is created with status `PENDENTE`.
2. **Store IBAN is shown** — the client receives the store's Angolan IBAN (`IBAN_LOJA`) and the exact amount to transfer.
3. **Client uploads comprovante** — after making the transfer, the client uploads a photo of the bank receipt on the order page.
4. **OCR validation** — Tesseract.js reads the comprovante image and attempts to verify the amount and reference number automatically.
5. **Admin confirms** — an admin reviews the comprovante and manually confirms the payment, changing the order status to `PAGO` and triggering a confirmation email via Resend.

## Deploy to Vercel

1. **Connect the repository** in the Vercel dashboard (import from GitHub).
2. **Add all environment variables** from `.env.example` in the Vercel project settings under _Environment Variables_.
3. **Deploy** — Vercel picks up `vercel.json` automatically (region `gru1`, 30 s timeout on the OCR validation endpoint).

> **Note:** The app is deployed to the `gru1` region (São Paulo, Brazil) — the closest Vercel region to Angola with good latency, as Vercel does not yet have an African region.
