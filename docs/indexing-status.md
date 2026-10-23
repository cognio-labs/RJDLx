# RJDLx indexing and account audit — 23 October 2026

> Historical snapshot: a later live crawl on 23 October 2026 found the generated pages, XML sitemap and robots.txt already live. See `seo-audit-2026-10-23.txt` and `artifacts/seo-live.json` for current evidence. The earlier deployment/account observations below were not reverified in that later crawl.

## Release status

**Implemented and verified locally; not live.** Preview deployment to the existing `cognio-so/rjdlx` project was rejected by Vercel: `Your Team exceeded our fair use limits and has been blocked.` Resolve that team restriction before release. No production deployment, DNS change, domain migration or search-engine submission was performed. Local `vercel build --yes` succeeded and packaged the static pages and existing enquiry function. Production release still requires owner approval.

## Production evidence

Public results are recorded in `artifacts/live-indexing.json`; refresh with `node scripts/check-live-indexing.js`.

| Check | Live production | Verified local build |
| --- | --- | --- |
| Home, Contact, Trade | Same 557,819-byte document/title, no canonical | Separate visible HTML and unique metadata |
| `/robots.txt` | Homepage HTML, HTTP 200 | Plain text with crawler rules and sitemap location |
| `/sitemap.xml` | Homepage HTML, HTTP 200 | XML with 46 canonical URLs |
| Unknown paths | Homepage HTTP 200 | HTTP 404 |
| Product imagery | JS placeholders and oversized originals | Real image sources, responsive WebP, dimensions, lazy loading |
| GA4 | No GA loader in live HTML | `G-J4MKWGPQJL`, consent-gated page views |

The existing root-domain redirect goes to `https://www.rjdlx.com`; all generated canonicals and sitemap URLs preserve that host. Requests using Googlebot, bingbot, YandexBot, OAI-SearchBot, Claude-SearchBot and PerplexityBot user-agent strings returned HTTP 200 on the live homepage. This is an HTTP-access test from the audit machine, not proof of real crawler IP access or completed indexing.

## Connected-account verification

| Platform | Evidence | Outstanding check |
| --- | --- | --- |
| Google Search Console | **Two existing Google verification TXT records**, confirmed with Windows DNS and public DNS-over-HTTPS | Authenticated ownership, property coverage, sitemap status, Pages report, URL Inspection and manual actions |
| Bing Webmaster Tools | Available browser reaches landing page with Sign In | Ownership/imported properties, submitted sitemap, Site Scan, URL Inspection |
| Yandex Webmaster | `/sites/` redirects to Yandex ID login | Ownership, sitemap processing, diagnostics and reindexing |
| Vercel | Existing team/project readable; CLI authenticated; build succeeds | Deployment blocked by team fair-use restriction |
| GA4 | Browser queues zero manual page views before consent and one after Accept; navigation queues one in the next document | Actual production delivery, GA property access and Realtime; live site has no loader yet |
| Hosting protection | Project SSO configuration excludes custom domains; public HTTP works | Firewall API returned no active config; CLI overview was incomplete due an IP Bypass plan restriction (402). Do not claim every bot/IP rule verified |

The available automation browser is not signed in to the three webmaster dashboards. No existing Chrome debugging connection or GSC/Bing/Yandex account connector was available. This does not prove the owner's accounts are unconfigured elsewhere. Sign-in/account access is needed to finish the private checks; passwords or tokens should not be pasted in chat.

A Google "Do you own this site?" prompt does **not** establish that GSC is absent. DNS verification records establish configuration evidence, not current ownership or successful sitemap submission. The original audit's account conclusions must therefore remain unconfirmed.

## Completed implementation

- Compile the existing design into 46 independent HTML pages. Each contains its own visible content and images, readable without running JavaScript.
- Preserve shared navigation, animation, gallery and enquiry UI. Published navigation uses standard clean URLs and browser history; known old `.html`, collection-alias and `#/view` links remain compatible.
- Serve only generated public files from local Express; unknown/private paths return 404. Preserve Vercel's existing `api/enquiry.js` endpoint while serving static HTML.
- Generate unique titles/descriptions, canonical URLs, Open Graph/Twitter cards and a 1200 × 630 share image.
- Add Organization, WebSite, page, BreadcrumbList and Product structured data derived from existing content. No invented price, review, legal entity, GST, IEC or address is included. Full Product rich-result eligibility is not claimed without offer data.
- Generate a sitemap listing all 46 canonical URLs and valid robots rules allowing normal search and documented OpenAI/Anthropic/Perplexity search and retrieval agents. Exclude `/api/` from crawling.
- Resolve 133 image references at build time; generate responsive WebP photographs, dimensions and native lazy loading. Original assets are preserved.
- Add the public IndexNow key and `npm run indexnow`. The script verifies the **live** key, sitemap and all page canonicals before submission. It has not submitted unpublished URLs.
- Add optional public Google/Bing/Yandex verification meta fields in `site.config.json`. Existing DNS verification records are preserved; DNS verification does not need a duplicate HTML meta tag.

