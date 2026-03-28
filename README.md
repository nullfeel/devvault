<div align="center">

<br/>

# DevVault

**Open-source secrets manager for developers.**

AES-256-GCM encryption · Vault organization · Chrome extension · Cyberpunk UI

<br/>

![Next.js](https://img.shields.io/badge/Next.js_14-0d0d0d?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-0d0d0d?style=flat-square&logo=typescript&logoColor=3178c6)
![Tailwind](https://img.shields.io/badge/Tailwind-0d0d0d?style=flat-square&logo=tailwindcss&logoColor=38bdf8)
![Three.js](https://img.shields.io/badge/Three.js-0d0d0d?style=flat-square&logo=threedotjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-0d0d0d?style=flat-square&logo=prisma&logoColor=5a67d8)
![Chrome](https://img.shields.io/badge/Chrome_Extension-0d0d0d?style=flat-square&logo=googlechrome&logoColor=4285F4)

<br/>

> **Note:** This is an early prototype and open-source project. It may contain bugs and is not recommended for production use with real credentials yet. Contributions and feedback are welcome.

</div>

## About

DevVault is a full-stack credentials and secrets manager with a Chrome extension for auto-fill and password management. It features AES-256-GCM encryption, organized vault management, and a cyberpunk-inspired UI with 3D visuals.

## Features

### Web App
- **AES-256-GCM Encryption** — All secrets encrypted at rest
- **Vault Organization** — Group secrets by project, environment, or team
- **Type Classification** — Categorize as passwords, API keys, tokens, or env vars
- **3D Cyberpunk UI** — Immersive interface with Three.js and neon effects
- **Dashboard** — Stats, vault management, secret CRUD
- **Secure Auth** — NextAuth.js with bcrypt and JWT sessions

### Chrome Extension
- **Auto-fill** — Detects login forms and fills credentials
- **Save Prompt** — Asks to save after logging into a site
- **Password Generator** — Configurable length, character types, strength indicator
- **Password Suggestions** — Suggests strong passwords on registration forms
- **Vault Browser** — Browse and copy secrets from the popup
- **Minimal UI** — Clean dark interface inspired by 1Password

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + Framer Motion |
| **3D Graphics** | Three.js + React Three Fiber |
| **Database** | SQLite + Prisma ORM |
| **Auth** | NextAuth.js + bcryptjs |
| **Encryption** | AES-256-GCM (Node.js crypto) |
| **Extension** | Chrome Manifest V3 (vanilla JS) |

## Getting Started

### Web App

```bash
git clone https://github.com/nullfeel/devvault.git
cd devvault

npm install

cp .env.example .env
# Edit .env with your own secrets

npx prisma generate
npx prisma db push

npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Chrome Extension

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Click the DevVault icon in the toolbar and sign in

## Environment Variables

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="generate-a-random-secret"
NEXTAUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="generate-a-random-32-byte-hex"
```

Generate secrets with:
```bash
openssl rand -hex 32
```

## Project Structure

```
devvault/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login & Register
│   │   ├── (dashboard)/         # Dashboard, Vaults, Settings
│   │   └── api/                 # REST API + Extension API
│   ├── components/
│   │   ├── 3d/                  # Three.js scenes
│   │   ├── dashboard/           # Sidebar, nav
│   │   ├── landing/             # Landing page sections
│   │   └── ui/                  # Button, Input, Modal, Toast
│   └── lib/
│       ├── auth.ts              # NextAuth config
│       ├── crypto.ts            # AES-256-GCM encrypt/decrypt
│       ├── ext-auth.ts          # Extension token auth
│       └── prisma.ts            # Database client
├── extension/
│   ├── manifest.json            # Chrome Manifest V3
│   ├── popup.html               # Extension popup
│   └── src/
│       ├── popup.js             # Popup logic
│       ├── popup.css            # Popup styles
│       ├── content.js           # Auto-fill & save prompts
│       ├── background.js        # Service worker
│       └── utils.js             # Shared utilities
└── prisma/
    └── schema.prisma            # Database schema
```

## API Endpoints

### Web App (session auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/change-password` | Change password |
| GET/POST | `/api/vaults` | List/create vaults |
| GET/PUT/DELETE | `/api/vaults/[id]` | Vault CRUD |
| GET/POST | `/api/vaults/[id]/secrets` | List/create secrets |
| PUT/DELETE | `/api/vaults/[id]/secrets/[secretId]` | Secret CRUD |

### Extension (token auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ext/login` | Get auth token |
| GET | `/api/ext/vaults` | List vaults |
| GET/POST | `/api/ext/vaults/[id]/secrets` | Vault secrets |
| GET | `/api/ext/credentials?url=` | Search by URL |
| POST | `/api/ext/credentials` | Quick save credential |

## Known Issues

- SQLite is used for development; use PostgreSQL for production
- Extension auto-fill may not work on all sites (Shadow DOM limitations)
- No data export/import yet
- No browser sync across devices

## Contributing

This is an open-source prototype. Feel free to open issues or submit PRs.

1. Fork the repository
2. Create your branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push and open a Pull Request

## License

MIT

---

<div align="center">

Built by [nullfeel](https://github.com/nullfeel)

</div>
