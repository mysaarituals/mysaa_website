/* ============================================================
   MYSAA RITUALS — Digital Catalogue
   Static, single-page React app (no build step; runs on GitHub Pages).
   SOURCE FILE: edit app.jsx, then compile to app.js before publishing:

     npx tsc --jsx react --outDir . --allowJs --target es2018 \
         --module none --lib dom,es2018 app.jsx
     mv app.js app.js   (tsc writes app.js next to app.jsx)

   Product data is fetched from ./data/*.json — the shop owner edits
   data/mysaa_products.xlsx and regenerates the JSON (see scripts/).
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
// Premium packaging is currently marked Coming Soon. Jar flower mould adds ₹100.
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

const JAR_VARIANTS = {
  plain: {
    label: "Classic Top — No Flower",
    shortLabel: "No Flower",
    priceDelta: 0,
    description: "A clean, minimal wax surface."
  },
  flower: {
    label: "Flower Mould on Top",
    shortLabel: "Flower Mould (+₹100)",
    priceDelta: 100,
    description: "Finished with a handcrafted flower mould on top for an extra decorative touch."
  }
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
  { slug: "festivals-celebrations", title: "Festivals & Celebrations", description: "Thoughtful candles, sachets and hampers for festive moments.", categories: ["gift-hampers", "discovery-set", "hero-jar-candle", "wide-jar-candle", "shot-glass-candle", "grand-ritual", "mold-candles", "wax-melts"] },
  { slug: "weddings-return-gifts", title: "Weddings & Return Gifts", description: "Personalised pieces for wedding favours, events and guests.", categories: ["gift-hampers", "wax-melts", "shot-glass-candle"] },
  { slug: "birthdays-just-because", title: "Birthdays & Just Because", description: "Small, personal gifts for someone you want to make smile.", categories: ["gift-hampers", "discovery-set", "shot-glass-candle", "wide-jar-candle"] },
];

function isJarProduct(product) {
  return product && ["hero-jar-candle", "wide-jar-candle"].includes(product.categorySlug);
}
function isMoldCandle(product) {
  return product && product.categorySlug === "mold-candles";
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
          {[...links.map((l) => [...l, null]), ...discoverLinks, ...tailLinks.map((l) => [...l, null])].map(([lbl, page, param, query]) => (
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

function WhatsAppFloat({ settings }) {
  return (
    <a href={waLink(settings.whatsapp, "Hello Mysaa Rituals, I would like to know more about your products.")}
      target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"
      style={{ position: "fixed", bottom: 22, right: 22, zIndex: 50, width: 54, height: 54, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 18px rgba(0,0,0,0.25)" }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 1.67c2.24 0 4.34.87 5.93 2.46a8.23 8.23 0 0 1 2.42 5.85c0 4.56-3.71 8.27-8.35 8.27a8.3 8.3 0 0 1-4.21-1.15l-.3-.18-3.14.82.84-3.06-.2-.32a8.2 8.2 0 0 1-1.26-4.38c0-4.56 3.71-8.31 8.27-8.31M8.53 6.7c-.16 0-.43.06-.65.31-.22.24-.86.84-.86 2.05s.88 2.38 1 2.55c.13.16 1.7 2.72 4.2 3.71.58.25 1.04.4 1.4.51.59.19 1.12.16 1.55.1.47-.07 1.45-.59 1.65-1.17s.2-1.07.14-1.17c-.06-.1-.22-.16-.47-.28s-1.45-.72-1.68-.8c-.22-.08-.39-.13-.55.13-.16.25-.63.8-.78.97-.14.16-.29.18-.53.06-.25-.13-1.04-.38-1.99-1.23-.73-.66-1.23-1.46-1.37-1.71-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.16.04-.31-.02-.44-.07-.13-.55-1.4-.78-1.9-.19-.42-.4-.42-.55-.43z"/></svg>
    </a>
  );
}

/* ============================================================
   Product / Fragrance cards
   ============================================================ */
