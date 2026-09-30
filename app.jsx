/* ============================================================
   MYSAA RITUALS — Digital Catalogue
   Static, single-page React app (no build step; runs on GitHub Pages).
   SOURCE FILE: edit app.jsx, then compile to app.js before publishing:

     npx tsc --jsx react --outDir . --allowJs --target es2018 \
         --module none --lib dom,es2018 app.jsx
     mv app.js app.js   (tsc writes app.js next to app.jsx)

   Product data is fetched from ./data/*.json — the shop owner edits
   data/mysaa_products.xlsx and regenerates the JSON (see scripts/). Orders are prepared in the cart and sent by email.
   ============================================================ */
const { useState, useEffect, useMemo, useCallback } = React;

const C = {
  ink: "#44372F",
  ink70: "#75685D",
  gold: "#A98755",
  goldDeep: "#8A6A3F",
  rust: "#9B654B",
  rustDeep: "#82523B",
  cream: "#FAF7F0",
  card: "#F3EDE2",
  line: "#DED4C5",
};
const serif = { fontFamily: "'Cormorant Garamond', serif" };
const sans = { fontFamily: "'Karla', sans-serif" };
const label = { ...sans, fontSize: 11.5, letterSpacing: "0.11em", textTransform: "uppercase" };

const inr = (n) => Number(n || 0) > 0 ? `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "Enquire";

// Launch discount structure: the final selling prices remain unchanged,
// while each core candle format carries its own advertised discount.
const DISCOUNT_RATES = {
  "hero-jar-candle": 20,
  "wide-jar-candle": 15,
  "shot-glass-candle": 10,
  "discovery-set": 20,
  "grand-ritual": 25,
};

const GIFT_WRAP_CHARGE = 50;

function regularPrice(product) {
  if (!product) return 0;
  if (Number(product.mrp || 0) > 0) return Number(product.mrp);
  const rate = Number(product.discountPercent || DISCOUNT_RATES[product.categorySlug] || 0);
  const current = Number(product.price || 0);
  return rate > 0 && current > 0 ? current / (1 - rate / 100) : 0;
}

function discountPercent(product) {
  if (!product) return 0;
  return Number(product.discountPercent || DISCOUNT_RATES[product.categorySlug] || 0);
}

function DiscountedPrice({ product, currentPrice, large = false }) {
  const regular = regularPrice(product);
  const current = Number(currentPrice || product?.price || 0);
  const discount = discountPercent(product);
  return (
    <div className={large ? "price-stack price-stack-large" : "price-stack"}>
      {regular > current && current > 0 && <div className="price-original-row">
        <span className="price-original">{inr(regular)}</span>
        {discount > 0 && <span className="price-discount">-{discount}%</span>}
      </div>}
      <span className={large ? "price-current price-current-large" : "price-current"}>{inr(current)}</span>
    </div>
  );
}

// Product customisation pricing. Standard packaging is included in the base price.
// Premium packaging is currently marked Coming Soon. Flower moulds are included by default on jar products.
const PACKAGING_OPTIONS = {
  standard: {
    label: "Standard Packaging",
    shortLabel: "Standard",
    priceDelta: 0,
    description: "Our carefully packed everyday presentation, keeping the Mysaa Rituals experience simple and beautiful."
  }
};

const PREMIUM_PACKAGING = {
  label: "Premium Packaging — Coming Soon",
  description: "Premium packaging is coming soon."
};

// Jar flower mould is now included by default on all jar products. There is no user-selectable jar finish option.
const JAR_VARIANT_DEFAULT = {
  label: "Flower mould on top",
  shortLabel: "Flower mould included",
  priceDelta: 0,
};

const MOLD_CANDLE_SHAPES = [
  "Daisy",
  "Rose",
  "Carnation",
  "Cactus",
  "Tortoise",
  "Laddu",
  "Chakli",
];
const MOLD_CANDLE_MOQ = 6;

const DISCOVERY_SET_SLUG = "discover-set-6-shot-glass-candles";
const DISCOVERY_SET_FRAGRANCES = [
  "gulab-ki-chitthi",
  "dhoop-chandan",
  "gajre-ka-shringar",
  "madhuban",
  "raat-ki-rani",
  "saanjh",
];

const FEELING_FILTERS = [
  { slug: "warm-grounding", title: "Warm & Grounding", description: "For quiet evenings, familiar rituals and comforting spaces.", fragrances: ["dhoop-chandan", "saanjh"] },
  { slug: "romantic-nostalgic", title: "Romantic & Nostalgic", description: "Soft florals and memories that feel close to the heart.", fragrances: ["gulab-ki-chitthi", "gajre-ka-shringar"] },
  { slug: "dreamy-evening", title: "Dreamy & Evening", description: "Night-blooming florals made for slower, intimate moments.", fragrances: ["madhuban", "raat-ki-rani"] },
];
const OCCASION_FILTERS = [
  { slug: "festivals-celebrations", title: "Festivals & Celebrations", description: "Recommended fragrances: Dhoop & Chandan and Madhuban." },
  { slug: "weddings-return-gifts", title: "Weddings & Return Gifts", description: "Recommended fragrances: Gajre Ka Shringar and Gulab Ki Chitthi." },
  { slug: "birthdays-just-because", title: "Birthdays & Just Because", description: "Recommended fragrances: Raat Ki Rani and Saanjh." },
];

function isJarProduct(product) {
  return product && ["hero-jar-candle", "wide-jar-candle"].includes(product.categorySlug);
}
function isMoldCandle(product) {
  return product && product.categorySlug === "mold-candles";
}
function isOutOfStock(product) {
  return product && String(product.availability || "").toLowerCase() === "out-of-stock";
}
function supportsPackaging(product) {
  return product && ["hero-jar-candle", "wide-jar-candle", "wax-melts"].includes(product.categorySlug);
}

function productImage(product, images, index = 0) {
  const key = `${product.fragranceSlug}/${product.categorySlug}`;
  const list = (images && images.products && images.products[key]) || [];
  return list[index];
}
function fragranceImage(fragrance, images, index = 0) {
  const list = (images && images.fragrances && images.fragrances[fragrance.slug]) || [];
  return list[index];
}

function ImageOrPlaceholder({ src, label: text, ratio = "4 / 5" }) {
  const [failed, setFailed] = React.useState(false);
  if (!src || failed) return <Placeholder label={text} ratio={ratio} />;
  return <div style={{aspectRatio: ratio, background: C.card, border: `1px solid ${C.line}`, overflow: "hidden"}}><img src={src} alt={text || "Mysaa Rituals"} onError={() => setFailed(true)} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} /></div>;
}

function waLink(number, message) {
  const clean = (number || "").replace(/[^0-9]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

const CART_KEY = "mysaa_rituals_cart_v1";
function readCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch (_) { return []; }
}
function writeCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("mysaa-cart-updated"));
}
function cartItemKey(item) {
  return [item.slug, item.shape || "", item.fragranceSlug || "", item.color || "", item.giftWrap ? "gift" : "no-gift"].join("|");
}
function addCartItem(item) {
  const items = readCart();
  const key = cartItemKey(item);
  const existing = items.find((x) => cartItemKey(x) === key);
  if (existing) existing.qty = Number(existing.qty || 0) + Number(item.qty || 1);
  else items.push({ ...item, key });
  writeCart(items);
  return items;
}
function updateCartItem(key, qty) {
  const items = readCart().map((item) => item.key === key ? { ...item, qty: Math.max(item.moq || 1, qty) } : item);
  writeCart(items);
}
function removeCartItem(key) { writeCart(readCart().filter((item) => item.key !== key)); }
function cartTotal(items) { return items.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.qty || 0) + (item.giftWrap ? Number(item.giftWrapCharge || 0) : 0), 0); }
function useCartCount() {
  const [count, setCount] = useState(() => readCart().reduce((n, item) => n + Number(item.qty || 0), 0));
  useEffect(() => {
    const refresh = () => setCount(readCart().reduce((n, item) => n + Number(item.qty || 0), 0));
    window.addEventListener("mysaa-cart-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("mysaa-cart-updated", refresh); window.removeEventListener("storage", refresh); };
  }, []);
  return count;
}

/* ---------- tiny hash router: #/page/param?query ---------- */
function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [pathPart, queryPart] = raw.split("?");
  const parts = pathPart.split("/").filter(Boolean);
  const page = parts[0] || "home";
  const param = parts[1] ? decodeURIComponent(parts[1]) : null;
  const query = {};
  if (queryPart) new URLSearchParams(queryPart).forEach((v, k) => (query[k] = v));
  return { page, param, query };
}
function buildHash(page, param, query) {
  let h = `#/${page}`;
  if (param) h += `/${encodeURIComponent(param)}`;
  if (query && Object.keys(query).length) h += `?${new URLSearchParams(query).toString()}`;
  return h;
}

/* ---------- data loading ----------
   images.json is generated by scripts/build_image_manifest.py, which
   scans the assets/catalogue folders and lists whatever photo files it
   finds there — any filename, any of jpg/jpeg/png/webp. That file is
   optional: if it hasn't been generated yet, every product just shows
   its text placeholder instead of failing to load. */
function useCatalogueData() {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const files = ["products", "fragrances", "categories", "settings"];
        const results = await Promise.all(
          files.map((f) => fetch(`data/${f}.json`).then((r) => {
            if (!r.ok) throw new Error(`Failed to load ${f}.json`);
            return r.json();
          }))
        );
        const images = await fetch("data/images.json").then((r) => r.ok ? r.json() : { products: {}, fragrances: {} }).catch(() => ({ products: {}, fragrances: {} }));
        if (!alive) return;
        const [products, fragrances, categories, settings] = results;
        setState({ loading: false, error: null, data: { products, fragrances, categories, settings, images } });
      } catch (err) {
        if (!alive) return;
        setState({ loading: false, error: err.message, data: null });
      }
    }
    load();
    return () => { alive = false; };
  }, []);
  return state;
}

/* ============================================================
   Shared UI
   ============================================================ */
