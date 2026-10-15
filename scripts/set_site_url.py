"""
Rewrites the site's public address everywhere (canonical links, sitemap, robots,
llms.txt, structured data, static SEO pages) in one go.

Use it when the site moves, e.g.
  * repo renamed to <user>.github.io   -> served at https://mysaarituals.github.io/
  * a custom domain is connected       -> https://www.mysaarituals.com/

    python3 scripts/set_site_url.py https://mysaarituals.github.io/mysaa_website https://mysaarituals.github.io
    python3 scripts/set_site_url.py https://mysaarituals.github.io/mysaa_website https://www.mysaarituals.com

(no trailing slash on either address). Add --dry-run to just list the files.
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXTS = (".html", ".xml", ".txt", ".json", ".md", ".webmanifest", ".js", ".jsx")
SKIP_DIRS = {".git", "node_modules", "__pycache__"}


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry-run" in sys.argv
    if len(args) != 2:
        sys.exit(__doc__)
    old, new = (a.rstrip("/") for a in args)
    changed = 0
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            if not name.endswith(EXTS) or name.endswith(".bak"):
                continue
            path = os.path.join(base, name)
            with open(path, encoding="utf-8") as fh:
                text = fh.read()
            if old not in text:
                continue
            changed += 1
            print(("would update " if dry else "updated ") + os.path.relpath(path, ROOT))
            if not dry:
                with open(path, "w", encoding="utf-8") as fh:
                    fh.write(text.replace(old, new))
    print(f"{changed} file(s) {'would change' if dry else 'changed'}.")


if __name__ == "__main__":
    main()