| Measured asset | Before | After |
| --- | ---: | ---: |
| Homepage HTML | 566,040-byte current source | 42,893 bytes |
| Architectural bronze hero | 8,164,084 bytes | 133,614-byte WebP |
| Interior living hero | 34,480,993 bytes | 241,566-byte WebP |

## Verification

`npm run build`, `npm run test:indexing`, JavaScript syntax checks and the local Vercel build passed. Six automated test groups cover all 46 HTTP pages and their metadata/content/images/links/schema, sitemap/robots types, 404s, legacy redirects, IndexNow key, enquiry validation and image/HTML budgets. No real enquiry email was sent.

Browser checks confirmed Contact → Custom clean-URL navigation, consent gating and one manual page view per document, product gallery image switching, legacy `/#/trade` → `/trade` migration, and mobile homepage rendering at 390 × 844. No uncaught JavaScript errors were reported. The mobile screenshot was visually inspected. Screenshots and public HTTP evidence are stored under ignored `artifacts/`. Local verification is not a substitute for a live post-release check.

## Required release and submission steps

1. Resolve the Vercel team's deployment restriction. Do not bypass it by silently moving the website to another team/provider.
2. Review and approve the production release through the existing project; rerun `node scripts/check-live-indexing.js` after deployment.
3. In authenticated GSC, confirm the correct domain/URL-prefix property and owner, submit `https://www.rjdlx.com/sitemap.xml`, verify successful processing, inspect/request indexing of Home, Collections, Trade and key product URLs, then inspect Pages and manual-action reports.
4. Verify/import the site in Bing Webmaster Tools, submit the same sitemap and inspect key URLs. Run `npm run indexnow` only after its live key/page checks pass; verify processing in Bing.
5. Verify the canonical host in Yandex Webmaster, submit the sitemap and check diagnostics/reindexing. IndexNow shares submissions with participating engines, including Bing and Yandex; a receipt is not an indexing guarantee.
6. For Brave, keep Googlebot-accessible pages and ordinary crawlable links. Its removal/re-fetch form is not a guaranteed new-site indexing service.
7. For ChatGPT search, allow OAI-SearchBot and its documented crawler IPs at the host. ChatGPT-User retrieval and model training are separate concerns; an OpenAI API integration is not required.
8. For Claude and Perplexity, allow documented search/retrieval agents and inspect actual crawl logs after release. No universal submission form or guaranteed appearance timetable was established.
9. Verify GA4 network delivery and Realtime on the deployed domain after consent. GA4 does not replace webmaster tools.

## Limits and pending content

Crawlable, indexed, ranked and cited in an AI answer are different states. Providers decide inclusion and ordering. Immediate appearance on every named platform cannot be guaranteed; no universal-ranking success is claimed.

Privacy/terms, verified business identity, phone, social profile ownership, named case studies, catalogue and individual journal-article URLs remain pending or require owner-approved facts. Policy URLs now correctly return 404 instead of falsely serving Home. Do not mark those audit items complete. No 410 responses were invented for pages without confirmed removal history.

The dependency audit also reported existing `proxy-addr` (critical) and `ip-address` (moderate) advisories. No forced dependency upgrade was made in this indexing pass.

## Official sources

- [Google technical requirements](https://developers.google.com/search/docs/essentials/technical) and [AI eligibility](https://developers.google.com/search/docs/appearance/ai-features)
- [IndexNow protocol](https://www.indexnow.org/documentation) and [Bing submissions](https://www.bing.com/webmasters/help/URL-Submission-62f2860b)
- [OpenAI crawlers](https://developers.openai.com/api/docs/bots)
- [Anthropic crawlers](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)
- [Perplexity crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers)
- [Brave crawler behavior](https://safe.search.brave.com/help/brave-search-crawler)
