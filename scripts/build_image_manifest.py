"""
Scans the assets/catalogue folder and writes data/images.json — a map
telling the website which photo files exist for each product and each
fragrance. This is what lets the site show real photos.

Run this any time you add, remove or rename photos:

    python3 scripts/build_image_manifest.py

You do NOT need to use any specific filename. Any name is fine, as
long as the file:
  - is a .jpg, .jpeg, .png or .webp
  - sits in the correct folder:
      assets/catalogue/<fragrance-slug>/<category-slug>/   -> product photos
      assets/catalogue/fragrances/<fragrance-slug>/        -> fragrance photos

Multiple photos in the same folder are shown in alphabetical/number
order, so prefixing with 01_, 02_, 03_ (as the folders already do)
controls which photo appears first.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOGUE = os.path.join(ROOT, "assets", "catalogue")
DATA = os.path.join(ROOT, "data")
OUT = os.path.join(DATA, "images.json")

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp"}


def natural_key(name):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", name)]


def list_images(folder):
    if not os.path.isdir(folder):
        return []
    names = [
        n for n in os.listdir(folder)
        if os.path.splitext(n)[1].lower() in IMAGE_EXT
    ]
    names.sort(key=natural_key)
    return names


def url_for(*parts):
    # Build a browser-safe relative URL (spaces etc. percent-encoded),
    # always with forward slashes regardless of OS.
    from urllib.parse import quote
    posix_parts = [p.replace(os.sep, "/") for p in parts]
    return "/".join(quote(p) for p in posix_parts)


def main():
    products = {}
    fragrances = {}

    if os.path.isdir(CATALOGUE):
        for fragrance_slug in sorted(os.listdir(CATALOGUE)):
            fragrance_path = os.path.join(CATALOGUE, fragrance_slug)
            if not os.path.isdir(fragrance_path):
                continue

            if fragrance_slug == "fragrances":
                # assets/catalogue/fragrances/<fragrance-slug>/*.jpg
                for slug in sorted(os.listdir(fragrance_path)):
                    slug_path = os.path.join(fragrance_path, slug)
                    if not os.path.isdir(slug_path):
                        continue
                    files = list_images(slug_path)
                    if files:
                        fragrances[slug] = [
                            url_for("assets", "catalogue", "fragrances", slug, f) for f in files
                        ]
                continue

            # assets/catalogue/<fragrance-slug>/<category-slug>/*.jpg
            for category_slug in sorted(os.listdir(fragrance_path)):
                category_path = os.path.join(fragrance_path, category_slug)
                if not os.path.isdir(category_path):
                    continue
                files = list_images(category_path)
                if files:
                    key = f"{fragrance_slug}/{category_slug}"
                    products[key] = [
                        url_for("assets", "catalogue", fragrance_slug, category_slug, f) for f in files
                    ]

    manifest = {"products": products, "fragrances": fragrances}
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2, ensure_ascii=False)

    print(f"Wrote {OUT}")
    print(f"  {len(products)} product photo folder(s) found")
    print(f"  {len(fragrances)} fragrance photo folder(s) found")
    missing_products = [k for k, v in products.items() if not v]
    if not products:
        print("  (no product photos found yet — that's fine, placeholders will show)")


if __name__ == "__main__":
    main()
