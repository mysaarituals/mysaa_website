# Mysaa Rituals — Website

A static product catalogue site for Mysaa Rituals: candles and gift hampers,
browsable by fragrance, feeling and occasion, with WhatsApp enquiries.

No build step, no server, no database — it runs as plain files, which makes
it a perfect fit for **GitHub Pages**.

## What's inside

```
index.html          the page shell (loads React + your app + styles)
app.js               the whole app: pages, routing, product cards, filters
styles.css           brand colours, fonts, layout
assets/logo.png      your logo (transparent background)
data/
  products.json      every product shown on the site
  fragrances.json    fragrance list (Dhoop & Chandan, Madhuban, …)
  feelings.json      "shop by feeling" categories
  occasions.json     "shop by occasion" tags
  categories.json    Candles / Gift Hampers / Custom Creations
  settings.json      brand name, WhatsApp number, email, Instagram, etc.
  mysaa_products.xlsx   an Excel copy of everything above, for easy editing
scripts/
  xlsx_to_json.py         Excel → JSON (run this after editing the sheet)
  build_xlsx_from_json.py JSON → Excel (rebuilds the sheet from scratch)
```

## 1. Deploy to GitHub Pages

1. Create a new GitHub repository (e.g. `mysaa-rituals`).
2. Upload every file in this folder to the repository, keeping the same
   folder structure (`data/`, `assets/`, `scripts/` etc. at the top level).
3. In the repo, go to **Settings → Pages**.
4. Under "Build and deployment", choose **Deploy from a branch**, pick the
   `main` branch and the `/ (root)` folder, then **Save**.
5. GitHub will give you a URL like `https://yourusername.github.io/mysaa-rituals/`.
   It can take a minute or two to go live the first time.

That's it — no build command, no `npm install`, nothing else to configure.

## 2. Update your product details (no coding required)

The easiest way to manage products day-to-day is the Excel workbook:

1. Open `data/mysaa_products.xlsx` (in Excel, Numbers, or Google Sheets).
2. Read the **"Read Me"** tab first — it explains each column.
3. Edit the **Products**, **Fragrances**, **Feelings**, **Occasions**,
   **Categories** or **Settings** tabs. Keep the `slug` column unique on
   each sheet (it's how a product links to its fragrance/feeling/occasion).
4. Save the file back to `data/mysaa_products.xlsx`.
5. From a terminal, inside this project folder, run:

   ```bash
   pip install openpyxl
   python3 scripts/xlsx_to_json.py
   ```

   This regenerates `products.json`, `fragrances.json`, etc. from your
   spreadsheet.
6. Commit and push the changed files. GitHub Pages updates automatically.

Prefer editing JSON directly? You can also open any file in `data/*.json`
in a text editor and edit it by hand — the site reads those files directly
at runtime, so no Excel step is required if you're comfortable with JSON.
Just keep the structure (field names) the same as the existing entries.

## 3. Update branding

- **Logo**: replace `assets/logo.png` with a new file of the same name.
- **Colours / fonts**: edit the CSS variables at the top of `styles.css`
  and the font `<link>` in `index.html`.
- **WhatsApp number, email, Instagram, tagline**: edit `data/settings.json`
  (or the "Settings" tab in the Excel workbook).

## 4. Preview locally before publishing

Because the site loads JSON with `fetch()`, opening `index.html` directly
in a browser (as a `file://` URL) will not work — browsers block that for
security reasons. Instead, serve the folder locally:

```bash
# from inside this project folder
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Notes

- Product photos are shown as placeholders. Add real photos by placing
  image files in `assets/` and referencing them in `data/products.json`
  (or ask your developer / Claude to wire up the `images` field).
- All enquiries go straight to WhatsApp — there is no shopping cart or
  payment processing built in, matching how the brand currently sells.
