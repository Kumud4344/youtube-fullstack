# Vidora

Modern video-sharing and social platform built with Next.js, TypeScript, MongoDB, and Mongoose.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- MongoDB / Mongoose
- Zod + React Hook Form
- TanStack Query + Zustand
- JWT HTTP-only cookies
- Regional email/mobile OTP

## Getting started

1. Copy env file:

```bash
cp .env.example .env.local
```

2. Ensure MongoDB is running and `MONGODB_URI` is set.

3. Install and run:

```bash
npm install
npm run dev:all
```

`dev:all` runs Next.js (`:3000`) and the Socket.IO signaling server (`:3001`). For Next only, use `npm run dev`.

4. Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — Next.js development server
- `npm run dev:socket` — WebRTC signaling server (Socket.IO)
- `npm run dev:all` — Next.js + signaling together
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript check
- `npm run test` — Vitest unit tests

## Development modes

Configured via `.env.local`:

- `EMAIL_MODE=development` — OTP/emails logged server-side
- `SMS_MODE=mock` — SMS OTP logged (message body redacted except OTP log in non-prod)
- `LOCATION_MODE=mock` — uses `MOCK_LOCATION_*`
- `VIDEO_STORAGE_DRIVER=local` — local storage driver (Phase 2+)
- `PAYMENT_MODE=test` — Razorpay test mode (Phase 4)

## Phase status

- Phase 1 (Foundation): complete
- Phase 2 (Video): complete
- Phase 3 (Social): complete
- Phase 4 (Plans): complete
- Phase 5 (Downloads): complete — secure download endpoint, free daily limit, downloads page
- Phase 6 (Gestures): pending (skipped for now)
- Phase 7 (Friends & Calls): complete — friend requests, presence, Socket.IO signaling, WebRTC video calls
- Phase 8+ : pending
