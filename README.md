# RJDLx Website — Deploy Package

Single-page site (46 views) split into properly arranged files. No build step, no framework — pure HTML + CSS + JS. Upload and it runs.

## Contents

| Path | What |
|---|---|
| `index.html` | All pages/views + header, menu, overlays |
| `css/main.css` | All styles (6 source blocks, order kept) |
| `js/imgmap.js` | Image key → file path map (must load before `main.js`) |
| `js/main.js` | All behaviour: scroll engine, nav, galleries, router (order kept) |
| `images/` | 115 mapped brand, collection and product images + `favicon.png` |
| `.nojekyll` | Lets GitHub Pages serve the folder as-is |

## Deploy (any static host — no settings needed)

This site uses `#/page` hash routing, so it works on **any** static hosting with **zero redirects/rewrites**:

- **cPanel / shared hosting:** upload the *contents* of this folder into `public_html/` (so `index.html` sits at the domain root). Done.
- **Netlify:** drag-drop this folder into Netlify Drop, or connect the repo. No build command, publish directory = this folder.
- **Vercel:** `vercel` from this folder (or import the repo). No build settings needed.
- **GitHub Pages:** push this folder; Settings → Pages → Deploy from branch. (`.nojekyll` is already included.)

## Notes

- **Internet needed for Google Fonts only** (Archivo + Inter via CDN link in `<head>`). Everything else is local.
- **Contact email:** the original file hid it behind Cloudflare email-protection (showed “[email protected]” without Cloudflare). It is now a plain `mailto:` link in the footers. Search `mailto:` in `index.html` to change it.
- **Cloudflare junk removed:** the email-decoder script and the invisible challenge iframe from the original snapshot are dropped — they only worked behind Cloudflare.
- **Editing images:** replace a file in `images/` keeping the same filename (e.g. hero first frame = `images/h52.jpg`), or edit `js/imgmap.js` to repoint a key. The 1-pixel placeholder in `<img src>` is intentional — `main.js` swaps in real paths on load.
- **Deep links** look like `yourdomain.com/#/collections` — shareable, no server config required.
- The standalone single-file version (`RJDLx-Natural-Recycled-Yarn.html`) contains this same current site and works without a build step.