function Placeholder({ label: text = "Product photograph", ratio = "4 / 5" }) {
  return (
    <div style={{
      aspectRatio: ratio, background: C.card, border: `1px solid ${C.line}`,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ ...sans, color: C.ink70, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Mysaa Rituals</p>
        <p style={{ ...sans, color: C.ink70, fontSize: 12 }}>{text}</p>
      </div>
    </div>
  );
}

function Button({ children, variant = "solid", onClick, href, target, style: styleOverride }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "13px 26px", fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase",
    transition: "opacity 0.2s", ...sans,
  };
  const variants = {
    solid: { background: C.ink, color: "#fff" },
    outline: { background: "transparent", color: C.ink, border: `1px solid ${C.ink}` },
    rust: { background: C.rust, color: "#fff" },
    ghost: { background: "transparent", color: C.ink, textDecoration: "underline", textUnderlineOffset: "4px", padding: "13px 4px" },
    link: { background: "transparent", color: C.rust, padding: "0" },
  };
  const Comp = href ? "a" : "button";
  return (
    <Comp
      href={href} target={target} rel={target === "_blank" ? "noreferrer" : undefined} onClick={onClick}
      style={{ ...base, ...variants[variant], ...styleOverride }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      {children}
    </Comp>
  );
}

function SectionHeading({ eyebrow, title, sub, align = "left" }) {
  return (
    <div style={{ maxWidth: 640, margin: align === "center" ? "0 auto" : 0, textAlign: align }}>
      {eyebrow && <p style={{ ...label, color: C.rust, marginBottom: 10 }}>{eyebrow}</p>}
      <h2 style={{ ...serif, color: C.ink, fontWeight: 500, fontSize: "clamp(26px,4vw,36px)", marginBottom: 12 }}>{title}</h2>
      {sub && <p style={{ ...sans, color: C.ink70, fontSize: 16, lineHeight: 1.7 }}>{sub}</p>}
    </div>
  );
}

function Logo({ size = 42 }) {
  return <img src="assets/logo.png" alt="Mysaa Rituals" style={{ height: size, width: "auto", objectFit: "contain" }} />;
}

function ChatIcon({ color = "currentColor", size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
function InstagramIcon({ color = "currentColor", size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill={color} stroke="none" />
    </svg>
  );
}
function SearchIcon({ color = "currentColor", size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}
function ChevronDownIcon({ color = "currentColor", size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
function HandIcon({ color = C.rust, size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M11 11V4a1.5 1.5 0 0 1 3 0v7" />
      <path d="M14 11V5.5a1.5 1.5 0 0 1 3 0V13" />
      <path d="M8 12l-1.6-1.4a1.4 1.4 0 0 0-2 2L8.6 17A5 5 0 0 0 12.4 19h1.1a5.5 5.5 0 0 0 5.5-5.5V9.5a1.5 1.5 0 0 0-3 0" />
    </svg>
  );
}
function FlameIcon({ color = C.rust, size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M12 2.5c1 3-3 4.5-3 8.5a3 3 0 0 0 6 0c0-1.5-1-2-1-3.5 1.5 1 3 3.2 3 5.5a5 5 0 0 1-10 0c0-4.5 4-6.5 5-10.5z" />
    </svg>
  );
}
function SparkleIcon({ color = C.rust, size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z" />
      <path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15z" />
    </svg>
  );
}
function GiftIcon({ color = C.rust, size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <rect x="3" y="9" width="18" height="11" rx="1" />
      <path d="M3 9h18v3H3z" fill={color} stroke="none" opacity={0.12} />
      <path d="M12 9v11" />
      <path d="M12 9C9 9 7.5 7.8 7.5 6.2A2.2 2.2 0 0 1 9.7 4c1.7 0 2.3 1.8 2.3 5z" />
      <path d="M12 9c3 0 4.5-1.2 4.5-2.8A2.2 2.2 0 0 0 14.3 4c-1.7 0-2.3 1.8-2.3 5z" />
    </svg>
  );
}
const WHY_ITEMS = [
  { icon: HandIcon, title: "Handcrafted", body: "Made with care, not mass-produced." },
  { icon: FlameIcon, title: "Fragrance-led", body: "Inspired by memories, moods and familiar Indian aromas." },
  { icon: SparkleIcon, title: "Personal", body: "Custom fragrances, formats, labels and gifting options." },
  { icon: GiftIcon, title: "Thoughtful Gifting", body: "Created for moments worth remembering." },
];
function WhyGrid({ items = WHY_ITEMS }) {
  return (
    <div className="why-grid">
      {items.map(({ icon: Icon, title, body }) => (
        <div key={title} className="hairline-top">
          <div style={{ marginBottom: 14 }}><Icon /></div>
          <h4 style={{ ...serif, fontSize: 17, color: C.ink, fontWeight: 500, marginBottom: 8 }}>{title}</h4>
          <p style={{ ...sans, fontSize: 13.5, color: C.ink70, lineHeight: 1.6 }}>{body}</p>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Header / Footer
   ============================================================ */
function Header({ nav, settings, route }) {
  const [open, setOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const links = [["Home", "home", null], ["Catalogue", "catalogue", "all"]];
  const discoverLinks = [
    ["Shop by Fragrance", "catalogue", "fragrance", null],
    ["Shop by Candle", "catalogue", "candle", null],
    ["Wax Melts & Sachets", "catalogue", "category", { value: "wax-melts" }],
    ["Gift Hampers", "catalogue", "category", { value: "gift-hampers" }],
    ["Create Your Ritual", "create-ritual", null, null],
  ];
  const tailLinks = [["About", "about", null], ["Contact", "contact", null]];
  const isActive = (page) => route && route.page === page;
  const linkStyle = (page) => ({ ...sans, fontSize: 14, color: isActive(page) ? C.rust : C.ink });
  const runSearch = () => { if (searchVal.trim()) nav("catalogue", "all", { q: searchVal.trim() }); setSearchOpen(false); };
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(250,247,240,0.94)", borderBottom: `1px solid ${C.line}`, backdropFilter: "blur(6px)" }}>

      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 76 }}>
        <button onClick={() => nav("home")} aria-label="Mysaa Rituals home" style={{ display: "flex", alignItems: "center" }}>
          <Logo size={78} />
        </button>

        <nav style={{ display: "flex", alignItems: "center", gap: 30 }} className="desktop-nav">
          {links.map(([lbl, page, param]) => (
            <button key={lbl} onClick={() => nav(page, param)} style={linkStyle(page)}>{lbl}</button>
          ))}
          <div style={{ position: "relative" }} onMouseEnter={() => setDiscoverOpen(true)} onMouseLeave={() => setDiscoverOpen(false)}>
            <button onClick={() => setDiscoverOpen((v) => !v)} style={{ ...sans, fontSize: 14, color: C.ink, display: "inline-flex", alignItems: "center", gap: 5 }}>
              Discover <ChevronDownIcon />
            </button>
            {discoverOpen && (
              <div style={{ position: "absolute", top: "100%", left: 0, background: "#FFFDFA", border: `1px solid ${C.line}`, boxShadow: "0 12px 28px rgba(68,55,47,0.12)", minWidth: 210, padding: "8px 0", zIndex: 60 }}>
                {discoverLinks.map(([lbl, page, param, query]) => (
                  <button key={lbl} onClick={() => { nav(page, param, query); setDiscoverOpen(false); }}
                    style={{ ...sans, display: "block", width: "100%", textAlign: "left", fontSize: 13.5, color: C.ink, padding: "10px 18px" }}>
                    {lbl}
                  </button>
                ))}
              </div>
            )}
          </div>
          {tailLinks.map(([lbl, page, param]) => (
            <button key={lbl} onClick={() => nav(page, param)} style={linkStyle(page)}>{lbl}</button>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => nav("cart")} aria-label="Cart" className="cart-nav-button">
            <span>Cart</span><span className="cart-count">{useCartCount()}</span>
          </button>
          <div className="desktop-nav" style={{ position: "relative" }}>
            {searchOpen ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input autoFocus value={searchVal} onChange={(e) => setSearchVal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") runSearch(); if (e.key === "Escape") setSearchOpen(false); }}
                  placeholder="Search…" style={{ ...sans, fontSize: 13, padding: "8px 12px", border: `1px solid ${C.line}`, background: "#fff", width: 170 }} />
                <button onClick={runSearch} aria-label="Search" style={{ color: C.ink }}><SearchIcon /></button>
              </div>
            ) : (
              <button onClick={() => setSearchOpen(true)} aria-label="Search" style={{ color: C.ink, display: "flex" }}><SearchIcon /></button>
            )}
          </div>
          <button className="mobile-only" onClick={() => setOpen(!open)} aria-label="Menu" style={{ padding: 8 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="1.6">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="mobile-only" style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 2, background: C.cream, borderTop: `1px solid ${C.line}` }}>
          {[...links.map((l) => [...l, null]), ...discoverLinks, ...tailLinks.map((l) => [...l, null]), ["Cart", "cart", null, null]].map(([lbl, page, param, query]) => (
            <button key={lbl} onClick={() => { nav(page, param, query); setOpen(false); }}
              style={{ ...sans, textAlign: "left", padding: "12px 4px", fontSize: 15, color: C.ink, borderBottom: `1px solid ${C.line}` }}>
              {lbl}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

function Footer({ nav, settings }) {
  return (
    <footer style={{ background: "#FCFAF7", borderTop: `1px solid ${C.line}`, marginTop: 80 }}>

      <div className="container" style={{ padding: "56px 20px 32px" }}>
        <div className="footer-grid">
          <div>
            <div style={{ marginBottom: 16 }}><Logo size={66} /></div>
            <p style={{ ...sans, color: C.ink70, fontSize: 14, lineHeight: 1.7, maxWidth: 300, marginBottom: 16 }}>
              {settings.tagline || "Every flame remembers."} Small-batch candles, wax melts and gift hampers, made slowly and in limited quantity.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <a href={settings.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"
                style={{ width: 34, height: 34, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.ink }}>
                <InstagramIcon />
              </a>
              <a href={waLink(settings.whatsapp, "Hello Mysaa Rituals!")} target="_blank" rel="noreferrer" aria-label="WhatsApp"
                style={{ width: 34, height: 34, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.ink }}>
                <ChatIcon />
              </a>
            </div>
          </div>
          <div>
            <h4 style={{ ...label, marginBottom: 16, color: C.ink70 }}>Explore</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => nav("catalogue", "all")} style={{ ...sans, fontSize: 14, color: C.ink, textAlign: "left" }}>Catalogue</button>
              <button onClick={() => nav("catalogue", "fragrance")} style={{ ...sans, fontSize: 14, color: C.ink, textAlign: "left" }}>Shop by Fragrance</button>
              <button onClick={() => nav("catalogue", "candle")} style={{ ...sans, fontSize: 14, color: C.ink, textAlign: "left" }}>Shop by Candle</button>
              <button onClick={() => nav("catalogue", "category", { value: "gift-hampers" })} style={{ ...sans, fontSize: 14, color: C.ink, textAlign: "left" }}>Gift Hampers</button>
              {settings.feedbackUrl && <a href={settings.feedbackUrl} target="_blank" rel="noreferrer" style={{ ...sans, fontSize: 14, color: C.rust }}>Share Feedback ↗</a>}
            </div>
          </div>
          <div>
            <h4 style={{ ...label, marginBottom: 16, color: C.ink70 }}>Reach us</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a href={waLink(settings.whatsapp, "Hello Mysaa Rituals!")} target="_blank" rel="noreferrer" style={{ ...sans, fontSize: 14, color: C.ink }}>WhatsApp</a>
              <a href={`mailto:${settings.email}`} style={{ ...sans, fontSize: 14, color: C.ink }}>{settings.email}</a>
              <a href={settings.instagram} target="_blank" rel="noreferrer" style={{ ...sans, fontSize: 14, color: C.ink }}>{settings.instagramHandle || "Instagram"}</a>
              {settings.phone && <span style={{ ...sans, fontSize: 14, color: C.ink }}>{settings.phone}</span>}
            </div>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 40, paddingTop: 20, ...sans, fontSize: 12, color: C.ink70, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span>© {new Date().getFullYear()} {settings.brandName || "Mysaa Rituals"}. All rights reserved.</span>
          {settings.address && <span style={{ letterSpacing: "0.04em", textTransform: "uppercase", fontSize: 11 }}>{settings.address}</span>}
        </div>
      </div>
    </footer>
  );
}


/* ============================================================
   Product / Fragrance cards
   ============================================================ */
function ProductCard({ product, fragrance, images, nav }) {
  const outOfStock = isOutOfStock(product);
  return (
    <button className={`product-card${outOfStock ? " product-card-out-of-stock" : ""}`} onClick={() => nav("product", product.slug)} style={{ textAlign: "left", display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
      <div className="hairline-top" style={{ paddingTop: 0 }}>
        <p style={{ ...label, color: C.ink70, marginBottom: 8, minHeight: 14 }}>
          {outOfStock ? "Out of Stock" : product.bestseller ? "Bestseller" : product.isNew ? "New" : product.customizable ? "Customizable" : "\u00A0"}
        </p>
        {isMoldCandle(product) ? (
          <div className="mold-product-card-visual"><div className="mold-image-placeholder">Add mold image</div></div>
        ) : (
          <ImageOrPlaceholder src={productImage(product, images, 0)} label={product.name} />
        )}
      </div>
      <div className="product-card-body" style={{ paddingTop: 14 }}>
        <h3 style={{ ...serif, fontSize: 17, color: C.ink, fontWeight: 500, marginBottom: 4 }}>{product.name}</h3>
        <p style={{ ...sans, fontSize: 13, color: C.ink70, marginBottom: 12 }} className="line-clamp-2">{product.shortDescription}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" }}>
          <DiscountedPrice product={product} currentPrice={product.price} />
          <span style={{ ...label, color: C.rust, textDecoration: "underline", textUnderlineOffset: "3px" }}>View Details</span>
        </div>
      </div>
    </button>
  );
}

function FragranceCard({ fragrance, images, nav }) {
  return (
    <button onClick={() => nav("catalogue", "fragrance", { value: fragrance.slug })} style={{ textAlign: "left", display: "block" }}>
      <ImageOrPlaceholder src={fragranceImage(fragrance, images, 0)} label={fragrance.name} ratio="4 / 5" />
      <div style={{ paddingTop: 14 }}>
        <h3 style={{ ...serif, fontSize: 17, color: C.ink, fontWeight: 500, marginBottom: 6 }}>{fragrance.name}</h3>
        <p style={{ ...sans, fontSize: 13, color: C.ink70, lineHeight: 1.6, marginBottom: 8 }} className="line-clamp-2">{fragrance.description}</p>
        <p style={{ ...label, color: C.ink70, fontSize: 10.5 }}>{(fragrance.mood || "").split(",").map((m) => m.trim()).join(" · ")}</p>
      </div>
    </button>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      ...sans, fontSize: 13, padding: "9px 16px", border: `1px solid ${active ? C.ink : C.line}`,
      background: active ? C.ink : "#fff", color: active ? "#fff" : C.ink,
    }}>
      {children}
    </button>
  );
}

/* ============================================================
   How to Order — reused on Home + Product pages
   ============================================================ */
const HOW_TO_ORDER_HOME = [
  { title: "Choose", body: "Find your fragrance, product or gift in the catalogue." },
  { title: "Enquire", body: "Add products to your cart and send the order to us by email." },
  { title: "Personalize", body: "Discuss fragrance, quantity, packaging or customization." },
  { title: "Confirm", body: "We confirm availability, pricing and final details personally." },
];
const HOW_TO_ORDER_PRODUCT = [
  { title: "Select", body: "Select the product and quantity you'd like." },
  { title: "Tap Order", body: "Add the product to your cart — your order details are collected for email." },
  { title: "Send", body: "Send your complete order to us by email." },
  { title: "Confirm", body: "We confirm availability, price and delivery details." },
];

function HowToOrder({ steps, eyebrow = "How to Order", title = "Simple, personal, unhurried." }) {
  return (
    <div>
      <SectionHeading eyebrow={eyebrow} title={title} />
      <div className="steps-grid" style={{ marginTop: 32 }}>
        {steps.map((s, i) => (
          <div key={s.title} className="hairline-top">
            <p style={{ ...label, color: C.ink70, marginBottom: 14 }}>{String(i + 1).padStart(2, "0")}</p>
            <h4 style={{ ...serif, fontSize: 17, color: C.ink, fontWeight: 500, marginBottom: 8 }}>{s.title}</h4>
            <p style={{ ...sans, fontSize: 13.5, color: C.ink70, lineHeight: 1.6 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Pages
   ============================================================ */
function FestivalBanner({ nav, settings }) {
  const enabled = String(settings.festivalBannerEnabled ?? "true").toLowerCase() !== "false";
  if (!enabled) return null;
  const eyebrow = settings.festivalBannerEyebrow || "Festive Collection";
  const title = settings.festivalBannerTitle || "Light up the season. Gift a little warmth.";
  const text = settings.festivalBannerText || "Our festive edit brings together candles and thoughtful gifts for Navratri, Dussehra and the celebrations ahead.";
  const buttonText = settings.festivalBannerButtonText || "Shop the Festive Collection";
  const image = settings.festivalBannerImage || "";
  const action = () => {
    const category = settings.festivalBannerCategory || "festivals-celebrations";
    nav("catalogue", "occasion", { value: category });
  };
  return (
    <section className="festival-banner" aria-label={eyebrow}>
      <div className="container festival-banner-inner">
        <div className="festival-banner-copy">
          <p style={{ ...label, color: C.rust, marginBottom: 12 }}>{eyebrow}</p>
          <h2 style={{ ...serif, fontSize: "clamp(28px,4vw,42px)", color: C.ink, fontWeight: 500, lineHeight: 1.05, marginBottom: 12 }}>{title}</h2>
          <p style={{ ...sans, color: C.ink70, fontSize: 15, lineHeight: 1.7, maxWidth: 560, marginBottom: 22 }}>{text}</p>
          <Button variant="rust" onClick={action}>{buttonText} →</Button>
        </div>
        {image && <ImageOrPlaceholder src={image} label={eyebrow} ratio="4 / 3" />}
      </div>
    </section>
  );
}

function HomePage({ data, nav, settings }) {
  const fragranceById = Object.fromEntries(data.fragrances.map((f) => [f.slug, f]));
  const activeFragrances = data.fragrances.filter((f) => f.active);

  // Homepage collection: prioritize products explicitly marked as bestsellers
  // across candle formats. If the data has no bestseller flags yet, fall back
  // to a balanced mix of Signature Ritual, Everyday Ritual and Mini Ritual candles.
  const candleProducts = data.products.filter((p) =>
    p.active && ["hero-jar-candle", "wide-jar-candle", "shot-glass-candle"].includes(p.categorySlug)
  );
  const bestsellerProducts = candleProducts.filter((p) => p.bestseller);
  const mixedFallback = activeFragrances.map((fragrance, index) => {
    const preferredCategory = ["hero-jar-candle", "wide-jar-candle", "shot-glass-candle"][index % 3];
    return candleProducts.find((p) => p.fragranceSlug === fragrance.slug && p.categorySlug === preferredCategory);
  }).filter(Boolean);
  const featured = (bestsellerProducts.length ? bestsellerProducts : mixedFallback)
    .slice(0, 6);

  const discoverySet = data.products.find((p) => p.slug === DISCOVERY_SET_SLUG);

  const feelingGroups = FEELING_FILTERS;
  const occasionGroups = OCCASION_FILTERS;

  return (
    <div>
      {/* Hero */}
      <section style={{ borderBottom: `1px solid ${C.line}` }}>
        <div className="container hero-grid" style={{ padding: "72px 20px 64px" }}>
          <div style={{ maxWidth: 540 }}>
            <p style={{ ...label, color: C.rust, marginBottom: 16 }}>Handcrafted in small batches</p>
            <h1 style={{ ...serif, fontSize: "clamp(38px,6vw,56px)", color: C.ink, fontWeight: 500, lineHeight: 1.02, marginBottom: 20 }}>
              Fragrance, Made Personal.
            </h1>
            <p style={{ ...sans, fontSize: 16, color: C.ink70, lineHeight: 1.75, marginBottom: 30, maxWidth: 470 }}>
              Handcrafted candles and gifts inspired by Indian fragrances, memories and everyday rituals.
            </p>
            <div className="hero-actions">
              <button className="hero-action hero-action-primary" onClick={() => nav("catalogue", "all")}>Explore the Catalogue</button>
              <button className="hero-action hero-action-secondary" onClick={() => nav("create-ritual")}>Create Your Ritual</button>
            </div>
          </div>
          <ImageOrPlaceholder src={data.images?.site?.hero} label="Hero product photograph" ratio="4 / 3" />
        </div>
      </section>

      <FestivalBanner nav={nav} settings={settings} />

      {/* Fragrance introduction */}
      <section className="container" style={{ padding: "72px 20px 24px" }}>
        <SectionHeading
          eyebrow="The Fragrances"
          title="Every fragrance holds a feeling."
          sub="From the warmth of sandalwood to the romance of jasmine and the mystery of night-blooming flowers, each Mysaa Ritual is created to evoke something personal."
        />
      </section>

      {/* Fragrance collection */}
      <section className="container" style={{ padding: "24px 20px 72px" }}>
        <div className="fragrance-grid">
          {activeFragrances.map((f) => (
            <FragranceCard key={f.slug} fragrance={f} images={data.images} nav={nav} />
          ))}
        </div>
      </section>

      {/* Discovery Set */}
      {discoverySet && (
        <section className="container" style={{ padding: "8px 20px 72px" }}>
          <div className="discovery-set-feature">
            <ImageOrPlaceholder src={productImage(discoverySet, data.images, 0)} label={discoverySet.name} ratio="4 / 3" />
            <div>
              <p style={{ ...label, color: C.rust, marginBottom: 12 }}>New · Discovery Set</p>
              <h2 style={{ ...serif, fontSize: "clamp(28px,3.6vw,36px)", color: C.ink, fontWeight: 500, marginBottom: 12 }}>Six fragrances. One beautiful beginning.</h2>
              <p style={{ ...sans, fontSize: 15, color: C.ink70, lineHeight: 1.75, maxWidth: 520, marginBottom: 18 }}>
                Explore all six Mysaa Rituals fragrances in six 60 ml Mini Ritual candles — a complete set for discovering the scent that becomes your ritual.
              </p>
              <div className="price-stack price-stack-large" style={{ marginBottom: 20 }}>
                 <span style={{ ...sans, fontSize: 20, color: C.ink, fontWeight: 500 }}>{inr(discoverySet.price)}</span>
               </div>
              <Button variant="outline" onClick={() => nav("product", discoverySet.slug)}>View Discovery Set →</Button>
            </div>
          </div>
        </section>
      )}

      {/* Discovery cards */}
      <section style={{ background: C.card, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
        <div className="container" style={{ padding: "72px 20px" }}>
          <SectionHeading eyebrow="Discover" title="Discover your ritual" align="center" />
          <div className="discovery-grid" style={{ marginTop: 38 }}>
            <button onClick={() => nav("catalogue", "fragrance")} className="editorial-card">
              <p style={{ ...label, color: C.rust, marginBottom: 12 }}>01</p>
              <h3 style={{ ...serif, fontSize: 24, color: C.ink, fontWeight: 500, marginBottom: 8 }}>Shop by Fragrance</h3>
              <p style={{ ...sans, fontSize: 14, color: C.ink70, lineHeight: 1.65, marginBottom: 16 }}>Find the scent that feels like you.</p>
              <span style={{ ...label, color: C.rust }}>Explore →</span>
            </button>
            <button onClick={() => nav("catalogue", "candle")} className="editorial-card">
              <p style={{ ...label, color: C.rust, marginBottom: 12 }}>02</p>
              <h3 style={{ ...serif, fontSize: 24, color: C.ink, fontWeight: 500, marginBottom: 8 }}>Shop by Candle</h3>
              <p style={{ ...sans, fontSize: 14, color: C.ink70, lineHeight: 1.65, marginBottom: 16 }}>Choose your format first — Signature Ritual, Everyday Ritual, Mini Ritual or Grand Ritual.</p>
              <span style={{ ...label, color: C.rust }}>Explore →</span>
            </button>
          </div>

          <div className="discovery-grid compact-discovery-grid" style={{ marginTop: 16 }}>
            <div className="editorial-card compact-editorial-card">
              <p style={{ ...label, color: C.rust, marginBottom: 10 }}>03</p>
              <h3 style={{ ...serif, fontSize: 24, color: C.ink, fontWeight: 500, marginBottom: 8 }}>Shop by Feeling</h3>
              <p style={{ ...sans, fontSize: 13.5, color: C.ink70, lineHeight: 1.55, marginBottom: 16 }}>Start with the mood you want to bring into your space.</p>
              <select className="discovery-select" defaultValue="" onChange={(e) => e.target.value && nav("catalogue", "feeling", { value: e.target.value })} aria-label="Shop by feeling">
                <option value="" disabled>Choose a feeling</option>
                {feelingGroups.map((group) => <option key={group.slug} value={group.slug}>{group.title}</option>)}
              </select>
            </div>
            <div className="editorial-card compact-editorial-card">
              <p style={{ ...label, color: C.rust, marginBottom: 10 }}>04</p>
              <h3 style={{ ...serif, fontSize: 24, color: C.ink, fontWeight: 500, marginBottom: 8 }}>Shop by Occasion</h3>
              <p style={{ ...sans, fontSize: 13.5, color: C.ink70, lineHeight: 1.55, marginBottom: 16 }}>Choose something for the moment you're celebrating.</p>
              <select className="discovery-select" defaultValue="" onChange={(e) => e.target.value && nav("catalogue", "occasion", { value: e.target.value })} aria-label="Shop by occasion">
                <option value="" disabled>Choose an occasion</option>
                {occasionGroups.map((group) => <option key={group.slug} value={group.slug}>{group.title}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="container" style={{ padding: "72px 20px" }}>
        <SectionHeading eyebrow="Best Sellers" title="Made to be lit slowly." sub="A selection of Mysaa candles across our Signature Ritual, Everyday Ritual and Mini Ritual formats." />
        <div className="product-grid" style={{ marginTop: 36 }}>
          {featured.map((p) => (
            <ProductCard key={p.slug} product={p} fragrance={fragranceById[p.fragranceSlug]} images={data.images} nav={nav} />
          ))}
        </div>
        <div style={{ marginTop: 30 }}>
          <Button variant="ghost" onClick={() => nav("catalogue", "all")}>View the full collection →</Button>
        </div>
      </section>

      {/* Personalization */}
      <section className="container" style={{ padding: "16px 20px 72px" }}>
        <div className="personalize-grid">
          <ImageOrPlaceholder
  src="assets/personalisation.jpeg"
  label="Personalization options"
  ratio="4 / 3"
/>
          <div>
            <p style={{ ...label, color: C.rust, marginBottom: 14 }}>Personalization</p>
            <h2 style={{ ...serif, fontSize: "clamp(28px,3.6vw,36px)", color: C.ink, fontWeight: 500, marginBottom: 16 }}>Made for your moment.</h2>
            <p style={{ ...sans, fontSize: 15, color: C.ink70, lineHeight: 1.75, marginBottom: 24, maxWidth: 450 }}>
              Have something specific in mind? Choose your fragrance, shape, label or packaging and let us create something personal for you.
            </p>
            <Button variant="ghost" onClick={() => nav("create-ritual")}>Create Your Ritual →</Button>
          </div>
        </div>
      </section>

      {/* Gifting */}
      <section style={{ background: C.card, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
        <div className="container gifting-grid" style={{ padding: "72px 20px" }}>
          <div>
            <p style={{ ...label, color: C.rust, marginBottom: 14 }}>Gifting</p>
            <h2 style={{ ...serif, fontSize: "clamp(28px,3.6vw,36px)", color: C.ink, fontWeight: 500, marginBottom: 16 }}>Gifts that feel personal.</h2>
            <p style={{ ...sans, fontSize: 15, color: C.ink70, lineHeight: 1.75, maxWidth: 450, marginBottom: 22 }}>
              Thoughtful pieces for festivals, birthdays, weddings, housewarmings, return gifts and moments that deserve a little more thought.
            </p>
            <div className="gifting-list gifting-recommendations">
              <button onClick={() => nav("catalogue", "occasion", { value: "festivals-celebrations" })}><strong>Festivals</strong><span>Dhoop & Chandan · Madhuban</span></button>
              <button onClick={() => nav("catalogue", "occasion", { value: "weddings-return-gifts" })}><strong>Weddings</strong><span>Gajre Ka Shringar · Gulab Ki Chitthi</span></button>
              <button onClick={() => nav("catalogue", "occasion", { value: "birthdays-just-because" })}><strong>Birthdays & Just Because</strong><span>Raat Ki Rani · Saanjh</span></button>
            </div>
            <Button variant="link" onClick={() => nav("catalogue", "category", { value: "gift-hampers" })} style={{ marginTop: 26, color: C.rust, fontWeight: 600, letterSpacing: "0.11em", textTransform: "uppercase", textDecoration: "underline", textUnderlineOffset: "4px" }}>Explore Gifting →</Button>
          </div>
          <ImageOrPlaceholder src={data.images?.site?.gifting} label="Hand-packed Mysaa Rituals gift hamper" ratio="4 / 3" />
        </div>
      </section>

      {/* Brand story */}
      <section className="container" style={{ padding: "72px 20px" }}>
        <div className="story-block">
          <SectionHeading eyebrow="Our Story" title="More than a candle." />
          <div className="home-story-copy">
            <p>Mysaa Rituals was created around a simple idea — that fragrance has the power to turn ordinary moments into memories.</p>
            <p>Every piece is handcrafted with care, inspired by familiar Indian aromas and designed to become part of someone's ritual.</p>
          </div>
          <div style={{ marginTop: 26 }}>
            <Button variant="ghost" onClick={() => nav("about")}>Read Our Story →</Button>
          </div>
          <div style={{ marginTop: 32 }}>
            <ImageOrPlaceholder src={data.images?.site?.story} label="Our Story" ratio="16 / 9" />
          </div>
        </div>
      </section>

      {/* Why Mysaa */}
      <section style={{ borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
        <div className="container" style={{ padding: "72px 20px" }}>
          <SectionHeading eyebrow="Why Mysaa Rituals" title="Slow, deliberate, personal." />
          <div style={{ marginTop: 34 }}><WhyGrid /></div>
        </div>
      </section>

      {/* Order flow */}
      <section className="container" style={{ padding: "72px 20px" }}>
        <HowToOrder
          steps={[
            { title: "Choose", body: "Pick your fragrance, format or gift." },
            { title: "Enquire", body: "Send us your order through the cart by email." },
            { title: "Personalize", body: "Share quantity, occasion and preferences." },
            { title: "Confirm", body: "We confirm availability, final price and delivery details." },
          ]}
          title="Simple, personal, unhurried."
        />
      </section>

      {/* Instagram / contact CTA */}
      <section style={{ background: C.ink, color: "#fff" }}>
        <div className="container" style={{ padding: "64px 20px", textAlign: "center" }}>
          <p style={{ ...label, color: "#D8CFC3", marginBottom: 12 }}>Mysaa Rituals</p>
          <h2 style={{ ...serif, fontSize: "clamp(26px,3.4vw,34px)", fontWeight: 500, marginBottom: 12 }}>Have something special in mind?</h2>
          <p style={{ ...sans, fontSize: 14, color: "#D8CFC3", maxWidth: 460, margin: "0 auto 24px", lineHeight: 1.7 }}>
            Tell us what you're looking for and we'll help you create the right ritual.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 22, flexWrap: "wrap" }}>
            <a href={`mailto:${settings.email}`} style={{ ...label, color: "#fff", textDecoration: "underline", textUnderlineOffset: "4px" }}>
              Order by Email
            </a>
            <a href={settings.instagram} target="_blank" rel="noreferrer" style={{ ...label, color: "#fff", textDecoration: "underline", textUnderlineOffset: "4px" }}>
              Follow @mysaarituals
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function CataloguePage({ data, nav, initialType, initialQuery }) {
  const maxPrice = useMemo(() => Math.max(1000, ...data.products.map((p) => p.price || 0)), [data.products]);
  const [fragrance, setFragrance] = useState(initialType === "fragrance" ? (initialQuery.value || "all") : "all");
  const [category, setCategory] = useState(initialType === "category" ? (initialQuery.value || "all") : initialType === "candle" ? "hero-jar-candle" : "all");
  const [feeling, setFeeling] = useState(initialType === "feeling" ? (initialQuery.value || "all") : "all");
  const [occasion, setOccasion] = useState(initialType === "occasion" ? (initialQuery.value || "all") : "all");
  const [search, setSearch] = useState(initialQuery.q || "");
  const [priceCap, setPriceCap] = useState(maxPrice);

  // Keep catalogue filters in sync when navigation changes the hash while
  // this page component remains mounted (for example via Discover).
  useEffect(() => {
    setFragrance(initialType === "fragrance" ? (initialQuery.value || "all") : "all");
    setCategory(initialType === "category" ? (initialQuery.value || "all") : initialType === "candle" ? "hero-jar-candle" : "all");
    setFeeling(initialType === "feeling" ? (initialQuery.value || "all") : "all");
    setOccasion(initialType === "occasion" ? (initialQuery.value || "all") : "all");
    setSearch(initialQuery.q || "");
    setPriceCap(maxPrice);
  }, [initialType, initialQuery.value, initialQuery.q, maxPrice]);

  const fragranceById = Object.fromEntries(data.fragrances.map((f) => [f.slug, f]));

  const filtered = useMemo(() => {
    return data.products.filter((p) => {
      if (!p.active) return false;
      if (category !== "all" && p.categorySlug !== category) return false;
      if (fragrance !== "all" && p.fragranceSlug !== fragrance) return false;
      if (feeling !== "all") {
        const group = FEELING_FILTERS.find((item) => item.slug === feeling);
        if (!group || !group.fragrances.includes(p.fragranceSlug)) return false;
      }
      if (occasion !== "all") {
        const group = OCCASION_FILTERS.find((item) => item.slug === occasion);
        const assigned = Array.isArray(p.occasionSlugs) ? p.occasionSlugs : [];
        if (!group || !assigned.includes(occasion)) return false;
      }
      if ((p.price || 0) > priceCap) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !(p.shortDescription || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [data.products, category, fragrance, feeling, occasion, search, priceCap]);

  const filtersActive = category !== "all" || fragrance !== "all" || feeling !== "all" || occasion !== "all" || !!search || priceCap < maxPrice;
  const resetFilters = () => { setCategory("all"); setFragrance("all"); setFeeling("all"); setOccasion("all"); setSearch(""); setPriceCap(maxPrice); };

  return (
    <div className="container" style={{ padding: "48px 20px 80px" }}>
      <SectionHeading eyebrow="Catalogue" title="The Collection" sub="Explore fragrances, candles and gifts made for everyday rituals and meaningful moments." />

      <div className="catalogue-layout" style={{ marginTop: 36 }}>
        <aside>
          <div style={{ marginBottom: 32 }}>
            <p style={{ ...label, color: C.ink70, marginBottom: 10 }}>Search</p>
            <input
              value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by product, fragrance or feeling…"
              style={{ ...sans, fontSize: 14, padding: "12px 16px", width: "100%", border: `1px solid ${C.line}`, background: "#FCFAF7" }}
            />
          </div>

          <div style={{ marginBottom: 32 }}>
            <p style={{ ...label, color: C.ink70, marginBottom: 12 }}>{priceCap >= maxPrice ? "Up to any price" : `Up to ${inr(priceCap)}`}</p>
            <input type="range" min={0} max={maxPrice} step={50} value={priceCap} onChange={(e) => setPriceCap(Number(e.target.value))} className="price-range" />
          </div>

          <div style={{ marginBottom: 32 }}>
            <p style={{ ...label, color: C.ink70, marginBottom: 10 }}>Shop by Category</p>
            <div className="chip-wrap">
              <FilterChip active={category === "all"} onClick={() => setCategory("all")}>All</FilterChip>
              {data.categories.filter((c) => c.active).map((c) => (
                <FilterChip key={c.slug} active={category === c.slug} onClick={() => setCategory(c.slug)}>{c.name}</FilterChip>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <p style={{ ...label, color: C.ink70, marginBottom: 10 }}>Shop by Fragrance</p>
            <div className="chip-wrap">
              <FilterChip active={fragrance === "all"} onClick={() => setFragrance("all")}>All</FilterChip>
              {data.fragrances.filter((f) => f.active).map((f) => (
                <FilterChip key={f.slug} active={fragrance === f.slug} onClick={() => setFragrance(f.slug)}>{f.name}</FilterChip>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ ...label, color: C.ink70, display: "block", marginBottom: 10 }}>Shop by Feeling</label>
            <select value={feeling} onChange={(e) => setFeeling(e.target.value)} className="catalogue-select">
              <option value="all">All feelings</option>
              {FEELING_FILTERS.map((group) => <option key={group.slug} value={group.slug}>{group.title}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 32 }}>
            <label style={{ ...label, color: C.ink70, display: "block", marginBottom: 10 }}>Shop by Occasion</label>
            <select value={occasion} onChange={(e) => setOccasion(e.target.value)} className="catalogue-select">
              <option value="all">All occasions</option>
              {OCCASION_FILTERS.map((group) => <option key={group.slug} value={group.slug}>{group.title}</option>)}
            </select>
          </div>

          {filtersActive && (
            <button onClick={resetFilters} style={{ ...label, color: C.rust, textAlign: "left", textDecoration: "underline", textUnderlineOffset: "3px" }}>
              Clear filters
            </button>
          )}
        </aside>

        <div>
          {filtered.length === 0 ? (
            <div style={{ border: `1px solid ${C.line}`, background: C.card, padding: "80px 24px", textAlign: "center" }}>
              <h3 style={{ ...serif, fontSize: 24, color: C.ink, fontWeight: 500, marginBottom: 14 }}>Nothing here yet.</h3>
              <p style={{ ...sans, fontSize: 14.5, color: C.ink70, lineHeight: 1.7, maxWidth: 420, margin: "0 auto 22px" }}>
                Try a different fragrance or feeling — or tell us what you're imagining and we'll create it.
              </p>
              <Button variant="outline" onClick={resetFilters}>Clear filters</Button>
            </div>
          ) : (
            <>
              <p style={{ ...sans, fontSize: 13, color: C.ink70, marginBottom: 20 }}>{filtered.length} product{filtered.length !== 1 ? "s" : ""} found</p>
              <div className="product-grid">
                {filtered.map((p) => <ProductCard key={p.slug} product={p} fragrance={fragranceById[p.fragranceSlug]} images={data.images} nav={nav} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductGallery({ product, images }) {
  const gallery = (images && images.products && images.products[`${product.fragranceSlug}/${product.categorySlug}`]) || [];
  const [activeIndex, setActiveIndex] = useState(0);
  const total = gallery.length;

  useEffect(() => {
    setActiveIndex(0);
  }, [product.slug]);

  const move = (direction) => {
    if (total < 2) return;
    setActiveIndex((current) => (current + direction + total) % total);
  };

  return (
    <div className="product-gallery">
      <div style={{ position: "relative" }}>
        <ImageOrPlaceholder src={gallery[activeIndex]} label={product.name} ratio="4 / 5" />
        {total > 1 && (
          <>
            <button className="gallery-arrow gallery-arrow-left" onClick={() => move(-1)} aria-label="Previous product image">‹</button>
            <button className="gallery-arrow gallery-arrow-right" onClick={() => move(1)} aria-label="Next product image">›</button>
            <div className="gallery-counter">{activeIndex + 1} / {total}</div>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="product-gallery-thumbs" aria-label="Product photographs">
          {gallery.map((src, index) => (
            <button
              key={src}
              className={`gallery-thumb${index === activeIndex ? " active" : ""}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`View product image ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
            >
              <img src={src} alt={`${product.name} photograph ${index + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MoldShapeVisual({ shape }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" };
  const shapes = {
    Daisy: <><circle cx="50" cy="50" r="10" {...common}/>{Array.from({length:8}).map((_,i)=>{const a=i*Math.PI/4; return <ellipse key={i} cx={50+28*Math.cos(a)} cy={50+28*Math.sin(a)} rx="9" ry="16" transform={`rotate(${i*45} ${50+28*Math.cos(a)} ${50+28*Math.sin(a)})`} {...common}/>})}</>,
    Rose: <path d="M50 78c-20-2-30-15-26-29 3-10 13-17 25-17 11 0 22 6 25 16 5 15-7 29-24 30ZM35 50c9-8 23-8 31 0M39 42c7-6 16-6 22 0M44 35c4-3 8-3 12 0" {...common}/>,
    Carnation: <path d="M30 55c5-14 14-22 20-18 6-4 15 4 20 18 2 8-1 17-8 22H38c-7-5-10-14-8-22Zm6-8c5 4 10 4 14 0 5 4 10 4 14 0M38 58c8 5 16 5 24 0M41 67c6 3 12 3 18 0" {...common}/>,
    Cactus: <path d="M42 78V39c0-9 6-15 12-15s12 6 12 15v8h6v-8c0-4 3-7 7-7s7 3 7 7v12c0 9-7 16-16 16h-4v11H42ZM42 52H34c-5 0-9-4-9-9V35c0-4 3-7 7-7s7 3 7 7v6h3" {...common}/>,
    Tortoise: <path d="M24 58c4-16 17-25 31-25s27 9 31 25c-5 12-17 19-31 19S29 70 24 58Zm8-2c8 8 16 12 23 12 8 0 16-4 23-12M50 34v38M33 48c12 6 24 6 34 0M31 72l-8 5M69 72l8 5M26 55l-8-4M74 55l8-4" {...common}/>,
    Laddu: <circle cx="50" cy="54" r="28" {...common}/>,
    Chakli: <path d="M50 79c-18 0-31-10-31-24 0-16 14-28 31-28s31 12 31 28c0 14-13 24-31 24Zm0-8c-12 0-21-6-21-16 0-10 9-18 21-18s21 8 21 18c0 10-9 16-21 16Zm0-8c-6 0-11-3-11-8s5-10 11-10 11 5 11 10-5 8-11 8Z" {...common}/>
  };
  return <svg viewBox="0 0 100 100" className="mold-shape-visual" aria-hidden="true">{shapes[shape] || shapes.Daisy}</svg>;
}

const MOLD_COLORS = [
  { name: "Ivory", hex: "#EFE7D8" },
  { name: "Blush", hex: "#E9C4BD" },
  { name: "Dusty Rose", hex: "#C98E86" },
  { name: "Sage", hex: "#AAB39D" },
  { name: "Olive", hex: "#96966A" },
  { name: "Terracotta", hex: "#C77A4D" },
  { name: "Mocha", hex: "#8A6652" },
  { name: "Charcoal", hex: "#4A4744" },
];

function MoldCandleProductPage({ data, nav, product, settings }) {
  const [shape, setShape] = useState(MOLD_CANDLE_SHAPES[0]);
  const [fragranceSlug, setFragranceSlug] = useState("raat-ki-rani");
  const [color, setColor] = useState("Dusty Rose");
  const [qty, setQty] = useState(MOLD_CANDLE_MOQ);
  const [giftWrap, setGiftWrap] = useState(false);
  const fragrance = data.fragrances.find((f) => f.slug === fragranceSlug);
  const colorData = MOLD_COLORS.find((c) => c.name === color) || MOLD_COLORS[2];
  const batchPrice = Number(product.price || 399);
  const baseQty = MOLD_CANDLE_MOQ;
  const unitPiecePrice = batchPrice / baseQty;
  const subtotal = Math.round(unitPiecePrice * qty);
  const giftWrapCharge = Number(settings.giftWrapCharge || GIFT_WRAP_CHARGE);
  const total = subtotal + (giftWrap ? giftWrapCharge : 0);
  const enquiryMsg = `Hello Mysaa Rituals! I'd like to order a custom Mold Candle batch:\n\nMould: ${shape}\nFragrance: ${fragrance ? fragrance.name : fragranceSlug}\nPrimary colour: ${color}\nQuantity: ${qty} pieces (MOQ ${MOLD_CANDLE_MOQ})\nBatch price basis: ${inr(batchPrice)} for ${baseQty} pieces\n${giftWrap ? `Gift wrapping: Yes (+${inr(giftWrapCharge)})\n` : "Gift wrapping: No\n"}Total: ${inr(total)}\n\nPlease confirm availability and delivery details.`;
  const addMoldToCart = () => {
    addCartItem({
      slug: product.slug, name: product.name, unitPrice: unitPiecePrice, qty, moq: MOLD_CANDLE_MOQ,
      shape, fragranceSlug, fragranceName: fragrance ? fragrance.name : fragranceSlug, color, giftWrap, giftWrapCharge,
      details: `Mould: ${shape}; Fragrance: ${fragrance ? fragrance.name : fragranceSlug}; Primary colour: ${color}`,
    });
  };

  return (
    <div className="container mold-page" style={{ padding: "32px 20px 80px" }}>
      <p style={{ ...label, color: C.ink70, marginBottom: 24 }}>
        <button onClick={() => nav("catalogue", "all")} style={{ ...label, color: C.ink70 }}>Catalogue</button>{" / "}<span style={{ color: C.ink }}>Mold Candles</span>
      </p>

      <div className="mold-page-heading">
        <div>
          <p style={{ ...label, color: C.rust, marginBottom: 10 }}>Custom Candle Studio</p>
          <h1 style={{ ...serif, color: C.ink, fontSize: "clamp(34px,5vw,52px)", fontWeight: 500, lineHeight: 1.02, marginBottom: 10 }}>Mold Candles</h1>
          <p style={{ ...sans, color: C.ink70, fontSize: 14.5, lineHeight: 1.7, maxWidth: 680 }}>Minimum order 6 pieces · <strong style={{ color: C.ink }}>₹399 for 6 pieces</strong>. Create your own batch by choosing a mould, fragrance and primary colour.</p>
        </div>
      </div>

      <div className="mold-builder-grid">
        <div className="mold-builder">
          <section className="mold-step">
            <div className="mold-step-heading"><span>1</span><h2>Choose your mould</h2></div>
            <div className="mold-shape-grid">
              {MOLD_CANDLE_SHAPES.map((item) => (
                <button key={item} onClick={() => setShape(item)} className={`mold-shape-card${shape === item ? " selected" : ""}`}>
                  <div className="mold-shape-art"><div className="mold-image-placeholder">Add mold image</div></div>
                  <span>{item}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="mold-step">
            <div className="mold-step-heading"><span>2</span><h2>Choose your fragrance</h2></div>
            <div className="mold-fragrance-grid">
              {data.fragrances.filter((f) => f.active).map((f) => (
                <button key={f.slug} onClick={() => setFragranceSlug(f.slug)} className={`mold-fragrance-card${fragranceSlug === f.slug ? " selected" : ""}`}>
                  <strong>{f.name}</strong>
                </button>
              ))}
            </div>
            <button className="mold-more-link" onClick={() => nav("catalogue", "fragrance", { value: fragranceSlug })}>View fragrance notes →</button>
          </section>

          <section className="mold-step">
            <div className="mold-step-heading"><span>3</span><h2>Choose your primary colour</h2></div>
            <div className="mold-color-grid">
              {MOLD_COLORS.map((c) => (
                <button key={c.name} onClick={() => setColor(c.name)} className={`mold-color-card${color === c.name ? " selected" : ""}`}>
                  <span className="mold-color-swatch" style={{ background: c.hex }} />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="mold-note"><strong>One batch = one mould + one fragrance + one primary colour.</strong><span>Minimum order is 6 pieces. You can increase the quantity after selecting your batch.</span></div>
        </div>

        <aside className="mold-summary">
          <p style={{ ...label, color: C.ink70, marginBottom: 16 }}>Your selection</p>
          <div className="mold-summary-preview"><div className="mold-summary-art" style={{ background: colorData.hex }}><div className="mold-image-placeholder">Add mold image</div></div><div><strong>{shape}</strong><span>{fragrance ? fragrance.name : ""}</span><span>{color}</span></div></div>
          <div className="mold-summary-line"><span>Quantity</span><div className="mold-quantity"><button onClick={() => setQty((q) => Math.max(MOLD_CANDLE_MOQ, q - 1))}>−</button><strong>{qty}</strong><button onClick={() => setQty((q) => q + 1)}>+</button></div></div>
          <div className="mold-summary-price"><span>Current batch price</span><strong>{inr(subtotal)}</strong><small>Batch basis: ₹399 for the minimum 6 pieces</small></div>
          <div className="mold-moq-note">Minimum order: {MOLD_CANDLE_MOQ} pieces. Your selected mould, fragrance and colour will be made as one batch.</div>
          <div className="mold-gift-wrap">
            <label><input type="checkbox" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} /><span><strong>Gift wrapping</strong><small>+{inr(giftWrapCharge)}</small></span></label>
          </div>
          <button className="mold-create-button" onClick={addMoldToCart}>Add batch to cart <span>→</span></button>
          <button className="mold-enquiry-button" onClick={addMoldToCart}>Add to cart</button>
        </aside>
      </div>
    </div>
  );
}

function ProductDetailPage({ data, nav, slug, settings }) {
  const productForState = data.products.find((p) => p.slug === slug);
  const isMoldForState = isMoldCandle(productForState);
  const [qty, setQty] = useState(isMoldForState ? MOLD_CANDLE_MOQ : 1);
  const [giftWrap, setGiftWrap] = useState(false);
  const [moldShape, setMoldShape] = useState(MOLD_CANDLE_SHAPES[0]);
  const [moldFragrance, setMoldFragrance] = useState("raat-ki-rani");
  const [moldColor, setMoldColor] = useState("Dusty Rose");
  const product = data.products.find((p) => p.slug === slug);

  useEffect(() => {
    const mold = isMoldCandle(product);
    setQty(mold ? MOLD_CANDLE_MOQ : 1);
    setGiftWrap(false);
    setMoldShape(MOLD_CANDLE_SHAPES[0]);
    setMoldFragrance("raat-ki-rani");
    setMoldColor("Dusty Rose");
  }, [slug]);

  if (!product) {
    return (
      <div className="container" style={{ padding: "80px 20px", textAlign: "center" }}>
        <p style={{ ...sans, color: C.ink70, marginBottom: 20 }}>We couldn't find that product.</p>
        <Button onClick={() => nav("catalogue", "all")}>Back to Catalogue</Button>
      </div>
    );
  }

  if (isMoldForState) {
    return <MoldCandleProductPage data={data} nav={nav} product={product} settings={settings} />;
  }

  const category = data.categories.find((c) => c.slug === product.categorySlug);
  const fragrance = data.fragrances.find((f) => f.slug === product.fragranceSlug);
  const isDiscoverySet = product.slug === DISCOVERY_SET_SLUG;
  const isMold = isMoldCandle(product);
  const giftWrapAvailable = settings.giftWrapEnabled !== false && String(settings.giftWrapEnabled).toLowerCase() !== "false";
  const giftWrapCharge = Number(settings.giftWrapCharge || GIFT_WRAP_CHARGE);
  const related = data.products.filter((p) => p.active && p.categorySlug === product.categorySlug && p.slug !== product.slug).slice(0, 4);
  const hasPackagingOptions = supportsPackaging(product);
  const hasJarVariants = false;
  const packagingChoice = PACKAGING_OPTIONS.standard;
  const jarChoice = JAR_VARIANT_DEFAULT;
  const minQty = isMold ? MOLD_CANDLE_MOQ : 1;
  const unitPrice = Number(product.price || 0);
  const subtotal = unitPrice * qty;
  const giftWrapTotal = giftWrap ? giftWrapCharge : 0;
  const totalPrice = subtotal + giftWrapTotal;

  const enquiryMsg = `Hello Mysaa Rituals! I'd like to order:\n\n${product.name}\n${isMold ? `Mould shape: ${moldShape}\n` : ""}Quantity: ${qty}${isMold ? ` (MOQ ${MOLD_CANDLE_MOQ})` : ""}\nPackaging: ${isDiscoverySet ? "Discovery Set presentation" : (hasPackagingOptions ? packagingChoice.label : "Standard")}\nJar finish: ${isJarProduct(product) ? "Flower mould included by default" : ""}\nGift wrapping: ${giftWrap ? `Yes (+${inr(giftWrapCharge)})` : "No"}\nUnit price: ${unitPrice > 0 ? inr(unitPrice) : "Enquire"}\nSubtotal: ${subtotal > 0 ? inr(subtotal) : "Enquire"}\n${giftWrap ? `Gift wrapping: ${inr(giftWrapCharge)}\n` : ""}Total: ${totalPrice > 0 ? inr(totalPrice) : "Enquire"}\n\nCould you confirm availability and delivery details?`;

  const addCurrentProductToCart = () => {
    if (isOutOfStock(product)) return;
    addCartItem({
      slug: product.slug, name: product.name, unitPrice, qty,
      giftWrap, giftWrapCharge, moq: minQty,
      fragranceName: fragrance ? fragrance.name : "",
      details: isJarProduct(product) ? "Flower mould included by default" : "",
    });
  };

  const infoRows = [
    ["Size", product.volume],
    ["Weight", product.weight],
    ["Variant", fragrance ? fragrance.name : ""],
    ["Fragrance Notes", fragrance ? fragrance.notes : ""],
    ["Material / Ingredients", product.materials],
    ["Packaging", hasPackagingOptions ? packagingChoice.label : product.packaging],
    ["Jar Finish", isJarProduct(product) ? "Flower mould included by default" : ""],
    ["Collection", category ? category.name : ""],
  ].filter(([, v]) => v);

  return (
    <div className="container" style={{ padding: "32px 20px 80px" }}>
      <p style={{ ...label, color: C.ink70, marginBottom: 28 }}>
        <button onClick={() => nav("catalogue", "all")} style={{ ...label, color: C.ink70 }}>Catalogue</button>
        {" / "}
        <button onClick={() => nav("catalogue", "category", { value: product.categorySlug })} style={{ ...label, color: C.ink70 }}>{category ? category.name : ""}</button>
        {" / "}
        <span style={{ color: C.ink }}>{product.name}</span>
      </p>

      <div className="product-detail-grid">
        <ProductGallery product={product} images={data.images} />

        <div>
          <h1 style={{ ...serif, fontSize: "clamp(26px,4vw,36px)", color: C.ink, fontWeight: 500, marginBottom: 14 }}>{product.name}</h1>
          <div className="product-detail-price" style={{ marginBottom: 6 }}>
            <DiscountedPrice product={product} currentPrice={unitPrice} large />
          </div>
          {(hasPackagingOptions || hasJarVariants || isMold) && (
            <p style={{ ...sans, fontSize: 12.5, color: C.ink70, marginBottom: 16 }}>
              {isMold ? `Minimum order ${MOLD_CANDLE_MOQ} pieces · price shared on enquiry` : `Discounted base price ${inr(product.price)} · final price updates with your selections`}
            </p>
          )}
          <p style={{ ...sans, fontSize: 15, color: C.ink70, lineHeight: 1.75, marginBottom: 28 }}>{product.shortDescription}</p>

          {isMold && (
            <div style={{ marginBottom: 28 }}>
              <p style={{ ...label, color: C.ink70, marginBottom: 10 }}>Choose Your Mould</p>
              <div className="option-grid">
                {MOLD_CANDLE_SHAPES.map((shape) => (
                  <button key={shape} onClick={() => setMoldShape(shape)} className={`selection-card${moldShape === shape ? " selected" : ""}`}>
                    <span style={{ ...sans, fontSize: 13.5, color: C.ink, fontWeight: 500 }}>{shape}</span>
                  </button>
                ))}
              </div>
              <p style={{ ...sans, fontSize: 12.5, color: C.rust, lineHeight: 1.6, marginTop: 10 }}>
                Minimum order: {MOLD_CANDLE_MOQ} pieces. Select one mould style for your batch.
              </p>
            </div>
          )}

          {fragrance && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ ...label, color: C.ink70, marginBottom: 10 }}>Variant</p>
              <span style={{ ...sans, fontSize: 13, padding: "9px 16px", border: `1px solid ${C.ink}`, display: "inline-block" }}>{fragrance.name}</span>
            </div>
          )}

          {hasPackagingOptions && (
            <div style={{ marginBottom: 28 }}>
              <p style={{ ...label, color: C.ink70, marginBottom: 10 }}>Packaging</p>
              <div className="option-grid">
                <div className="selection-card selected" aria-current="true">
                  <span style={{ ...sans, fontSize: 13.5, color: C.ink, fontWeight: 500 }}>Standard Packaging</span>
                  <span style={{ ...sans, fontSize: 12.5, color: C.ink70, marginTop: 5 }}>Included</span>
                </div>
                <div className="selection-card coming-soon" aria-disabled="true">
                  <span style={{ ...sans, fontSize: 13.5, color: C.ink70, fontWeight: 500 }}>{PREMIUM_PACKAGING.label}</span>
                  <span style={{ ...sans, fontSize: 12.5, color: C.rust, marginTop: 5 }}>Coming Soon</span>
                </div>
              </div>
              <div className="packaging-note">
                <strong style={{ ...serif, fontSize: 17, fontWeight: 500, color: C.ink }}>{packagingChoice.label}</strong>
                <p style={{ ...sans, fontSize: 13.5, color: C.ink70, lineHeight: 1.7, marginTop: 6 }}>{packagingChoice.description}</p>
                <p style={{ ...sans, fontSize: 12.5, color: C.rust, lineHeight: 1.6, marginTop: 8 }}>{PREMIUM_PACKAGING.description}</p>
              </div>
            </div>
          )}

          {giftWrapAvailable && (
          <div style={{ marginBottom: 28, padding: "16px", border: `1px solid ${C.line}`, background: C.card }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={giftWrap}
                onChange={(e) => setGiftWrap(e.target.checked)}
                style={{ marginTop: 3, accentColor: C.rust }}
              />
              <span>
                <strong style={{ ...serif, fontSize: 18, fontWeight: 500, color: C.ink }}>Gift wrapping</strong>
                <span style={{ ...sans, display: "block", fontSize: 13.5, color: C.ink70, lineHeight: 1.6, marginTop: 4 }}>
                  Add gift wrapping for someone special · +{inr(giftWrapCharge)}
                </span>
              </span>
            </label>
          </div>
          )}

          <div style={{ marginBottom: 28 }}>
            <p style={{ ...label, color: C.ink70, marginBottom: 10 }}>Quantity</p>
            <div style={{ display: "inline-flex", alignItems: "center", border: `1px solid ${C.line}` }}>
              <button onClick={() => setQty((q) => Math.max(minQty, q - 1))} style={{ ...sans, fontSize: 16, padding: "10px 16px", color: C.ink }} aria-label="Decrease quantity">−</button>
              <span style={{ ...sans, fontSize: 14, padding: "0 16px", minWidth: 28, textAlign: "center" }}>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} style={{ ...sans, fontSize: 16, padding: "10px 16px", color: C.ink }} aria-label="Increase quantity">+</button>
            </div>
          </div>

          {isOutOfStock(product) ? (
            <button className="out-of-stock-button" disabled>Out of Stock</button>
          ) : (
            <Button onClick={addCurrentProductToCart} variant="solid" style={{ width: "100%", justifyContent: "center" }}>
              Add to Cart
            </Button>
          )}

          {product.customizable && (
            <button onClick={() => nav("create-ritual")} style={{ ...label, color: C.rust, marginTop: 18, display: "block", textDecoration: "underline", textUnderlineOffset: "3px" }}>
              Want this customized instead? →
            </button>
          )}

          <div className="hairline-top" style={{ marginTop: 32 }}>
            <h2 style={{ ...serif, fontSize: 20, color: C.ink, fontWeight: 500, marginBottom: 12 }}>About this Product</h2>
            <p style={{ ...sans, fontSize: 14.5, color: C.ink70, lineHeight: 1.75 }}>{product.about}</p>
          </div>

          {isDiscoverySet && (
            <div className="hairline-top" style={{ marginTop: 32 }}>
              <h2 style={{ ...serif, fontSize: 20, color: C.ink, fontWeight: 500, marginBottom: 12 }}>What's Inside the Discovery Set</h2>
              <p style={{ ...sans, fontSize: 14.5, color: C.ink70, lineHeight: 1.75, marginBottom: 14 }}>
                Six 60 ml Mini Ritual candles, one in each Mysaa Rituals fragrance, so you can experience the full collection and discover the scent that feels most personal to you.
              </p>
              <div className="discovery-fragrance-list">
                {DISCOVERY_SET_FRAGRANCES.map((slug, index) => {
                  const f = data.fragrances.find((item) => item.slug === slug);
                  return f ? (
                    <div key={slug} className="discovery-fragrance-item">
                      <span style={{ ...label, color: C.rust }}>{String(index + 1).padStart(2, "0")}</span>
                      <span style={{ ...serif, fontSize: 17, color: C.ink }}>{f.name}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {hasPackagingOptions && (
            <div className="hairline-top" style={{ marginTop: 32 }}>
              <h2 style={{ ...serif, fontSize: 20, color: C.ink, fontWeight: 500, marginBottom: 12 }}>About the Packaging</h2>
              <p style={{ ...sans, fontSize: 14.5, color: C.ink70, lineHeight: 1.75, marginBottom: 10 }}>
                Standard packaging is currently available and included in the product price. Premium packaging is planned as a future option and is coming soon.
              </p>
              <p style={{ ...sans, fontSize: 13.5, color: C.ink70, lineHeight: 1.7 }}>
                Premium packaging will be introduced once the fragrance-led presentation is ready.
              </p>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 56 }}>
        <h2 style={{ ...serif, fontSize: 22, color: C.ink, fontWeight: 500, marginBottom: 20 }}>Product Information</h2>
        <div>
          {infoRows.map(([k, v]) => (
            <div key={k} style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between", padding: "14px 0", borderBottom: `1px solid ${C.line}` }}>
              <span style={{ ...label, color: C.ink70 }}>{k}</span>
              <span style={{ ...sans, fontSize: 14, color: C.ink, textAlign: "right" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 64 }}>
        <HowToOrder steps={HOW_TO_ORDER_PRODUCT} />
      </div>

      {related.length > 0 && (
        <div style={{ marginTop: 64 }}>
          <h2 style={{ ...serif, fontSize: 22, color: C.ink, fontWeight: 500, marginBottom: 24 }}>You May Also Like</h2>
          <div className="product-grid">
            {related.map((p) => <ProductCard key={p.slug} product={p} fragrance={data.fragrances.find((f) => f.slug === p.fragranceSlug)} images={data.images} nav={nav} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateRitualPage({ settings, data }) {
  const [form, setForm] = useState({ name: "", fragrance: "", format: "", occasion: "", notes: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const message = [
    "Hello Mysaa Rituals! I'd like to create a custom ritual.",
    form.name && `Name: ${form.name}`,
    form.fragrance && `Preferred fragrance / mood: ${form.fragrance}`,
    form.format && `Format: ${form.format}`,
    form.occasion && `Occasion: ${form.occasion}`,
    form.notes && `Notes: ${form.notes}`,
  ].filter(Boolean).join("\n");

  return (
    <div className="container" style={{ padding: "48px 20px 80px", maxWidth: 680 }}>
      <SectionHeading eyebrow="Made Just For You" title="Create Your Own Ritual" sub="Tell us a little about what you're looking for, and send your custom request to us by email." />
      <div style={{ marginTop: 36, display: "grid", gap: 18 }}>
        <Field label="Your name" value={form.name} onChange={set("name")} />
        <SelectField
          label="Preferred fragrance or mood"
          value={form.fragrance}
          onChange={set("fragrance")}
          placeholder="Help me choose"
          options={(data.fragrances || []).filter((f) => f.active !== false).map((f) => f.name)}
        />
        <SelectField
          label="Format"
          value={form.format}
          onChange={set("format")}
          placeholder="Not sure"
          options={(data.categories || []).filter((c) => c.active !== false).map((c) => c.name)}
        />
        <SelectField
          label="Occasion"
          value={form.occasion}
          onChange={set("occasion")}
          placeholder="Not sure yet"
          options={["Birthday", "Anniversary", "Wedding / Wedding Favour", "Festival", "Housewarming", "Corporate / Gifting", "Other"]}
        />
        <FieldArea label="Anything else we should know?" value={form.notes} onChange={set("notes")} />
        <Button href={`mailto:${settings.email}?subject=${encodeURIComponent("Mysaa Rituals — Custom Ritual Request")}&body=${encodeURIComponent(message)}`} style={{ marginTop: 8, width: "fit-content" }}>Send via Email</Button>
      </div>
    </div>
  );
}
function Field({ label: text, ...props }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ ...label, color: C.ink70, display: "block", marginBottom: 8 }}>{text}</span>
      <input {...props} style={{ ...sans, width: "100%", fontSize: 14, padding: "12px 14px", border: `1px solid ${C.line}`, background: "#FCFAF7" }} />

    </label>
  );
}
function SelectField({ label: text, options = [], placeholder = "Select", ...props }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ ...label, color: C.ink70, display: "block", marginBottom: 8 }}>{text}</span>
      <select {...props} style={{ ...sans, width: "100%", fontSize: 14, padding: "12px 14px", border: `1px solid ${C.line}`, background: "#FCFAF7", color: props.value ? C.ink : C.ink70, appearance: "auto" }}>
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
function FieldArea({ label: text, ...props }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ ...label, color: C.ink70, display: "block", marginBottom: 8 }}>{text}</span>
      <textarea {...props} rows={4} style={{ ...sans, width: "100%", fontSize: 14, padding: "12px 14px", border: `1px solid ${C.line}`, background: "#FCFAF7", resize: "vertical" }} />

    </label>
  );
}

function AboutPage({ data }) {
  return (
    <div className="container about-page" style={{ padding: "48px 20px 80px", maxWidth: 820 }}>
      <div className="about-section about-intro">
        <SectionHeading eyebrow="Our Story" title="More than a candle." />
        <div className="about-copy">
          <p>Mysaa Rituals was created around a simple idea — that fragrance has the power to turn ordinary moments into memories. The smell of dhoop in a childhood home, jasmine gajras on a festival morning, roses pressed into an old letter — these are the moments we try to bottle into every candle, melt and sachet we make.</p>
          <p>Every piece is handcrafted with care, inspired by familiar Indian aromas, and designed to become part of someone's ritual — poured in small batches using a natural soy wax blend and cotton or wooden wicks.</p>
          <p>If nothing in the catalogue feels quite right, that's exactly what Custom Rituals are for. Tell us about your moment, and we'll create something made only for it.</p>
        </div>
        <div style={{ marginTop: 32 }}><ImageOrPlaceholder src="./assets/story.jpg" label="Studio / process photograph" ratio="16 / 9" /></div>
      </div>

      <div className="about-section">
        <SectionHeading eyebrow="Why Mysaa Rituals" title="Slow, deliberate, personal." />
        <div style={{ marginTop: 32 }}>
          <WhyGrid />
        </div>
      </div>

      <div className="about-section process-section">
        <div className="process-layout">
          <div>
            <SectionHeading eyebrow="Our Process" title={<>Thoughtfully made,<br/>from start to finish.</>} />
            <div className="process-steps">
              {[
                ["01", "Curate familiar Indian fragrances."],
                ["02", "Blend with a natural soy wax mix."],
                ["03", "Hand-pour in small batches."],
                ["04", "Finish and package with care."],
              ].map(([num, text]) => (
                <div className="process-step" key={num}>
                  <span className="process-number">{num}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <ImageOrPlaceholder src={data.images?.site?.about2 || "./assets/about 2.jpeg"} label="Mysaa Rituals making process" ratio="4 / 3" />
        </div>
      </div>

      <div className="about-section">
        <SectionHeading eyebrow="Candle Care" title="A little care goes a long way." />
        <ul style={{ marginTop: 20, paddingLeft: 20, ...sans, fontSize: 14.5, color: C.ink70, lineHeight: 1.9 }}>
          <li>Trim the wick to 5mm before every burn.</li>
          <li>Let the wax pool reach the edge of the jar on the first burn — this prevents tunnelling.</li>
          <li>Burn for no more than 3–4 hours at a stretch.</li>
          <li>Keep away from drafts, and out of reach of children and pets.</li>
        </ul>
      </div>
    </div>
  );
}

function ContactPage({ settings }) {
  const feedbackReady = !!(settings.feedbackUrl || settings.feedbackQr);
  const connectQr = settings.connectQr || "./assets/connect-qr.jpeg";
  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="contact-hero-copy">
          <p style={{ ...label, color: C.rust, marginBottom: 12 }}>We'd Love To Hear From You</p>
          <h1 style={{ ...serif, color: C.ink, fontSize: "clamp(44px,6vw,64px)", fontWeight: 500, lineHeight: 1.02, marginBottom: 18 }}>Get in touch</h1>
          <p style={{ ...sans, color: C.ink70, fontSize: 17, lineHeight: 1.65, maxWidth: 430, marginBottom: 28 }}>
            Have a question, a custom request or just want to say hello? We're always happy to connect.
          </p>
          <div className="contact-details">
            <ContactRow icon={<ChatIcon size={25} color={C.rust} />} label="WhatsApp" value={settings.phone} href={waLink(settings.whatsapp, "Hello Mysaa Rituals!")} />
            <ContactRow icon={<span style={{fontSize:26,color:C.rust}}>✉</span>} label="Email" value={settings.email} href={`mailto:${settings.email}`} />
            <ContactRow icon={<InstagramIcon size={25} color={C.rust} />} label="Instagram" value={settings.instagramHandle || "@mysaarituals"} href={settings.instagram} />
            {settings.address && <ContactRow icon={<span style={{fontSize:25,color:C.rust}}>⌖</span>} label="Studio" value={settings.address} />}
          </div>
        </div>
        <div className="contact-hero-image">
          <ImageOrPlaceholder src="./assets/contact.jpg" label="Mysaa Rituals candle" ratio="1 / 1" />
          <div className="contact-ritual-caption">
            <p style={{ ...serif, fontSize: 20, color: C.ink, lineHeight: 1.05, margin: 0 }}>Carry<br/>the ritual<br/>with you.</p>
          </div>
        </div>
      </section>

      <section className="contact-connect-grid">
        <div className="contact-connect-card">
          <p style={{ ...label, color: C.rust, marginBottom: 10 }}>Feedback</p>
          <h2 style={{ ...serif, color: C.ink, fontSize: "clamp(30px,4vw,40px)", fontWeight: 500, lineHeight: 1.05, marginBottom: 12 }}>
            Tell us about<br/>your Mysaa experience.
          </h2>
          <p style={{ ...sans, color: C.ink70, fontSize: 15, lineHeight: 1.65, maxWidth: 430 }}>
            Your feedback helps us improve our fragrances, products and overall experience.
          </p>
          {feedbackReady && (
            <div className="qr-action-row">
              {settings.feedbackQr && <img className="contact-qr" src={settings.feedbackQr} alt="QR code for the Mysaa Rituals feedback form" />}
              <div>
                {settings.feedbackUrl && (
                  <a className="qr-link" href={settings.feedbackUrl} target="_blank" rel="noreferrer">
                    Scan to open<br/>feedback form <span>→</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="contact-connect-card">
          <p style={{ ...label, color: C.rust, marginBottom: 10 }}>Stay Connected</p>
          <h2 style={{ ...serif, color: C.ink, fontSize: "clamp(30px,4vw,40px)", fontWeight: 500, lineHeight: 1.05, marginBottom: 12 }}>
            Scan to connect<br/>with us.
          </h2>
          <p style={{ ...sans, color: C.ink70, fontSize: 15, lineHeight: 1.65, maxWidth: 430 }}>
            Follow Mysaa Rituals and stay close to new drops, offers and little rituals.
          </p>
          <div className="qr-action-row">
            <img className="contact-qr" src={connectQr} alt="Mysaa Rituals connection QR code" />
            <div>
              <a className="qr-link" href={settings.instagram} target="_blank" rel="noreferrer">
                Visit @mysaarituals<br/>on Instagram <span>→</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
function ContactRow({ icon, label: text, value, href }) {
  const content = (
    <div className="contact-row">
      <div className="contact-row-icon">{icon}</div>
      <div className="contact-row-copy">
        <span>{text}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
  return href ? <a href={href} target="_blank" rel="noreferrer">{content}</a> : content;
}

function WelcomePopup() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      if (!window.localStorage.getItem("mysaa-welcome-seen-v2")) setOpen(true);
    } catch (_) { setOpen(true); }
  }, []);
  const close = () => {
    try { window.localStorage.setItem("mysaa-welcome-seen-v2", "1"); } catch (_) {}
    setOpen(false);
  };
  if (!open) return null;
  return (
    <div className="welcome-overlay" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="welcome-card">
        <button className="welcome-close" onClick={close} aria-label="Close welcome message">×</button>
        <img src="assets/logo.png" alt="Mysaa Rituals" className="welcome-logo" />
        <p className="welcome-eyebrow">A little welcome from Mysaa</p>
        <h2 id="welcome-title">Goodies in every order.</h2>
        <p>Every order comes with free goodies, and our launch discount is live. Discover your next little ritual with Mysaa.</p>
        <button className="welcome-cta" onClick={close}>Start exploring →</button>
      </div>
    </div>
  );
}

function CartPage({ nav, settings }) {
  const [items, setItems] = useState(() => readCart());
  const [customer, setCustomer] = useState({ name: "", email: "", address: "", city: "", state: "", pincode: "", landmark: "", note: "" });
  useEffect(() => {
    const refresh = () => setItems(readCart());
    window.addEventListener("mysaa-cart-updated", refresh);
    return () => window.removeEventListener("mysaa-cart-updated", refresh);
  }, []);
  const total = cartTotal(items);
  const setCustomerField = (key) => (e) => setCustomer((v) => ({ ...v, [key]: e.target.value }));
  const orderBody = [
    "Hello Mysaa Rituals, I'd like to place the following order:",
    "",
    ...items.map((item, i) => `${i + 1}. ${item.name}\n   Quantity: ${item.qty}${item.moq ? ` (MOQ ${item.moq})` : ""}\n   Unit price: ${inr(item.unitPrice)}\n   ${item.details || ""}${item.giftWrap ? `\n   Gift wrapping: +${inr(item.giftWrapCharge || GIFT_WRAP_CHARGE)}` : ""}\n   Line total: ${inr(Number(item.unitPrice) * Number(item.qty) + (item.giftWrap ? Number(item.giftWrapCharge || GIFT_WRAP_CHARGE) : 0))}`),
    "",
    `Order total: ${inr(total)}`,
    "",
    `Name: ${customer.name || ""}`,
    `Email: ${customer.email || ""}`,
    `Address: ${customer.address || ""}`,
    `City: ${customer.city || ""}`,
    `State: ${customer.state || ""}`,
    `PIN / Postal Code: ${customer.pincode || ""}`,
    customer.landmark ? `Landmark: ${customer.landmark}` : "",
    customer.note ? `Notes: ${customer.note}` : "",
    "",
    "Please confirm availability, delivery charges and final delivery details."
  ].filter(Boolean).join("\n");
  const emailHref = `mailto:${settings.email}?subject=${encodeURIComponent(`Mysaa Rituals Order — ${customer.name || "Customer"}`)}&body=${encodeURIComponent(orderBody)}`;
  const changeQty = (item, delta) => {
    const next = Math.max(item.moq || 1, Number(item.qty || 1) + delta);
    updateCartItem(item.key, next);
    setItems(readCart());
  };
  const remove = (key) => { removeCartItem(key); setItems(readCart()); };
  return (
    <div className="container cart-page" style={{ padding: "48px 20px 80px" }}>
      <SectionHeading eyebrow="Your Cart" title="Ready to make it a ritual?" sub="Review your products, add gift wrapping if you need it, then send the complete order to us by email." />
      {items.length === 0 ? (
        <div className="cart-empty">
          <p style={{ ...serif, fontSize: 26, color: C.ink, marginBottom: 10 }}>Your cart is empty.</p>
          <p style={{ ...sans, fontSize: 14, color: C.ink70, marginBottom: 20 }}>Choose something from the catalogue and it will appear here.</p>
          <Button variant="solid" onClick={() => nav("catalogue", "all")}>Explore the Catalogue</Button>
        </div>
      ) : (
        <div className="cart-grid">
          <div className="cart-items">
            {items.map((item) => {
              const lineTotal = Number(item.unitPrice) * Number(item.qty) + (item.giftWrap ? Number(item.giftWrapCharge || GIFT_WRAP_CHARGE) : 0);
              return (
                <div className="cart-item" key={item.key}>
                  <div className="cart-item-main">
                    <div>
                      <h3>{item.name}</h3>
                      {item.fragranceName && <p>Fragrance: {item.fragranceName}</p>}
                      {item.details && <p>{item.details}</p>}
                      {item.giftWrap && <p>Gift wrapping: +{inr(item.giftWrapCharge || GIFT_WRAP_CHARGE)}</p>}
                    </div>
                    <strong>{inr(lineTotal)}</strong>
                  </div>
                  <div className="cart-item-actions">
                    <div className="cart-qty"><button onClick={() => changeQty(item, -1)}>−</button><span>{item.qty}</span><button onClick={() => changeQty(item, 1)}>+</button></div>
                    <button className="cart-remove" onClick={() => remove(item.key)}>Remove</button>
                  </div>
                </div>
              );
            })}
            <button className="cart-continue" onClick={() => nav("catalogue", "all")}>← Continue shopping</button>
          </div>
          <aside className="cart-summary">
            <div className="cart-summary-total"><span>Total</span><strong>{inr(total)}</strong></div>
            <p className="cart-email-note">Orders are placed through email only. Your email app will open with the order details already filled in.</p>
            <div className="cart-customer-fields">
              <label><span>Name</span><input value={customer.name} onChange={setCustomerField("name")} placeholder="Your name" /></label>
              <label><span>Email</span><input type="email" value={customer.email} onChange={setCustomerField("email")} placeholder="your@email.com" /></label>
              <label><span>Full Address</span><textarea value={customer.address} onChange={setCustomerField("address")} placeholder="House / flat, street, area" /></label>
              <div className="cart-address-row">
                <label><span>City</span><input value={customer.city} onChange={setCustomerField("city")} placeholder="City" /></label>
                <label><span>State</span><input value={customer.state} onChange={setCustomerField("state")} placeholder="State" /></label>
              </div>
              <div className="cart-address-row">
                <label><span>PIN / Postal Code</span><input value={customer.pincode} onChange={setCustomerField("pincode")} placeholder="PIN code" /></label>
                <label><span>Landmark</span><input value={customer.landmark} onChange={setCustomerField("landmark")} placeholder="Nearby landmark (optional)" /></label>
              </div>
              <label><span>Order notes</span><textarea value={customer.note} onChange={setCustomerField("note")} placeholder="Occasion, delivery notes, gifting details…" /></label>
            </div>
            <a className="cart-email-button" href={emailHref}>Send Order by Email →</a>
            <p className="cart-small-note">To: {settings.email}</p>
          </aside>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   App root
   ============================================================ */
function App() {
  const { loading, error, data } = useCatalogueData();
  const [route, setRoute] = useState(parseHash());

  useEffect(() => {
    const onHashChange = () => { setRoute(parseHash()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const nav = useCallback((page, param, query) => {
    const nextHash = buildHash(page, param, query);
    if (window.location.hash === nextHash) {
      setRoute(parseHash());
      window.scrollTo(0, 0);
      return;
    }
    window.location.hash = nextHash;
  }, []);

  useEffect(() => {
    if (!data || !data.settings) return;
    const settings = data.settings;
    document.title = settings.seoTitle || "Mysaa Rituals";
    const description = settings.seoDescription || "Handcrafted candles and gifts inspired by Indian fragrances, memories and everyday rituals.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
    meta.setAttribute("content", description);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = window.location.href.split("#")[0];
  }, [data]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream }}>
        <p style={{ ...sans, color: C.ink70 }}>Loading catalogue…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream, padding: 20, textAlign: "center" }}>
        <p style={{ ...sans, color: C.ink70 }}>Couldn't load the catalogue data. Make sure this site is served over http(s), not opened directly as a file. ({error})</p>
      </div>
    );
  }

  const { settings } = data;
  let page;
  if (route.page === "home") page = <HomePage data={data} nav={nav} settings={settings} />;
  else if (route.page === "catalogue") page = <CataloguePage data={data} nav={nav} initialType={route.param} initialQuery={route.query} />;
  else if (route.page === "product") page = <ProductDetailPage data={data} nav={nav} slug={route.param} settings={settings} />;
  else if (route.page === "create-ritual") page = <CreateRitualPage settings={settings} data={data} />;
  else if (route.page === "about") page = <AboutPage data={data} />;
  else if (route.page === "contact") page = <ContactPage settings={settings} />;
  else if (route.page === "cart") page = <CartPage nav={nav} settings={settings} />;
  else page = <HomePage data={data} nav={nav} settings={settings} />;

  return (
    <React.Fragment>
      <WelcomePopup />
      <Header nav={nav} settings={settings} route={route} />
      <main style={{ minHeight: "60vh" }}>{page}</main>
      <Footer nav={nav} settings={settings} />
    </React.Fragment>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
