# Deploying Flowscope

The production site is **100% static** — everything the browser needs lives in `site/`. Deploying means copying that folder's *contents* to your host. The Express API (`api/server.js`) is for local development only and is never deployed.

## Hostinger (recommended)

**Option A — File Manager (no extra tools):**

1. Log in to [hPanel](https://hpanel.hostinger.com) → **Websites** → your site → **File Manager**.
2. Open `public_html` (delete the default files inside if you want a clean root).
3. Upload **the contents of `site/`** (not the `site` folder itself) into `public_html`.
4. Done — visit your domain. Changes go live immediately; hard-refresh (Ctrl/Cmd+Shift+R) to bypass cache.

**Option B — FTP/SFTP:**

1. hPanel → **Files** → **FTP Accounts** → create/show credentials (host, username, password, port 21 / 22 for SFTP).
2. Connect with FileZilla (or any FTP client) and upload `site/*` to `public_html/`.

**Notes:**
- No build step, no Node.js needed on the server — plain shared hosting works.
- If you use a custom domain, point its DNS to Hostinger first (hPanel → **Domains** → **DNS**), then upload.

## GitHub Pages

1. Push the repo to GitHub.
2. **Settings** → **Pages** → *Deploy from a branch* → branch `main`, folder `/site`.
3. Your site appears at `https://<user>.github.io/flowscope/` within a minute or two.

## Netlify / Vercel / Cloudflare Pages

- Create a new static site from the repo, set the **publish directory** to `site/`, no build command. Deploy.

## Custom domain

1. In your registrar's DNS, add an `A` record (or `CNAME` for Pages/Netlify/Vercel) pointing at your host — follow the host's own domain guide.
2. On Hostinger: hPanel → **Websites** → **Add Website** / **Domains** → assign the domain, then make sure the files are in that domain's document root.

## After deploying

- Open the site and click through: browse, search, open a flow.
- If something looks stale, it's browser cache — hard-refresh.
- To update: re-upload the changed files in `site/` (or `git push` if you're on Pages/Netlify/Vercel).
