# Admin Panel Setup

The admin panel lives at `/admin` and runs inside the same Next.js app that
serves the public site. There's no separate service to host. Auth is
Supabase Auth; the data layer is the same Supabase project the public site
uses.

## 1. Create an admin user in Supabase

1. Open the Supabase dashboard for the project.
2. **Authentication → Users → Add user → Create new user**.
3. Enter the team email and a strong password.
4. Click **Create user**.

## 2. Disable public sign-ups (important)

With public sign-ups disabled, the `authenticated` Supabase role is
effectively the admin role — anyone with credentials gets full CRUD.

1. **Authentication → Providers → Email** (or **Sign In / Up**, depending
   on your dashboard version).
2. Turn **off** "Allow new users to sign up".
3. Save.

## 3. Apply the admin RLS policies

1. **SQL Editor → New query**.
2. Paste the contents of `supabase/admin-policies.sql`.
3. Run.
4. Expected result: "Success. No rows returned."

Re-run any time the schema changes — the file is idempotent.

## 4. Set environment variables

The Supabase URL and anon key are inlined into the client bundle by
`next build`, so they have to be available **at build time**, not just at
runtime.

### Cloudflare Workers Builds (production)

In the Cloudflare dashboard → Workers & Pages → motolinkers → Settings →
**Variables and Secrets**, add as plain environment variables (NOT
secrets — they're public by definition):

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key from Supabase → Settings → API>
```

Either `NEXT_PUBLIC_SUPABASE_ANON_KEY` or the newer
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` works; the code accepts both.

Do **not** add `SUPABASE_SERVICE_ROLE_KEY` or `DATABASE_URL` — nothing in
the codebase reads them, and the service-role key would bypass RLS.

### Local dev

Create `.env.local` at the repo root (already in `.gitignore`):

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```

## 5. Test the admin

```bash
pnpm install
pnpm dev
```

Then in a browser:

1. `http://localhost:3000/admin` → should redirect to `/admin/login`.
2. Sign in with the email and password from step 1.
3. You should land on the dashboard with vehicle / news / lead counts.

Admin pages:

- `/admin` — dashboard
- `/admin/vehicles` — list / create / edit / delete vehicles (sees
  unpublished rows too)
- `/admin/news` — list / create / edit / delete news articles
- `/admin/leads` — read & delete contact-form submissions
- `/admin/calculator` — edit the calculator config row

Any save in the admin calls `revalidatePath` on the affected public route,
so the OpenNext incremental cache (R2) is busted immediately and the
public site reflects the change on the next request.

### Auth model

There is no `proxy.ts` / `middleware.ts` file. Next.js 16's `proxy` runs on
the Node.js runtime by default, which `@opennextjs/cloudflare` doesn't
support, so the auth check happens at the layout level instead:

- `src/app/(admin)/admin/(protected)/layout.tsx` redirects unauthenticated
  users to `/admin/login`.
- `src/app/(admin)/admin/login/page.tsx` redirects already-authenticated
  users back to `/admin`.

Both checks call `await supabase.auth.getUser()`, which `@supabase/ssr`
uses to refresh the session as a side effect — same outcome as a
middleware-based refresh.

## 6. Deploy

The admin panel deploys with the rest of the site — push to the branch
that Workers Builds is wired to (typically `main`). Once the build
finishes the admin is reachable at `https://motolinkers.com/admin`.

## 7. Adding more admin users

Repeat step 1 in the Supabase dashboard for each new admin email. Sign-ups
remain disabled, so only users you explicitly create can log in.
