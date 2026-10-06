# Tigotek live-office prototype

The preserved Tigotek client portal prototype, including its liquid-glass interface, animated floor selection, FABRIPASS demo project, previews, feedback, approvals and assets.

- Vercel: https://tigotek-live-office.vercel.app
- Repository: https://github.com/iratul825/tigotek-prototype
- Original Sites deployment: https://tigotek-live-office.iratul825.chatgpt.site/
- Developed HQ version: https://tigotek-hq.vercel.app
- Development repository: https://github.com/iratul825/tigotek-development

The original published UI is preserved at local Git tag `prototype-sites-2026-10-04`, commit `456cd2bfaedda9bce638616e24f04f89b10161a9`. The current source adds a Vercel hosting adapter and invitation-only sign-in without replacing that interface. The Sites deployment and its database remain independent.

## Run locally

Requires Node.js 24. Run `npm ci --ignore-scripts`, then `npm run dev`; the local preview is http://127.0.0.1:3184. SQLite and uploaded files live in ignored `.data/`. The preview identity is for loopback development only.

Validation: `npm run build`, `npx tsc --noEmit`, and `node --test tests/server.test.mjs`.

## Deploy to Vercel

Link this directory to **tigotek-live-office**. Build with `node scripts/vercel-build.mjs`, then `vercel deploy --prebuilt --prod`.

The Vercel deployment uses its own Neon database/Auth instance and private Blob store. Required environment variables: `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `BLOB_READ_WRITE_TOKEN`, and `PORTAL_OWNER_EMAIL`. Add the production domain to Neon Auth trusted origins. Never commit credentials or `.env*` values.

The owner creates an account using the configured owner email, verifies the address, and adds client emails using **Client access**. Invited users can create their accounts. The connected preview discussion is shared; the original dashboard state, approvals and uploaded assets remain scoped to each signed-in account. The starting project metrics are demo data, not automatic Vercel deployment progress.

The adapter enforces verified membership, rejects spoofed identity headers and cross-origin writes, and serves private uploads only after checking ownership. File uploads should be no larger than 3.5 MB on Vercel.
