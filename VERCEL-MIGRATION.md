# Vercel migration

The frontend now supports signed direct uploads to private Neon storage. Vercel deployment requires:

```dotenv
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND.vercel.app/api
NEXT_PUBLIC_DIRECT_UPLOADS=true
NEXT_PUBLIC_PAYSTACK_TEST_MODE=true
```

Use `false` for the last value only when the backend uses Paystack live credentials. No Neon, database, Paystack secret, or Supabase service-role credential belongs in this frontend.

The complete dashboard steps, environment-file generator, old-file migration status and checks are in the sibling backend's `VERCEL-MIGRATION.md`. Its `npm run vercel:env -- --frontend https://your-frontend.vercel.app --api https://your-backend.vercel.app` command generates this repository's ignored `.env.vercel` for dashboard import. Any prepared `replace-with-...` URLs are placeholders and must be replaced before importing/deploying.

Use the native Next.js preset and Node.js 24.x. `vercel.json` defines installation/build defaults. Environment changes to `NEXT_PUBLIC_` values require rebuilding.
