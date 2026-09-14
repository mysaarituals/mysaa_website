# Mysaa Rituals — Website

A static product catalogue site for Mysaa Rituals: candles (hero jar, wide
jar, shot glass), wax melts & sachets, and gift hampers — browsable by
fragrance or by format, with WhatsApp enquiries and ordering.

No server or database — it runs as plain files, which makes it a perfect
fit for **GitHub Pages**.

## What's inside

```
index.html          the page shell (loads React + the app + styles)
app.jsx              EDITABLE SOURCE — the whole app: pages, routing, cards
app.js               COMPILED — plain JS, generated from app.jsx (see below)
styles.css           brand colours, fonts, layout
assets/logo.png      your logo (transparent background)
data/
  products.json      every product shown on the site
  fragrances.json    the 5 signature fragrances
  categories.json    Hero Jar / Wide Jar / Shot Glass / Wax Melts / Hampers
  settings.json      brand name, WhatsApp number, email, Instagram, etc.
  mysaa_products.xlsx   an Excel copy of everything above, for easy editing
scripts/
  xlsx_to_json.py         Excel → JSON (run this after editing the sheet)
  build_xlsx_from_json.py JSON → Excel (rebuilds the sheet from scratch)
```

## Design system

The UI follows the supplied Mysaa Rituals reference CSS: warm ivory grounds, ink-brown typography, muted terracotta/clay and brass accents, Cormorant Garamond display type, Karla body type, fine borders, generous whitespace and subtle editorial hover motion.

## 1. Deploy to GitHub Pages

1. Create a GitHub repository (e.g. `mysaa-rituals`).
2. Upload every file in this folder to the repo root — `index.html`,
   `app.js`, `styles.css`, `README.md`, and the `assets/`, `data/`,
   `scripts/` folders — keeping the same structure. (`app.jsx` is the
   editable source; upload it too so you have it for future edits, but
   it isn't required for the site to run — the browser uses `app.js`.)
3. Settings → Pages → Source: **Deploy from a branch** → `main` / `/ (root)` → Save.
4. Your site goes live at `https://yourusername.github.io/mysaa-rituals/`
   within a minute or two.

## 2. Update your product details (no coding required)

1. Open `data/mysaa_products.xlsx` and read the **"Read Me"** tab.
2. Edit **Products**, **Fragrances**, **Categories** or **Settings**.
   Keep `slug` unique on each sheet — it's how a product links to its
   fragrance and category. A product's `categorySlug` must be one of:
   `hero-jar-candle`, `wide-jar-candle`, `shot-glass-candle`,
   `wax-melts`, `gift-hampers`.
3. Save, then from a terminal in the project folder run:
   ```bash
   pip install openpyxl
   python3 scripts/xlsx_to_json.py
   ```
4. Commit and push the changed `data/*.json` files. The live site updates
   automatically.

You can also edit `data/*.json` directly in a text editor if you're
comfortable with JSON — no Excel step required.

## 3. Editing the design or layout (app.jsx)

`app.jsx` is the real source code — readable JSX with comments. `app.js`
is what the browser actually runs; it's a plain-JavaScript version of
`app.jsx` with the JSX already converted to `React.createElement(...)`
calls, so the site works without any build tools online.

**After editing `app.jsx`, you must recompile it to `app.js`** before the
change will show up on the site:

```bash
npx --yes typescript@5 tsc --jsx react --outDir . --allowJs \
    --target es2018 --module none --lib dom,es2018 app.jsx
```

This overwrites `app.js` in place. Commit both `app.jsx` and the
regenerated `app.js`, then push.

## 4. Update branding

- **Logo**: replace `assets/logo.png` (same filename).
- **Colours / fonts**: edit the CSS variables at the top of `styles.css`
  and the `C` object near the top of `app.jsx` (then recompile).
- **WhatsApp number, email, Instagram, tagline, address**: edit
  `data/settings.json` (or the "Settings" tab in the Excel workbook).

## 5. Preview locally before publishing

Because the site loads JSON with `fetch()`, opening `index.html` directly
as a `file://` URL won't work. Serve the folder instead:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Notes

- Product photos are placeholders — add real photos to `assets/` and
  wire up the `images` field in `products.json` when ready.
- All ordering goes through WhatsApp — there's no shopping cart or
  payment processing, matching how the brand currently sells. The
  quantity selector and Order button on each product page prefill a
  WhatsApp message with the product name, quantity and total price.


## 6. Product image folder & naming convention

The website automatically looks for product images using this exact structure:

```
assets/
  catalogue/
    <fragrance-slug>/
      <category-slug>/
        01-cover.jpg
        02-detail.jpg
        03-lifestyle.jpg
```

Example:

```
assets/catalogue/
  gulab-ki-chitthi/
    hero-jar-candle/
      01-cover.jpg
      02-detail.jpg
      03-lifestyle.jpg
```

You do **not** need to edit the HTML to add these photos. Replace/add the image files with the exact names above and push them to GitHub.

Fragrance cover images use:

```
assets/catalogue/fragrances/<fragrance-slug>/01-cover.jpg
```

Example:

```
assets/catalogue/fragrances/madhuban/01-cover.jpg
```

### Image rules

- `01-cover.jpg` is the main image shown on product cards and the product detail page.
- `02-detail.jpg` and `03-lifestyle.jpg` are optional additional images and are stored in the Excel/JSON data for future gallery use.
- Keep filenames lowercase and use exactly `01-cover.jpg`, `02-detail.jpg`, `03-lifestyle.jpg`.
- JPG is recommended. PNG also works if the path in the Excel `image1/image2/image3` columns is changed accordingly.
- Keep the fragrance and category folder names exactly as their `slug` values.

### Current catalogue combinations

The workbook now contains **25 combinations**:

- 5 fragrances:
  - gulab-ki-chitthi
  - dhoop-chandan
  - gajre-ka-shringar
  - madhuban
  - raat-ki-rani
- 5 formats:
  - hero-jar-candle
  - wide-jar-candle
  - shot-glass-candle
  - wax-melts (displayed as Wax Sachet Combo)
  - gift-hampers

Every fragrance is paired with every format.

### Pricing

The current generated prices use the existing category prices as starting values:

- Hero Jar: ₹950 (Madhuban Hero Jar retains the existing ₹1,050 price)
- Wide Jar: ₹650
- Shot Glass: ₹350
- Wax Sachet Combo: ₹350
- Gift Hampers: Enquire

**Edit the `price` column in `data/mysaa_products.xlsx` with your final prices.** A price of `0` displays as `Enquire`.

### Updating the website after Excel edits

After editing `data/mysaa_products.xlsx`:

```bash
python3 scripts/xlsx_to_json.py
```

Then push the updated `data/*.json` files to GitHub.

The Products sheet contains `image1`, `image2`, and `image3` columns. These paths should normally be left as generated unless you change your image filenames.
