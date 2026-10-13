"""
Keeps the static SEO pages (products/<slug>/index.html) in step with
data/products.json, so Google sees the same stock status as customers.

It updates the "availability" value (InStock / OutOfStock) in each product
page's structured data. A product is out of stock only when its
`availability` is exactly "out-of-stock" - the same rule the website uses.

    python3 scripts/sync_static_pages.py

xlsx_to_json.py runs this automatically, and the GitHub Action in
.github/workflows/sync-static-pages.yml runs it whenever data/products.json
is changed on GitHub.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRODUCTS = os.path.join(ROOT, "data", "products.json")
PATTERN = re.compile(r'("availability":\s*"https://schema\.org/)(?:InStock|OutOfStock)(")')


def main():
    with open(PRODUCTS, encoding="utf-8") as fh:
        products = json.load(fh)
    changed = 0
    for p in products:
        path = os.path.join(ROOT, "products", p["slug"], "index.html")
        if not os.path.isfile(path):
            continue
        status = "OutOfStock" if str(p.get("availability", "")).strip().lower() == "out-of-stock" else "InStock"
        with open(path, encoding="utf-8") as fh:
            html = fh.read()
        new = PATTERN.sub(lambda m: m.group(1) + status + m.group(2), html)
        if new != html:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(new)
            changed += 1
            print(f"  updated {p['slug']} -> {status}")
    print(f"Static product pages updated: {changed}")


if __name__ == "__main__":
    main()
