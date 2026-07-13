# StyleJenich Fashion — React + TypeScript

A React/TypeScript rebuild of the original `index.html` single-page site, using Vite.

## Structure

- `src/App.tsx` — top-level page router (`home` / `gallery` / `about` / `contact`), managed with `useState` instead of the original DOM show/hide script.
- `src/components/Header.tsx` — nav bar, scroll-triggered color change, mobile hamburger menu.
- `src/components/HomePage.tsx` — hero, featured collections, artisan teaser.
- `src/components/GalleryPage.tsx` + `GalleryModal.tsx` — portfolio grid and click-to-expand modal.
- `src/components/AboutPage.tsx` — vision/process copy and studio photos.
- `src/components/ContactPage.tsx` — controlled contact form (name/email/phone/message).
- `src/components/Footer.tsx` — social links and copyright.
- `src/data/content.ts` — collection and gallery data, typed via `src/types.ts`.
- `src/index.css` — the original site's CSS, ported almost 1:1 (custom properties, layout, responsive breakpoints).

## Getting started

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

## Images

Copy your `images/` folder (the one from the original repo) into `public/images/` so the paths
like `images/StyleJenich-logo.jpg` resolve correctly — Vite serves everything in `public/` from
the site root.

## Build for production

```bash
npm run build
npm run preview
```