function ProductCard({ product, fragrance, images, nav }) {
  return (
    <button className="product-card" onClick={() => nav("product", product.slug)} style={{ textAlign: "left", display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
      <div className="hairline-top" style={{ paddingTop: 0 }}>
        <p style={{ ...label, color: C.ink70, marginBottom: 8, minHeight: 14 }}>
          {product.bestseller ? "Bestseller" : product.isNew ? "New" : product.customizable ? "Customizable" : "\u00A0"}
        </p>
        <ImageOrPlaceholder src={productImage(product, images, 0)} label={product.name} />
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
  { title: "Enquire", body: "Tap Order on WhatsApp, or send us an enquiry directly." },
  { title: "Personalize", body: "Discuss fragrance, quantity, packaging or customization." },
  { title: "Confirm", body: "We confirm availability, pricing and final details personally." },
];
const HOW_TO_ORDER_PRODUCT = [
  { title: "Select", body: "Select the product and quantity you'd like." },
  { title: "Tap Order", body: "Tap Order on WhatsApp — the product name is filled in for you." },
  { title: "Send", body: "Send us your enquiry or order on WhatsApp." },
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
  // to a balanced mix of Signature, Everyday Ritual and Mini Ritual candles.
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
              <p style={{ ...sans, fontSize: 14, color: C.ink70, lineHeight: 1.65, marginBottom: 16 }}>Choose your format first — Signature, Everyday Ritual, Mini Ritual or Grand Ritual.</p>
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
        <SectionHeading eyebrow="Best Sellers" title="Made to be lit slowly." sub="A selection of Mysaa candles across our Signature, Everyday Ritual and Mini Ritual formats." />
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
            <div className="gifting-list">
              <span style={{ ...sans, fontSize: 14, color: C.ink70 }}>Festival gifting</span>
              <span style={{ ...sans, fontSize: 14, color: C.ink70 }}>Birthday gifting</span>
              <span style={{ ...sans, fontSize: 14, color: C.ink70 }}>Wedding favours</span>
              <span style={{ ...sans, fontSize: 14, color: C.ink70 }}>Return gifts</span>
              <span style={{ ...sans, fontSize: 14, color: C.ink70 }}>Housewarming</span>
              <span style={{ ...sans, fontSize: 14, color: C.ink70 }}>Custom gifts</span>
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
            { title: "Enquire", body: "Send us your order through WhatsApp." },
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
            <a href={waLink(settings.whatsapp, "Hello Mysaa Rituals!")} target="_blank" rel="noreferrer" style={{ ...label, color: "#fff", textDecoration: "underline", textUnderlineOffset: "4px" }}>
              Chat on WhatsApp
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
        if (!group || !group.categories.includes(p.categorySlug)) return false;
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

function ProductDetailPage({ data, nav, slug, settings }) {
  const productForState = data.products.find((p) => p.slug === slug);
  const isMoldForState = isMoldCandle(productForState);
  const [qty, setQty] = useState(isMoldForState ? MOLD_CANDLE_MOQ : 1);
  const [jarVariant, setJarVariant] = useState("plain");
  const [giftWrap, setGiftWrap] = useState(false);
  const [moldShape, setMoldShape] = useState(MOLD_CANDLE_SHAPES[0]);
  const product = data.products.find((p) => p.slug === slug);

  useEffect(() => {
    const mold = isMoldCandle(product);
    setQty(mold ? MOLD_CANDLE_MOQ : 1);
    setGiftWrap(false);
    setJarVariant("plain");
    setMoldShape(MOLD_CANDLE_SHAPES[0]);
  }, [slug]);

  if (!product) {
    return (
      <div className="container" style={{ padding: "80px 20px", textAlign: "center" }}>
        <p style={{ ...sans, color: C.ink70, marginBottom: 20 }}>We couldn't find that product.</p>
        <Button onClick={() => nav("catalogue", "all")}>Back to Catalogue</Button>
      </div>
    );
  }

  const category = data.categories.find((c) => c.slug === product.categorySlug);
  const fragrance = data.fragrances.find((f) => f.slug === product.fragranceSlug);
  const isDiscoverySet = product.slug === DISCOVERY_SET_SLUG;
  const isMold = isMoldCandle(product);
  const giftWrapAvailable = settings.giftWrapEnabled !== false && String(settings.giftWrapEnabled).toLowerCase() !== "false";
  const giftWrapCharge = Number(settings.giftWrapCharge || GIFT_WRAP_CHARGE);
  const related = data.products.filter((p) => p.active && p.categorySlug === product.categorySlug && p.slug !== product.slug).slice(0, 4);
  const hasPackagingOptions = supportsPackaging(product);
  const hasJarVariants = isJarProduct(product);
  const packagingChoice = PACKAGING_OPTIONS.standard;
  const jarChoice = hasJarVariants ? JAR_VARIANTS[jarVariant] : JAR_VARIANTS.plain;
  const minQty = isMold ? MOLD_CANDLE_MOQ : 1;
  const unitPrice = Number(product.price || 0) + (hasJarVariants ? jarChoice.priceDelta : 0);
  const subtotal = unitPrice * qty;
  const giftWrapTotal = giftWrap ? giftWrapCharge : 0;
  const totalPrice = subtotal + giftWrapTotal;

  const enquiryMsg = `Hello Mysaa Rituals! I'd like to order:\n\n${product.name}\n${isMold ? `Mould shape: ${moldShape}\n` : ""}Quantity: ${qty}${isMold ? ` (MOQ ${MOLD_CANDLE_MOQ})` : ""}\nPackaging: ${isDiscoverySet ? "Discovery Set presentation" : (hasPackagingOptions ? packagingChoice.label : "Standard")}\n${hasJarVariants ? `Jar finish: ${jarChoice.label}\n` : ""}Gift wrapping: ${giftWrap ? `Yes (+${inr(giftWrapCharge)})` : "No"}\nUnit price: ${unitPrice > 0 ? inr(unitPrice) : "Enquire"}\nSubtotal: ${subtotal > 0 ? inr(subtotal) : "Enquire"}\n${giftWrap ? `Gift wrapping: ${inr(giftWrapCharge)}\n` : ""}Total: ${totalPrice > 0 ? inr(totalPrice) : "Enquire"}\n\nCould you confirm availability and delivery details?`;

  const infoRows = [
    ["Size", product.volume],
    ["Weight", product.weight],
    ["Variant", fragrance ? fragrance.name : ""],
    ["Fragrance Notes", fragrance ? fragrance.notes : ""],
    ["Material / Ingredients", product.materials],
    ["Packaging", hasPackagingOptions ? packagingChoice.label : product.packaging],
    ["Jar Finish", hasJarVariants ? jarChoice.label : ""],
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

          {hasJarVariants && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ ...label, color: C.ink70, marginBottom: 10 }}>Jar Finish</p>
              <div className="option-grid">
                {Object.entries(JAR_VARIANTS).map(([key, option]) => (
                  <button key={key} onClick={() => setJarVariant(key)} className={`selection-card${jarVariant === key ? " selected" : ""}`}>
                    <span style={{ ...sans, fontSize: 13.5, color: C.ink, fontWeight: 500 }}>{option.label}</span>
                    <span style={{ ...sans, fontSize: 12.5, color: C.ink70, marginTop: 5 }}>{option.priceDelta ? `+${inr(option.priceDelta)}` : "Included"}</span>
                  </button>
                ))}
              </div>
              <p style={{ ...sans, fontSize: 12.5, color: C.ink70, lineHeight: 1.6, marginTop: 10 }}>{jarChoice.description}</p>
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

          <Button href={waLink(settings.whatsapp, enquiryMsg)} target="_blank" variant="solid" style={{ width: "100%", justifyContent: "center" }}>
            <ChatIcon color="#fff" /> Order on WhatsApp
          </Button>

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
      <SectionHeading eyebrow="Made Just For You" title="Create Your Own Ritual" sub="Tell us a little about what you're looking for, and we'll get back to you on WhatsApp to design it together." />
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
        <Button href={waLink(settings.whatsapp, message)} target="_blank" style={{ marginTop: 8, width: "fit-content" }}>Send via WhatsApp</Button>
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
            <p style={{ ...label, color: C.rust, marginBottom: 10 }}>Our Process</p>
            <h2 style={{ ...serif, color: C.ink, fontSize: "clamp(34px,5vw,50px)", fontWeight: 500, lineHeight: 1.02, maxWidth: 520, marginBottom: 20 }}>
              Thoughtfully made,<br/>from start to finish.
            </h2>
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
          <div className="contact-hero-caption">
            <p style={{ ...serif, fontSize: 30, color: C.ink, lineHeight: 1.05, margin: 0 }}>Carry<br/>the ritual<br/>with you.</p>
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
  else page = <HomePage data={data} nav={nav} settings={settings} />;

  return (
    <React.Fragment>
      <WelcomePopup />
      <Header nav={nav} settings={settings} route={route} />
      <main style={{ minHeight: "60vh" }}>{page}</main>
      <Footer nav={nav} settings={settings} />
      <WhatsAppFloat settings={settings} />
    </React.Fragment>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
