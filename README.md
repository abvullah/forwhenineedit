# For when I need it

For when I need it is a local-first collection of file, image, media, and text tools. It runs as a static web app: selected files and entered content are processed in your browser and are not uploaded by the app. There are no user accounts, subscriptions, payments, analytics, or file-upload APIs.

## Run locally

Install [Node.js 24 or newer](https://nodejs.org/), then from this folder run:

```sh
npm start
```

Open <http://localhost:3000>. The Node.js server serves the static files in `public/` and adds the security headers needed for browser workers and media processing. It listens on the local machine and accepts only `GET` and `HEAD` requests.

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

- Files are read and processed by the browser; the app server does not receive their contents.
- The browser downloads the app's self-hosted libraries and model/runtime files as needed. First use of AI removal, OCR, or media conversion may take longer while those assets load.
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
