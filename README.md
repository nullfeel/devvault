<div align="center">

<br/>

# DevVault

**Open-source secrets manager for developers.**

AES-256-GCM encryption at rest -- vault organization -- Chrome extension with auto-fill -- cyberpunk 3D interface

<br/>

![Next.js](https://img.shields.io/badge/Next.js_14-0d0d0d?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-0d0d0d?style=flat-square&logo=typescript&logoColor=3178c6)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-0d0d0d?style=flat-square&logo=tailwindcss&logoColor=38bdf8)
![Three.js](https://img.shields.io/badge/Three.js-0d0d0d?style=flat-square&logo=threedotjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-0d0d0d?style=flat-square&logo=prisma&logoColor=5a67d8)
![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-0d0d0d?style=flat-square&logo=googlechrome&logoColor=4285F4)

<br/>

> **Early prototype.** This project is under active development and may contain bugs. It is not recommended for production use with real credentials. Contributions and feedback are welcome.

</div>

<br/>

## About

DevVault is a full-stack credentials and secrets manager built with Next.js 14 and a companion Chrome extension. All secrets are encrypted at rest using AES-256-GCM with a derived key (scrypt). The web application provides organized vault management, secret classification by type, and a cyberpunk-themed interface powered by Three.js and React Three Fiber. The Chrome extension enables auto-fill on login forms, credential saving, password generation, and direct vault browsing from the toolbar popup.

## Web App Features

- **AES-256-GCM Encryption** - All secret values are encrypted at rest using a 32-byte key derived via scrypt from the configured encryption key
- **Vault Organization** - Group secrets into named vaults by project, environment, team, or any logical boundary
- **Secret Type Classification** - Categorize entries as passwords, API keys, tokens, environment variables, or other
- **URL Association** - Link secrets to specific URLs for credential matching by the Chrome extension
- **Dashboard Overview** - Aggregated statistics, vault listing, and quick-access secret management
- **Vault Detail View** - Full CRUD for secrets within a vault, including inline reveal and copy
- **User Settings** - Password change and account management from the settings panel
- **Secure Authentication** - NextAuth.js with bcrypt password hashing and JWT-based sessions
- **3D Cyberpunk Interface** - Immersive UI with wireframe spheres, floating particles, cyber grids, and neon effects via Three.js and React Three Fiber
- **Responsive Layout** - Sidebar navigation with collapsible sections, optimized for desktop use

## Chrome Extension Features

- **Auto-fill Detection** - Content script detects login forms on any page and fills saved credentials automatically
- **Credential Save Prompt** - After a successful login, prompts to save new credentials to a vault
- **Password Generator** - Configurable generator with length control, character type toggles, and a visual strength indicator
- **Password Suggestions** - Detects registration forms and suggests strong passwords inline
- **Vault Browser** - Browse all vaults and secrets directly from the popup without opening the web app
- **Copy to Clipboard** - One-click copy for any secret value from the popup
- **Token-Based Auth** - Authenticates against the web app using a dedicated extension login endpoint with persistent token storage
- **Dark Minimal UI** - Clean dark-themed popup interface inspired by modern password managers

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + Framer Motion |
| **3D Graphics** | Three.js + React Three Fiber |
| **Database** | SQLite (dev) / PostgreSQL (prod) + Prisma ORM |
| **Auth** | NextAuth.js + bcryptjs + JWT |
| **Encryption** | AES-256-GCM via Node.js crypto (scrypt key derivation) |
| **Extension** | Chrome Manifest V3, vanilla JavaScript |
| **CORS** | Custom middleware for extension origin handling |

## Installation

### Web App

```bash
git clone https://github.com/nullfeel/devvault.git
cd devvault

npm install

cp .env.example .env
# Edit .env with your own secrets (see Environment Variables below)

npx prisma generate
npx prisma db push

npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the web application.

### Chrome Extension

1. Open `chrome://extensions` in Google Chrome
2. Enable **Developer mode** using the toggle in the top-right corner
3. Click **Load unpacked**
4. Navigate to and select the `extension/` directory inside the project root
5. Pin the DevVault icon in the Chrome toolbar for quick access
6. Click the icon, enter your DevVault server URL (default `http://localhost:3000`)
7. Sign in with your DevVault account credentials
8. The extension will begin detecting login forms and offering auto-fill

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Prisma database connection string. Use `file:./dev.db` for local SQLite or a PostgreSQL URL for production. |
| `NEXTAUTH_SECRET` | Yes | Random secret used by NextAuth.js to sign and encrypt JWT tokens. Must be at least 32 characters. |
| `NEXTAUTH_URL` | Yes | The canonical URL of the application. Set to `http://localhost:3000` for local development. |
| `ENCRYPTION_KEY` | Yes | Master key used to derive the AES-256-GCM encryption key via scrypt. Use a strong random string. |

Generate secure values:

```bash
# Generate a 32-byte hex string for NEXTAUTH_SECRET or ENCRYPTION_KEY
openssl rand -hex 32
```

Example `.env` file:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="your-random-encryption-key-here"
```

## API Reference

### Web App Endpoints (Session Authentication)

These endpoints require an active NextAuth.js session cookie.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth.js authentication handler (login, logout, session) |
| `POST` | `/api/auth/register` | Create a new user account with email and password |
| `POST` | `/api/auth/change-password` | Change the authenticated user's password |
| `GET` | `/api/vaults` | List all vaults belonging to the authenticated user |
| `POST` | `/api/vaults` | Create a new vault with name, description, and icon |
| `GET` | `/api/vaults/[id]` | Retrieve a specific vault and its metadata |
| `PUT` | `/api/vaults/[id]` | Update vault name, description, or icon |
| `DELETE` | `/api/vaults/[id]` | Delete a vault and all its secrets (cascade) |
| `GET` | `/api/vaults/[id]/secrets` | List all secrets in a vault (values decrypted on read) |
| `POST` | `/api/vaults/[id]/secrets` | Create a new secret in a vault (value encrypted on write) |
| `PUT` | `/api/vaults/[id]/secrets/[secretId]` | Update an existing secret's key, value, type, or URL |
| `DELETE` | `/api/vaults/[id]/secrets/[secretId]` | Delete a specific secret |

### Extension Endpoints (Token Authentication)

These endpoints use a bearer token obtained via the extension login route.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ext/login` | Authenticate with email/password and receive a bearer token |
| `GET` | `/api/ext/vaults` | List all vaults for the authenticated extension user |
| `GET` | `/api/ext/vaults/[id]/secrets` | List all secrets in a specific vault |
| `POST` | `/api/ext/vaults/[id]/secrets` | Create a new secret from the extension |
| `GET` | `/api/ext/credentials?url=` | Search for credentials matching a given URL |
| `POST` | `/api/ext/credentials` | Quick-save a credential with URL, username, and password |

## Project Structure

```
devvault/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx              # Login page
│   │   │   └── register/page.tsx           # Registration page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                  # Dashboard layout with sidebar
│   │   │   └── dashboard/
│   │   │       ├── page.tsx                # Main dashboard with stats
│   │   │       ├── settings/page.tsx       # User settings
│   │   │       ├── vault/[id]/page.tsx     # Single vault detail view
│   │   │       └── vaults/page.tsx         # All vaults listing
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts  # NextAuth handler
│   │   │   │   ├── register/route.ts       # User registration
│   │   │   │   └── change-password/route.ts
│   │   │   ├── ext/
│   │   │   │   ├── login/route.ts          # Extension token auth
│   │   │   │   ├── credentials/route.ts    # URL-based credential lookup
│   │   │   │   └── vaults/
│   │   │   │       ├── route.ts            # Extension vault listing
│   │   │   │       └── [id]/secrets/route.ts
│   │   │   └── vaults/
│   │   │       ├── route.ts               # Vault CRUD
│   │   │       └── [id]/
│   │   │           ├── route.ts           # Single vault operations
│   │   │           └── secrets/
│   │   │               ├── route.ts       # Secret listing/creation
│   │   │               └── [secretId]/route.ts
│   │   ├── layout.tsx                     # Root layout
│   │   └── page.tsx                       # Landing page
│   ├── components/
│   │   ├── 3d/
│   │   │   ├── CyberGrid.tsx             # Animated grid plane
│   │   │   ├── CyberScene.tsx            # Main 3D scene wrapper
│   │   │   ├── FloatingParticles.tsx      # Particle system
│   │   │   ├── ParticleField.tsx          # Dense particle background
│   │   │   └── WireframeSphere.tsx        # Animated wireframe sphere
│   │   ├── dashboard/
│   │   │   └── Sidebar.tsx               # Navigation sidebar
│   │   ├── landing/
│   │   │   ├── CTA.tsx                   # Call-to-action section
│   │   │   ├── Features.tsx              # Feature showcase
│   │   │   ├── Footer.tsx                # Landing footer
│   │   │   ├── Hero.tsx                  # Hero section with 3D
│   │   │   ├── HowItWorks.tsx            # Step-by-step section
│   │   │   └── Navbar.tsx                # Landing navigation
│   │   └── ui/
│   │       ├── Button.tsx                # Reusable button component
│   │       ├── Input.tsx                 # Form input component
│   │       ├── Modal.tsx                 # Modal dialog
│   │       └── Toast.tsx                 # Notification toasts
│   └── lib/
│       ├── auth.ts                       # NextAuth configuration
│       ├── cors.ts                       # CORS middleware for extension
│       ├── crypto.ts                     # AES-256-GCM encrypt/decrypt
│       ├── ext-auth.ts                   # Extension token verification
│       └── prisma.ts                     # Prisma client singleton
├── extension/
│   ├── manifest.json                     # Chrome Manifest V3 config
│   ├── popup.html                        # Extension popup HTML
│   ├── icons/
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── src/
│       ├── popup.js                      # Popup UI logic
│       ├── popup.css                     # Popup styles
│       ├── content.js                    # Auto-fill and save detection
│       ├── content.css                   # Injected page styles
│       ├── background.js                 # Service worker
│       └── utils.js                      # Shared extension utilities
├── prisma/
│   └── schema.prisma                     # Database schema (User, Vault, Secret)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

## Database Schema

The application uses three models:

- **User** - Stores account credentials (email, bcrypt-hashed password) and owns vaults
- **Vault** - Named container for secrets with optional description and icon, cascade-deletes secrets
- **Secret** - Encrypted key-value pair with a type enum (`PASSWORD`, `API_KEY`, `TOKEN`, `ENV_VAR`, `OTHER`) and optional URL for credential matching

## Screenshots

### Landing Page

*Screenshot placeholder*

### Dashboard

*Screenshot placeholder*

### Vault Detail View

*Screenshot placeholder*

### Chrome Extension Popup

*Screenshot placeholder*

### Auto-fill in Action

*Screenshot placeholder*

## Requirements

- Node.js 18+
- npm or yarn
- Google Chrome (for the extension)
- OpenSSL (for generating secrets)

## Known Issues

- SQLite is used for development; switch to PostgreSQL for production deployments
- Extension auto-fill may not work on sites that use Shadow DOM or non-standard form elements
- No data export or import functionality yet
- No cross-device browser sync for the extension
- The extension currently requires the web app to be running on the same network
- 3D scenes may cause performance issues on lower-end hardware

## Contributing

This is an open-source prototype. Contributions are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes and ensure they work with both the web app and extension
4. Commit your changes with a descriptive message
5. Push to your fork and open a Pull Request

When submitting a PR, please include:
- A description of what the change does
- Steps to test the change
- Screenshots if the change affects the UI

## License

MIT

---

<div align="center">

Built by [nullfeel](https://github.com/nullfeel)

</div>
