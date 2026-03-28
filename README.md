<div align="center">

<br/>

# DevVault

**Military-grade secrets management for developers.**

AES-256-GCM encryption · Vault organization · Team sharing · Terminal UI

<br/>

![Next.js](https://img.shields.io/badge/Next.js_14-0d0d0d?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-0d0d0d?style=flat-square&logo=typescript&logoColor=3178c6)
![Tailwind](https://img.shields.io/badge/Tailwind-0d0d0d?style=flat-square&logo=tailwindcss&logoColor=38bdf8)
![Three.js](https://img.shields.io/badge/Three.js-0d0d0d?style=flat-square&logo=threedotjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-0d0d0d?style=flat-square&logo=prisma&logoColor=5a67d8)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0d0d0d?style=flat-square&logo=framer&logoColor=00FFFF)

<br/>

</div>

## About

DevVault is a full-stack credentials and secrets manager built for developers who take security seriously. It features AES-256-GCM encryption, organized vault management, and a cyberpunk-inspired UI with 3D visuals.

## Features

- **AES-256-GCM Encryption** — Military-grade encryption for all stored secrets
- **Vault Organization** — Group secrets by project, environment, or team
- **3D Cyberpunk UI** — Immersive interface with Three.js, glassmorphism, and neon effects
- **Terminal Aesthetic** — HUD-style dashboard with real-time stats
- **Type Classification** — Categorize secrets as passwords, API keys, tokens, or env vars
- **Secure Auth** — NextAuth.js with bcrypt password hashing and JWT sessions
- **Responsive** — Fully responsive design from mobile to desktop

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + Framer Motion |
| **3D Graphics** | Three.js + React Three Fiber + Drei |
| **Database** | SQLite + Prisma ORM |
| **Auth** | NextAuth.js + bcryptjs |
| **Encryption** | AES-256-GCM (Node.js crypto) |

## Getting Started

```bash
# Clone the repository
git clone https://github.com/nullfeel/devvault.git
cd devvault

# Install dependencies
npm install

# Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="your-32-byte-hex-key"
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login & Register pages
│   ├── (dashboard)/     # Dashboard & Vault pages
│   ├── api/             # API routes (auth, vaults, secrets)
│   └── page.tsx         # Landing page
├── components/
│   ├── 3d/              # Three.js 3D components
│   ├── dashboard/       # Dashboard components
│   ├── landing/         # Landing page sections
│   └── ui/              # Reusable UI components
└── lib/
    ├── auth.ts          # NextAuth configuration
    ├── crypto.ts        # AES-256 encryption utilities
    └── prisma.ts        # Prisma client singleton
```

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nullfeel/devvault)

> **Note:** For production, use PostgreSQL instead of SQLite and set secure environment variables.

## License

MIT

---

<div align="center">

Built by [nullfeel](https://github.com/nullfeel)

</div>
