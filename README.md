# RJDLx Website — Deploy Package

The original HTML/CSS/JS design is compiled into 46 independent, indexable HTML pages. Edit the source files, then run `npm run build`. Publish the generated `dist/` directory, not the source folder.

## Contents

| Path | What |
|---|---|
| `index.html` | All pages/views + header, menu, overlays |
| `css/main.css` | All styles (6 source blocks, order kept) |
| `js/imgmap.js` | Image key → file path map (must load before `main.js`) |
| `js/main.js` | All behaviour: scroll engine, nav, galleries, router (order kept) |
| `images/` | Original brand, collection and product photography |
| `scripts/` | Build, public live checks and guarded IndexNow submission |
| `tests/` | HTTP crawling and indexing regression checks |
| `dist/` | Generated deployable pages/assets (ignored by Git) |

## Build and verify

```sh
npm ci
npm run build
npm run test:indexing
npm run dev
```

`npm run dev` builds first, then runs Express on port 4583. It serves only public build assets and preserves the enquiry API. `npm run serve` serves `dist/` without the API. Originals in `images/` stay untouched; optimized responsive WebP files are generated at build time and cached under `.cache/`.

`site.config.json` holds the canonical origin (currently `https://www.rjdlx.com`), optional public verification meta values and the public IndexNow key. Existing DNS verification records should be preserved. Never put private account credentials into that file.

## Hosting

Vercel builds the static pages and the existing `api/enquiry.js` function using `vercel.json`. Real pages use clean URLs; unknown URLs return 404. Do not restore the old catch-all homepage rewrites. Existing `.html` links and legacy hash links remain compatible. A production release still requires owner approval.

For another static host, publish `dist/`, enable extensionless HTML URLs and 404 status responses, and configure permanent redirects for aliases from `dist/site-manifest.json`. The enquiry API needs separate Node hosting.

After an approved production release, run `node scripts/check-live-indexing.js` and `npm run indexnow`. IndexNow refuses to submit until the key, sitemap and pages are actually live. It notifies participating engines including Bing and Yandex; it does not guarantee indexing. Submit `https://www.rjdlx.com/sitemap.xml` in authenticated Google Search Console, Bing Webmaster Tools and Yandex Webmaster, then inspect the homepage and collection URLs. See `docs/indexing-status.md` for the audit and account access status.

## Notes

- Google Fonts and consent-controlled Google Analytics need internet access.
- **Contact email:** the original file hid it behind Cloudflare email-protection (showed “[email protected]” without Cloudflare). It is now a plain `mailto:` link in the footers. Search `mailto:` in `index.html` to change it.
- **Cloudflare junk removed:** the email-decoder script and the invisible challenge iframe from the original snapshot are dropped — they only worked behind Cloudflare.
- Edit original images or `js/imgmap.js`, then rebuild. Source placeholders are replaced by actual image URLs in published HTML.
- Share real URLs such as `https://www.rjdlx.com/collections`. Legacy hash bookmarks redirect to the corresponding real page.
