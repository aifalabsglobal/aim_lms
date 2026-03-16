# AIM LMS

AIM LMS is a learning and training management platform built with Next.js, Clerk authentication, and Microsoft Graph integrations for training sessions, recordings, and attendance intelligence.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Clerk (authentication)
- Prisma + Neon Postgres
- Microsoft Graph API (Teams meetings, recordings, attendees)

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env.local`:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SIGNING_SECRET`
- `DATABASE_URL`
- `ADMIN_EMAILS`
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`
- `AZURE_TENANT_ID`

3. Generate Prisma client and sync schema:

```bash
npm run db:generate
npm run db:push
```

4. Start development server:

```bash
npm run dev
```

## Key Features

- Secure sign-in/sign-up with Clerk
- Role-aware API access patterns
- Training listing with search, date filtering, and pagination
- Training detail pages with recordings and meeting participant views
- In-app recording playback via protected stream endpoint
- Graph diagnostics panel to troubleshoot tenant permissions and meeting resolution

## Notes

- Teams meeting artifact and attendance endpoints require Graph app permissions and Teams application access policy configuration.
- Some external recording hosts block iframe embedding; AIM LMS uses in-app streaming where artifact URLs are available.
