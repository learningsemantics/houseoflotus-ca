# House of Lotus Canada

House of Lotus Canada is a premium hybrid **D2C and B2B platform for Indian coffee in Canada**. It introduces Canadian consumers and businesses to distinctive Indian coffee origins, represents grower partners in the Canadian market, and provides the digital home for House of Lotus ready-to-drink cold brews and botanical elixirs.

This repository contains the first public-facing MVP: a responsive, production-style static storefront designed for deployment on GitHub Pages at [houseoflotus.ca](https://houseoflotus.ca).

> **Current status:** Brand and market-validation MVP. The website is ready for static deployment; transactional commerce, customer accounts, inventory and CRM integrations belong to the next phase.

## Vision

Indian coffee is often presented as a single origin story despite the diversity of its estates, growing regions, cultivars and processing traditions. House of Lotus Canada is being built as the bridge between exceptional Indian producers and Canadian buyers.

The platform has three connected roles:

1. **Origin representation** — introduce selected Indian growers and their coffees to Canadian consumers, cafés, retailers and hospitality buyers.
2. **Consumer commerce** — sell roasted coffee, ready-to-drink cold brew, elixirs, tasting collections and future ritual products directly to Canadian customers.
3. **Wholesale market development** — help cafés, restaurants, specialty retailers, workplaces and hotels discover, evaluate and source differentiated Indian coffee products.

## MVP experience

### D2C

- Premium editorial brand experience
- Cold-brew collection and product storytelling
- Interactive tasting-box selection
- Early-access acquisition pathway
- Responsive navigation and mobile-first layouts
- Future-ready structure for roasted coffee, elixirs and ritual products

### B2B

- Dedicated wholesale positioning
- Buyer pathways for specialty retail, cafés, restaurants, offices and hospitality
- Grower-first sourcing narrative
- Pre-filled wholesale inquiry email
- Foundation for future line sheets, sample requests, buyer pricing and account access

### Brand and content

- Matte-black, copper, saffron-gold and warm-ivory visual system
- Original House of Lotus cold-brew packaging imagery
- Indian-origin positioning adapted for a Canadian audience
- SEO metadata and social-sharing image
- Custom domain configuration for `houseoflotus.ca`

## Technology

| Layer | Implementation |
| --- | --- |
| Framework | Next.js 16 with the App Router |
| Language | TypeScript |
| UI | React 19 |
| Styling | Tailwind CSS 4 plus a custom editorial design system |
| Images | Optimized WebP product assets |
| Output | Fully static export |
| Hosting | GitHub Pages |
| Deployment | GitHub Actions |
| Domain and DNS | Cloudflare Registrar / Cloudflare DNS |

No server, database or secret environment variables are required for the MVP.

## Repository structure

```text
houseoflotus-ca/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml    # GitHub Pages build and deployment
├── app/
│   ├── globals.css             # Complete visual system and responsive styles
│   ├── layout.tsx              # Metadata and root document
│   └── page.tsx                # Storefront content and interactions
├── public/
│   ├── assets/                 # Optimized House of Lotus product imagery
│   ├── .nojekyll               # Prevents Jekyll processing on Pages
│   ├── CNAME                   # Custom domain declaration
│   └── favicon.svg             # Browser icon
├── next.config.ts              # Static-export configuration
├── package.json                # Scripts and dependencies
└── tsconfig.json               # TypeScript configuration
```

## Local development

### Requirements

- Node.js 22 or newer
- npm 10 or newer
- Git

### Install and start

```bash
git clone https://github.com/learningsemantics/houseoflotus-ca.git
cd houseoflotus-ca
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Create the production static export |
| `npm run test` | Run linting and the production build together |

The production site is generated in `out/`.

## GitHub Pages deployment

Deployment is defined in [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml).

Every push to `main`:

1. Checks out the repository.
2. Installs Node.js 22.
3. Runs `npm ci`.
4. Builds the static Next.js export.
5. Uploads the `out/` directory.
6. Deploys it through GitHub Pages.

### First-time GitHub configuration

1. Open **Repository Settings → Pages**.
2. Under **Build and deployment**, set the source to **GitHub Actions**.
3. Open the **Actions** tab and confirm that `Deploy to GitHub Pages` runs.
4. In **Settings → Pages**, enter `houseoflotus.ca` as the custom domain if it is not already detected from `public/CNAME`.
5. Enable **Enforce HTTPS** after GitHub provisions the certificate.

> GitHub account and organization plans determine whether Pages can deploy directly from a private repository. If Pages is unavailable while the repository is private, either upgrade the relevant plan or make the repository public only when the source is ready for publication.

## Connecting the Cloudflare domain

The domain is registered and managed through Cloudflare. Configure the DNS zone only after GitHub Pages has been enabled.

### Apex domain

Create four `A` records for `@`:

| Type | Name | IPv4 address |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

### WWW hostname

| Type | Name | Target |
| --- | --- | --- |
| CNAME | `www` | `learningsemantics.github.io` |

Use **DNS only** rather than Cloudflare proxying while GitHub verifies the domain and provisions TLS. After HTTPS is working reliably, Cloudflare proxying may be evaluated separately.

DNS records and GitHub requirements can change. Confirm the current values against GitHub's Pages documentation before changing production DNS.

## Updating site content

Most MVP content is intentionally centralized:

- Navigation, page sections, product names, buyer segments and footer links: `app/page.tsx`
- Colours, typography, layout and responsive behaviour: `app/globals.css`
- Page title, description and social metadata: `app/layout.tsx`
- Product images: `public/assets/`
- Custom domain: `public/CNAME`

When replacing product images, use WebP where possible and preserve meaningful `alt` text for accessibility.

## Inquiry behaviour

GitHub Pages cannot process server-side forms. For this MVP:

- Wholesale inquiries open a pre-filled email addressed to `hello@houseoflotus.ca`.
- Early-access submissions open the visitor's email application with their information prepared.
- Tasting-box selections demonstrate product merchandising but do not create a persistent cart or checkout session.

This approach avoids falsely implying that information was saved when no backend exists.

## MVP boundaries

The current release does **not** include:

- Online payment or checkout
- Persistent shopping cart
- Customer or wholesale accounts
- Inventory and fulfilment management
- Shipping rates or Canadian tax calculation
- CRM or email-marketing synchronization
- Wholesale price lists and approval workflows
- Content management system
- Analytics or consent management
- French localization

These are deliberate boundaries for validating positioning, buyer interest, product-market fit and launch demand before adding operational complexity.

## Recommended commerce roadmap

### Phase 1 — Market-validation MVP

- Deploy the static site
- Connect the domain
- Validate consumer and wholesale messaging
- Recruit founding cafés, retailers and grower partners
- Capture early-access and sampling demand

### Phase 2 — Transactional D2C

- Add Shopify or another Canadian-ready commerce backend
- Introduce real cart and checkout
- Configure Canadian taxes, shipping and fulfilment
- Connect email marketing, analytics and consent management
- Launch coffee, cold brew and elixir collections

### Phase 3 — Wholesale portal

- Buyer applications and approval
- Account-specific wholesale pricing
- Samples and line-sheet downloads
- Minimum-order quantities and case packs
- Recurring B2B ordering
- Inventory visibility and order history

### Phase 4 — Grower representation platform

- Dedicated estate and producer profiles
- Lot-level traceability and documentation
- Availability calendars and harvest releases
- Sample evaluation and buyer matching
- Producer reporting and Canadian market intelligence

## Production checklist

Before announcing the site publicly:

- [ ] Confirm the GitHub Actions build succeeds
- [ ] Confirm the custom domain resolves from both apex and `www`
- [ ] Enable and verify HTTPS
- [ ] Test desktop, tablet and mobile layouts
- [ ] Test navigation, tasting-box buttons and both inquiry pathways
- [ ] Confirm `hello@houseoflotus.ca` is active and monitored
- [ ] Replace any unconfirmed product claims, formats or prices
- [ ] Add privacy, terms, shipping and returns policies before accepting orders
- [ ] Verify Canadian food labelling, import and advertising requirements
- [ ] Add analytics only with appropriate privacy and consent controls

## Troubleshooting

### The Pages workflow does not start

- Confirm GitHub Pages uses **GitHub Actions** as its source.
- Confirm Actions are enabled under **Settings → Actions → General**.
- Confirm the workflow exists on the `main` branch.

### The workflow builds but deployment fails

- Check whether the repository's private visibility is supported by the current GitHub plan.
- Confirm the workflow has `pages: write` and `id-token: write` permissions.
- Check whether another Pages deployment is already running.

### The domain shows a 404 or certificate error

- Confirm `public/CNAME` contains only `houseoflotus.ca`.
- Confirm the Cloudflare records match the GitHub Pages targets.
- Temporarily keep the records in **DNS only** mode.
- Allow time for DNS propagation and certificate provisioning.

### Images or styles are missing

- Confirm `npm run build` succeeds locally.
- Confirm asset paths begin at `/assets/`.
- Confirm the deployment artifact is the generated `out/` directory.

## Security and privacy

- Do not commit API keys, passwords, Cloudflare credentials or commerce secrets.
- Use GitHub Actions secrets for future deployment credentials.
- Keep payment data within a PCI-compliant commerce provider.
- Add a privacy policy and consent controls before collecting personal data through embedded forms or analytics.
- Protect the `main` branch once the MVP stabilizes and require successful checks before merging changes.

## Ownership

House of Lotus Canada is a House of Lotus initiative for bringing exceptional Indian coffee, cold brew and botanical elixirs to Canadian consumers and businesses.

All brand names, packaging artwork, product concepts, written content and visual assets in this repository are proprietary unless explicitly identified otherwise.

---

**Built in Canada. Rooted in India.**
