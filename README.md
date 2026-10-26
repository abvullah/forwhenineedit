# For when I need it

For when I need it is a website offering file, image, media, and text tools. The website is hosted online, but selected files and entered content are processed in your browser and are not uploaded to us or sent to a processing server. Your browser does request the site, libraries, and models from the website host; the host may receive ordinary technical request data such as your IP address. There are no user accounts, subscriptions, payments, or file-upload APIs. Vercel Web Analytics is loaded on deployed sites to collect aggregate visit metrics; it does not access selected file contents.

## Run locally

Install [Node.js 24 or newer](https://nodejs.org/), then from this folder run:

```sh
npm start
```

Open <http://localhost:3000>. This starts the website on your own machine for development or personal use. The Node.js server serves the static files in `public/` and adds the security headers needed for browser workers and media processing. It accepts only `GET` and `HEAD` requests; files selected in the browser are never sent to it.

To deploy on Vercel, import this repository and deploy from its root directory. [`vercel.json`](./vercel.json) configures a static deployment from `public/`, disables framework/build detection so `server.js` is not invoked as a function, enables clean page URLs, and sets the security/isolation headers required by browser workers and media processing. The Vercel host serves app and runtime assets but does not receive selected file contents.

For another static host, publish the contents of `public/`, configure the COOP/COEP headers required by some browser tools (notably FFmpeg), and set up clean URLs/redirects as needed.

Run the checks with:

```sh
npm run check
npm test
```

The project has no npm runtime dependencies. `package-lock.json` is kept so `npm ci` can be used in automated environments.

## Tools

### Images

- **AI background remover** — remove or replace a subject's background, refine the mask with restore/erase brushes, compare before and after, and export images. Batch-process up to 20 images into a ZIP.
- **Background remover** — remove plain backgrounds using a colour-based method.
- **Compress image** — adjust quality and convert to JPG, PNG, or WEBP.
- **Resize image** — scale images down while keeping their aspect ratio.
- **Convert image** — convert between JPG, PNG, and WEBP.
- **Remove image metadata** — re-encode images without embedded EXIF/GPS metadata.

### PDFs

- Merge PDFs, extract or remove selected pages, rotate pages, and split a document into a ZIP of individual pages.
- Convert images to PDF and render PDF pages as PNG or JPG images.
- Add page numbers or a text watermark.
- Recognize text in scanned PDFs and images with browser-based OCR.

### Media

- **Video tools** — compress, trim, convert, mute, or extract audio from videos using the bundled FFmpeg runtime.
- **Audio tools** — trim, convert, or extract audio from supported media files.

### QR codes, barcodes, and utilities

- Generate QR codes for text, URLs, Wi-Fi, and contact details; export SVG or PNG.
- Scan QR codes from images or a camera. Scanned links are displayed as text and are not opened automatically.
- Generate Code 128, Code 39, and EAN-13 barcodes.
- Count words and characters; change text case; encode/decode Base64; format JSON; generate SHA-1/SHA-256/SHA-512 hashes; create random passwords and UUIDs.

Tool limits and supported formats are shown in each tool. For example, the AI background remover accepts JPG, PNG, and WEBP images up to 25 MB and 16 megapixels each.

## Privacy, offline use, and permissions

- Files are read and processed by the browser; selected file contents are not uploaded to us or sent to a processing server.
- The browser downloads the app's self-hosted libraries and model/runtime files from the website host as needed. First use of AI removal, OCR, or media conversion may take longer while those assets load.
- As with any hosted website, the hosting provider receives requests for pages and assets and may process connection metadata such as IP addresses according to its own policies.
- Vercel Web Analytics is included for deployed sites. It records anonymous, aggregated page-view metrics such as page URLs, referrers, approximate location, and device/browser information. Analytics does not read or upload files selected in the browser and is disabled on localhost. See [Vercel's analytics privacy documentation](https://vercel.com/docs/analytics/privacy-policy).
- To activate metrics, deploy the site to Vercel and enable **Web Analytics** in the Vercel project dashboard. The integration uses Vercel's first-party `/_vercel/insights/script.js` route; it does not load on localhost.
- A service worker caches the app shell and runtime assets for later offline use. Offline availability depends on having opened the app and loaded the required assets before disconnecting.
- QR camera scanning requires browser permission. Camera access is generally available on `localhost` or an HTTPS site.
- The app stores the selected light/dark theme preference in browser local storage.

## Project layout

```text
public/
  index.html          App shell
  about.html          Editable About page
  css/                Styles and fonts
  js/                 Tool implementations, registry, and app logic
  models/              Locally hosted AI/OCR models
  vendor/              Self-hosted browser libraries and runtimes
  sw.js                Offline cache/service worker
server.js              Local static-file server
test/                  Server and routing tests
```

This is a dependency-free, plain-JavaScript app without a frontend build step.

## Customization

- Edit the project description in `public/about.html`.
- Change the brand in `CONFIG.brand` in `public/js/core.js`.
- Update footer links and the Abdullah credit in `public/js/core.js`.
- Add or change tools in `public/js/registry.js`; implement their browser behavior in the corresponding file under `public/js/`.

## Licensing and policy pages

Review the licenses in `public/vendor/` and `public/models/` before redistributing their contents. In particular, the bundled FFmpeg core is GPL-2.0-or-later; make sure you meet its distribution requirements. The policy pages are templates and should be reviewed and completed for your jurisdiction before public deployment.
