# Saleor Telegram Mini App (React + TypeScript)

A modern Telegram Mini App for restaurant and retail ordering, powered by Saleor’s GraphQL API. This project replaces the legacy vanilla JS implementation with Vite, React, and TypeScript, and is optimized for static hosting on Cloudflare Pages. Telegram Mini App features are implemented via the official `@tma.js/sdk-react` package, keeping the UI responsive to Telegram themes, buttons, and viewport management.

---

## Features

- **Saleor-first ordering experience** – browse collections (stores), filter by product categories, and submit order drafts to Saleor.
- **Telegram-native UX** – integrates the Telegram main/back buttons, theme parameters, viewport management, and init data for authentication.
- **Static hosting ready** – ships as a pure frontend bundle without server-side code, making it ideal for Cloudflare Pages.
- **Cloudflare-friendly workflows** – environment variable management, build commands, and deployment automation patterns adapted from the [Acceptto/telegram-miniapp-scaffold](https://github.com/Acceptto/telegram-miniapp-scaffold).

---

## Project structure

```saleor-tma-v2/README.md#L33-54
saleor-tma-v2/
├── docs/                     # Reserved for future documentation and media
├── src/
│   ├── App.tsx              # Main application shell & logic
│   ├── main.tsx             # SDK bootstrap + React entry point
│   └── styles/app.css       # Telegram-compliant styling
├── index.html                # Vite entry HTML
├── package.json              # Scripts and dependency manifest
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite bundler configuration
```

---

## Getting started

### Prerequisites

- Node.js 18+
- npm 9+ (or pnpm / yarn, update the commands accordingly)
- A Saleor environment (e.g., https://demo.saleor.io)
- A Telegram bot with Mini App access (`/newapp` via @BotFather)

### Installation

```saleor-tma-v2/README.md#L71-75
npm install
```

### Environment variables

Create a `.env` (or `.env.local`) file in the project root to override defaults:

```saleor-tma-v2/README.md#L79-88
VITE_SALEOR_API_URL=https://demo.saleor.io/graphql/
VITE_SALEOR_CHANNEL=default-channel
VITE_SALEOR_DOCS_URL=https://docs.saleor.io
```

Optional variables you may add later:

- `VITE_SALEOR_CHANNEL` – target Saleor channel for product availability (defaults to `default-channel`).
- `VITE_TG_BOT_USERNAME` – can be used if you surface deep links to the bot inside the Mini App.

> Vite automatically exposes variables prefixed with `VITE_` to the client bundle.

### Running locally

```saleor-tma-v2/README.md#L96-100
npm run dev
```

- Local dev server defaults to `http://localhost:5173`.
- The app gracefully degrades when accessed outside Telegram, which makes browser testing possible.
- To test Telegram-specific flows, expose the dev server through a tunnel (e.g., DevTunnel, ngrok). Bots require HTTPS endpoints.

### Telegram Mini App testing workflow

1. Run the dev server (`npm run dev`).
2. Start a tunnel and obtain a persistent HTTPS URL (`https://<subdomain>.devtunnels.ms`).
3. In @BotFather:
   - `/setdomain` → provide the tunnel URL (or Cloudflare Pages URL in production).
   - `/setmenubutton` → select “Web App” and attach the Mini App URL.
4. Open the bot in Telegram, tap the Mini App shortcut, and verify UI + order flows.

---

## Build & quality checks

```saleor-tma-v2/README.md#L117-123
npm run build   # Type-check + production build (outputs to dist/)
npm run preview # Preview the production build locally
```

The build script runs `tsc -b` prior to `vite build`, ensuring type-safety before producing the final bundle.

---

## Deployment to Cloudflare Pages

The deployment process mirrors the best practices from the Acceptto scaffold, simplified for a static-only project.

### 1. Prepare Cloudflare

- Create a Cloudflare account and a new Pages project (Pages → Create Project).
- If you plan to deploy via CI, generate an API token with:
  - **Account: Cloudflare Pages — Edit**
  - **Account: Workers Scripts — Edit** (optional, but useful if you later add a worker)
  - **Account: D1 — Edit** (optional, mirrors Acceptto’s token scope for future backend needs)

### 2. Connect repository or upload

- **Git-backed workflow:** connect the GitHub repo containing this project. Cloudflare Pages will auto-build on `main` (or the branch you specify).
- **Manual workflow:** run `npm run build` locally and deploy with `npx wrangler pages deploy dist`.

### 3. Configure build settings

| Setting            | Value                |
|--------------------|----------------------|
| Build command       | `npm run build`      |
| Build output folder | `dist`               |
| Node version        | `18.x`               |

Set environment variables for production in Pages → Settings → Environment Variables:

- `VITE_SALEOR_API_URL`
- `VITE_SALEOR_CHANNEL`
- `VITE_SALEOR_DOCS_URL`

If you need separate staging settings, use the Preview environment variables panel.

### 4. Optional: GitHub Actions automation

If you prefer a CI pipeline similar to Acceptto’s template:

1. Create GitHub secrets:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
2. Add a workflow that runs on pushes to `main`, installs dependencies, runs tests/builds, and deploys via `wrangler pages deploy dist`.

```saleor-tma-v2/README.md#L162-195
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npx wrangler pages deploy dist \
          --project-name "<your-pages-project>" \
          --branch "${GITHUB_REF##*/}"
        env:
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

Replace `<your-pages-project>` with the name assigned in Cloudflare.

### 5. Update BotFather

Once Pages finishes its first deployment:

1. `/setdomain` → use the production URL (`https://your-project.pages.dev` or custom domain).
2. `/setmenubutton` → choose “Web App”, set the same URL, and provide the app name/icon if prompted.
3. Share `t.me/<bot_username>` with users; they’ll see the Mini App button in the chat header.

---

## Environment-specific behavior

- The app relies on Telegram init data to authenticate users when opened inside Telegram. In non-Telegram contexts, it still operates as a browsing UI but will create anonymous order drafts.
- GraphQL requests include the optional `Authorization: tma <initDataRaw>` header if init data is present. That matches Saleor’s default TMA authentication middleware pattern.

---

## Security notes

- Validate Telegram init data in Saleor (or a proxy) before trusting IDs or user metadata. This app sends it as `tma <rawInitData>` for backend verification.
- When deploying to production, configure CSP headers via Cloudflare Pages’ `_headers` file if you need additional script/style restrictions.
- If you extend the project with a Cloudflare Worker (for signature validation, order orchestration, etc.), reuse the token scopes recommended by the Acceptto scaffold.

---

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| Blank screen in Telegram | Ensure `VITE_SALEOR_API_URL` is reachable from Cloudflare and that `/setdomain` in @BotFather matches your hosted URL |
| Main button never appears | Add at least one item to the cart; inside Telegram ensure the Web App is in full-screen mode so buttons can mount |
| Checkout link fails to open | Telegram might block external links in testing environments; fallback to opening in a new tab works only when not sandboxed |
| Products/categories empty | Confirm Saleor channel contains collections and products. Try the Saleor demo channel or check API credentials |

---

## Next steps

- Introduce internationalization (follow Telegram locale from `useLaunchParams`).
- Persist carts locally per user (e.g., using `miniApp.storage` or a backend Worker).
- Add order history by storing completed checkouts in a dedicated Saleor app or Cloudflare D1 database.
- Integrate payments or tips by guiding users to Saleor’s checkout and adding metadata for order routing.

---

## License

This project is distributed under the MIT License. Consult `LICENSE` for details.