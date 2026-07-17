# House of Lotus Canada MVP

A static, production-style hybrid D2C and B2B storefront for House of Lotus Canada. The site represents Indian coffee growers in Canada and introduces House of Lotus cold brews and future botanical elixirs.

## Included

- Premium responsive brand experience
- D2C cold-brew collection and tasting-box interactions
- B2B pathways for retail, cafés, restaurants, offices and hospitality
- Grower-first positioning and origin story
- Email-based wholesale and early-access capture suitable for a static MVP
- Static export for GitHub Pages
- GitHub Actions deployment workflow
- `houseoflotus.ca` custom-domain file

## Local development

```bash
npm ci
npm run dev
```

## Production build

```bash
npm run build
```

The deployable static site is generated in `out/`.

## GitHub Pages setup

1. Push this repository to GitHub with `main` as the default branch.
2. In **Settings → Pages**, choose **GitHub Actions** as the source.
3. The included workflow builds and publishes on every push to `main`.
4. Add the custom domain `houseoflotus.ca` in GitHub Pages settings.
5. At Cloudflare, create the apex DNS records GitHub displays and a `www` CNAME pointing to `<github-user-or-org>.github.io`.
6. Keep the DNS records in **DNS only** mode until GitHub issues the TLS certificate; enable **Enforce HTTPS** afterward.

## MVP boundary

GitHub Pages is static hosting. The current tasting box is a front-end merchandising interaction and inquiries open the visitor's email app. Checkout, inventory, customer accounts, buyer pricing and CRM capture should be connected in the commerce phase.
