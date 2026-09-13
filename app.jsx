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
  ink: "#201C17",
  ink70: "#6B6259",
  gold: "#A97A3F",
  goldDeep: "#8C6431",
  rust: "#A9683F",
  rustDeep: "#8C5330",
  cream: "#FCFAF7",
  card: "#F7F2EA",
  line: "#E7E0D4",
};
const serif = { fontFamily: "'Fraunces', serif" };
const sans = { fontFamily: "'Inter', sans-serif" };
const label = { ...sans, fontSize: 11.5, letterSpacing: "0.11em", textTransform: "uppercase" };

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

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

/* ---------- data loading ---------- */
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
        if (!alive) return;
        const [products, fragrances, categories, settings] = results;
        setState({ loading: false, error: null, data: { products, fragrances, categories, settings } });
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

/* ============================================================
   Header / Footer
   ============================================================ */
function Header({ nav, settings }) {
  const [open, setOpen] = useState(false);
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(252,250,247,0.95)", borderBottom: `1px solid ${C.line}`, backdropFilter: "blur(6px)" }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 76 }}>
        <button onClick={() => nav("home")} aria-label="Mysaa Rituals home" style={{ display: "flex", alignItems: "center" }}>
          <Logo size={50} />
        </button>

        <nav style={{ display: "flex", alignItems: "center", gap: 30 }} className="desktop-nav">
          <button onClick={() => nav("home")} style={{ ...sans, fontSize: 14, color: C.ink }}>Home</button>
          <button onClick={() => nav("catalogue", "all")} style={{ ...sans, fontSize: 14, color: C.ink }}>Catalogue</button>
          <button onClick={() => nav("about")} style={{ ...sans, fontSize: 14, color: C.ink }}>About</button>
          <button onClick={() => nav("contact")} style={{ ...sans, fontSize: 14, color: C.ink }}>Contact</button>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href={waLink(settings.whatsapp, "Hello Mysaa Rituals, I would like to know more about your products.")}
            target="_blank" rel="noreferrer" className="desktop-nav"
            style={{ ...sans, fontSize: 12.5, letterSpacing: "0.08em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", border: `1px solid ${C.ink}`, color: C.ink, borderRadius: 2 }}>
            <ChatIcon /> WhatsApp
          </a>
          <button className="mobile-only" onClick={() => setOpen(!open)} aria-label="Menu" style={{ padding: 8 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="1.6">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="mobile-only" style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 2, background: C.cream, borderTop: `1px solid ${C.line}` }}>
          {[["Home", "home", null], ["Catalogue", "catalogue", "all"], ["About", "about", null], ["Contact", "contact", null]].map(([lbl, page, param]) => (
            <button key={lbl} onClick={() => { nav(page, param); setOpen(false); }}
              style={{ ...sans, textAlign: "left", padding: "12px 4px", fontSize: 15, color: C.ink, borderBottom: `1px solid ${C.line}` }}>
              {lbl}
            </button>
          ))}
          <a href={waLink(settings.whatsapp, "Hello Mysaa Rituals, I would like to know more about your products.")}
            target="_blank" rel="noreferrer" style={{ ...sans, marginTop: 12, textAlign: "center", padding: "12px 4px", fontSize: 14, color: "#fff", background: C.ink }}>
            Chat on WhatsApp
          </a>
        </div>
      )}
    </header>
  );
}

function Footer({ nav, settings }) {
  return (
    <footer style={{ background: "#fff", borderTop: `1px solid ${C.line}`, marginTop: 80 }}>
      <div className="container" style={{ padding: "56px 20px 32px" }}>
        <div className="footer-grid">
          <div>
            <div style={{ marginBottom: 16 }}><Logo size={44} /></div>
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
function ProductCard({ product, fragrance, nav }) {
  return (
    <button onClick={() => nav("product", product.slug)} style={{ textAlign: "left", display: "block" }}>
      <div className="hairline-top" style={{ paddingTop: 0 }}>
        <p style={{ ...label, color: C.ink70, marginBottom: 8, minHeight: 14 }}>
          {product.bestseller ? "Bestseller" : product.isNew ? "New" : product.customizable ? "Customizable" : "\u00A0"}
        </p>
        <Placeholder label={product.name} />
      </div>
      <div style={{ paddingTop: 14 }}>
        <h3 style={{ ...serif, fontSize: 17, color: C.ink, fontWeight: 500, marginBottom: 4 }}>{product.name}</h3>
        <p style={{ ...sans, fontSize: 13, color: C.ink70, marginBottom: 12 }} className="line-clamp-2">{product.shortDescription}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ ...sans, fontSize: 14, color: C.ink }}>{inr(product.price)}</span>
          <span style={{ ...label, color: C.rust, textDecoration: "underline", textUnderlineOffset: "3px" }}>View Details</span>
        </div>
      </div>
    </button>
  );
}

function FragranceCard({ fragrance, nav }) {
  return (
    <button onClick={() => nav("catalogue", "fragrance", { value: fragrance.slug })} style={{ textAlign: "left", display: "block" }}>
      <Placeholder label={fragrance.name} ratio="1 / 1" />
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
function HomePage({ data, nav, settings }) {
  const bestsellers = data.products.filter((p) => p.active && (p.bestseller || p.isNew)).slice(0, 6);
  const fragranceById = Object.fromEntries(data.fragrances.map((f) => [f.slug, f]));

  return (
    <div>
      <section style={{ borderBottom: `1px solid ${C.line}` }}>
        <div className="container hero-grid" style={{ padding: "72px 20px 64px" }}>
          <div style={{ maxWidth: 540 }}>
            <p style={{ ...label, color: C.rust, marginBottom: 16 }}>Handcrafted in small batches</p>
            <h1 style={{ ...serif, fontSize: "clamp(34px,6vw,54px)", color: C.ink, fontWeight: 500, lineHeight: 1.1, marginBottom: 20 }}>
              Fragrance, made personal.
            </h1>
            <p style={{ ...sans, fontSize: 16, color: C.ink70, lineHeight: 1.75, marginBottom: 30, maxWidth: 460 }}>
              Handcrafted candles and gifts inspired by Indian fragrances, memories and everyday rituals.
            </p>
            <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
              <Button variant="ghost" onClick={() => nav("catalogue", "all")}>Explore the Collection</Button>
              <Button variant="outline" onClick={() => nav("create-ritual")}>Create Your Ritual</Button>
            </div>
            <a href={waLink(settings.whatsapp, "Hello Mysaa Rituals!")} target="_blank" rel="noreferrer"
              style={{ ...label, color: C.ink70, textDecoration: "underline", textUnderlineOffset: "3px" }}>
              Chat on WhatsApp
            </a>
          </div>
          <Placeholder label="Hero product photograph" ratio="4 / 3" />
        </div>
      </section>

      <section className="container" style={{ padding: "72px 20px" }}>
        <SectionHeading eyebrow="The Fragrances" title="Every fragrance holds a feeling." sub="From the warmth of sandalwood to the romance of jasmine and the mystery of night-blooming florals, each Mysaa ritual is created to evoke something personal." />
        <div className="fragrance-grid" style={{ marginTop: 36 }}>
          {data.fragrances.filter((f) => f.active).map((f) => <FragranceCard key={f.slug} fragrance={f} nav={nav} />)}
        </div>
      </section>

      <section style={{ background: C.card, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
        <div className="container" style={{ padding: "72px 20px" }}>
          <SectionHeading eyebrow="Two Ways In" title="Discover your ritual" align="center" />
          <div className="two-ways-grid" style={{ marginTop: 40 }}>
            <button onClick={() => nav("catalogue", "fragrance")} style={{ background: "#fff", border: `1px solid ${C.line}`, padding: "36px 28px", textAlign: "left" }}>
              <h3 style={{ ...serif, fontSize: 22, color: C.ink, fontWeight: 500, marginBottom: 10 }}>Shop by Fragrance</h3>
              <p style={{ ...sans, fontSize: 14, color: C.ink70, lineHeight: 1.6, marginBottom: 16 }}>Find the scent that feels like you.</p>
              <span style={{ ...label, color: C.rust }}>Explore →</span>
            </button>
            <button onClick={() => nav("catalogue", "candle")} style={{ background: "#fff", border: `1px solid ${C.line}`, padding: "36px 28px", textAlign: "left" }}>
              <h3 style={{ ...serif, fontSize: 22, color: C.ink, fontWeight: 500, marginBottom: 10 }}>Shop by Candle</h3>
              <p style={{ ...sans, fontSize: 14, color: C.ink70, lineHeight: 1.6, marginBottom: 16 }}>Hero jar, wide jar or shot glass — pick your size.</p>
              <span style={{ ...label, color: C.rust }}>Explore →</span>
            </button>
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: "72px 20px" }}>
        <SectionHeading eyebrow="Curated" title="Made to be lit slowly." />
        <div className="product-grid" style={{ marginTop: 36 }}>
          {bestsellers.map((p) => <ProductCard key={p.slug} product={p} fragrance={fragranceById[p.fragranceSlug]} nav={nav} />)}
        </div>
      </section>

      <section className="container" style={{ padding: "20px 20px 72px" }}>
        <div className="personalize-grid">
          <Placeholder label="Personalization / stationery flat-lay" ratio="4 / 3" />
          <div>
            <p style={{ ...label, color: C.rust, marginBottom: 14 }}>Personalization</p>
            <h2 style={{ ...serif, fontSize: "clamp(24px,3.6vw,32px)", color: C.ink, fontWeight: 500, marginBottom: 16 }}>Made for your moment.</h2>
            <p style={{ ...sans, fontSize: 15, color: C.ink70, lineHeight: 1.75, marginBottom: 24, maxWidth: 420 }}>
              Have something specific in mind? Choose your fragrance, jar size, label or packaging and let us create something personal for you.
            </p>
            <Button variant="ghost" onClick={() => nav("create-ritual")}>Create Your Ritual</Button>
          </div>
        </div>
      </section>

      <section style={{ background: C.card, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
        <div className="container gifting-grid" style={{ padding: "72px 20px" }}>
          <div>
            <p style={{ ...label, color: C.rust, marginBottom: 14 }}>Gifting</p>
            <h2 style={{ ...serif, fontSize: "clamp(24px,3.6vw,32px)", color: C.ink, fontWeight: 500, marginBottom: 22 }}>Gifts that feel personal.</h2>
            <div className="gifting-list">
              <span style={{ ...sans, fontSize: 14, color: C.ink70 }}>Festival gifting</span>
              <span style={{ ...sans, fontSize: 14, color: C.ink70 }}>Birthday gifting</span>
              <span style={{ ...sans, fontSize: 14, color: C.ink70 }}>Wedding favours</span>
              <span style={{ ...sans, fontSize: 14, color: C.ink70 }}>Rakhi</span>
              <span style={{ ...sans, fontSize: 14, color: C.ink70 }}>Housewarming</span>
              <span style={{ ...sans, fontSize: 14, color: C.ink70 }}>Custom gifts</span>
            </div>
            <Button variant="outline" onClick={() => nav("catalogue", "category", { value: "gift-hampers" })} style={{ marginTop: 26 }}>Explore Gifting</Button>
          </div>
          <Placeholder label="Gift hamper flat-lay" ratio="4 / 3" />
        </div>
      </section>

      <section className="container" style={{ padding: "72px 20px" }}>
        <HowToOrder steps={HOW_TO_ORDER_HOME} />
      </section>

      <section style={{ background: C.ink, color: "#fff" }}>
        <div className="container" style={{ padding: "64px 20px", textAlign: "center" }}>
          <h2 style={{ ...serif, fontSize: "clamp(22px,3.4vw,28px)", fontWeight: 500, marginBottom: 12 }}>Have something special in mind?</h2>
          <p style={{ ...sans, fontSize: 14, color: "#D8CFC3", maxWidth: 420, margin: "0 auto 24px", lineHeight: 1.7 }}>
            Tell us what you're looking for and we'll help you create the right ritual.
          </p>
          <a href={waLink(settings.whatsapp, "Hello Mysaa Rituals!")} target="_blank" rel="noreferrer" style={{ ...label, color: "#fff", textDecoration: "underline", textUnderlineOffset: "4px" }}>
            Chat on WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}

function CataloguePage({ data, nav, initialType, initialQuery }) {
  const [fragrance, setFragrance] = useState(initialType === "fragrance" ? (initialQuery.value || "all") : "all");
  const [category, setCategory] = useState(
    initialType === "category" ? (initialQuery.value || "all") : initialType === "candle" ? "hero-jar-candle" : "all"
  );
  const [search, setSearch] = useState("");

  const fragranceById = Object.fromEntries(data.fragrances.map((f) => [f.slug, f]));

  const filtered = useMemo(() => {
    return data.products.filter((p) => {
      if (!p.active) return false;
      if (category !== "all" && p.categorySlug !== category) return false;
      if (fragrance !== "all" && p.fragranceSlug !== fragrance) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data.products, category, fragrance, search]);

  const resetFilters = () => { setCategory("all"); setFragrance("all"); setSearch(""); };

  return (
    <div className="container" style={{ padding: "48px 20px 80px" }}>
      <SectionHeading eyebrow="The Full Collection" title="Catalogue" sub="Browse by fragrance, or by candle format, wax melts and gift hampers." />

      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 20 }}>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…"
          style={{ ...sans, fontSize: 14, padding: "12px 16px", border: `1px solid ${C.line}`, background: "#fff", maxWidth: 320 }}
        />

        <div>
          <p style={{ ...label, color: C.ink70, marginBottom: 10 }}>Shop by Category</p>
          <div className="chip-wrap">
            <FilterChip active={category === "all"} onClick={() => setCategory("all")}>All</FilterChip>
            {data.categories.filter((c) => c.active).map((c) => (
              <FilterChip key={c.slug} active={category === c.slug} onClick={() => setCategory(c.slug)}>{c.name}</FilterChip>
            ))}
          </div>
        </div>

        <div>
          <p style={{ ...label, color: C.ink70, marginBottom: 10 }}>Shop by Fragrance</p>
          <div className="chip-wrap">
            <FilterChip active={fragrance === "all"} onClick={() => setFragrance("all")}>All</FilterChip>
            {data.fragrances.filter((f) => f.active).map((f) => (
              <FilterChip key={f.slug} active={fragrance === f.slug} onClick={() => setFragrance(f.slug)}>{f.name}</FilterChip>
            ))}
          </div>
        </div>

        {(category !== "all" || fragrance !== "all" || search) && (
          <button onClick={resetFilters} style={{ ...label, color: C.rust, textAlign: "left", textDecoration: "underline", textUnderlineOffset: "3px" }}>
            Clear filters
          </button>
        )}
      </div>

      <p style={{ ...sans, fontSize: 13, color: C.ink70, marginTop: 28 }}>{filtered.length} product{filtered.length !== 1 ? "s" : ""} found</p>

      <div className="product-grid" style={{ marginTop: 20 }}>
        {filtered.map((p) => <ProductCard key={p.slug} product={p} fragrance={fragranceById[p.fragranceSlug]} nav={nav} />)}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <p style={{ ...sans, color: C.ink70, marginBottom: 20 }}>No products match those filters yet.</p>
          <Button variant="outline" onClick={resetFilters}>Clear filters</Button>
        </div>
      )}
    </div>
  );
}

function ProductDetailPage({ data, nav, slug, settings }) {
  const [qty, setQty] = useState(1);
  const product = data.products.find((p) => p.slug === slug);

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
  const related = data.products.filter((p) => p.active && p.categorySlug === product.categorySlug && p.slug !== product.slug).slice(0, 4);

  const enquiryMsg = `Hello Mysaa Rituals! I'd like to order:\n\n${product.name}\nQuantity: ${qty}\nPrice: ${inr(product.price * qty)}\n\nCould you confirm availability and delivery details?`;

  const infoRows = [
    ["Size", product.volume],
    ["Weight", product.weight],
    ["Variant", fragrance ? fragrance.name : ""],
    ["Fragrance Notes", fragrance ? fragrance.notes : ""],
    ["Material / Ingredients", product.materials],
    ["Packaging", product.packaging],
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
        <Placeholder label={product.name} ratio="4 / 5" />

        <div>
          <h1 style={{ ...serif, fontSize: "clamp(26px,4vw,36px)", color: C.ink, fontWeight: 500, marginBottom: 14 }}>{product.name}</h1>
          <p style={{ ...sans, fontSize: 22, color: C.ink, marginBottom: 16 }}>{inr(product.price)}</p>
          <p style={{ ...sans, fontSize: 15, color: C.ink70, lineHeight: 1.75, marginBottom: 28 }}>{product.shortDescription}</p>

          {fragrance && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ ...label, color: C.ink70, marginBottom: 10 }}>Variant</p>
              <span style={{ ...sans, fontSize: 13, padding: "9px 16px", border: `1px solid ${C.ink}`, display: "inline-block" }}>{fragrance.name}</span>
            </div>
          )}

          <div style={{ marginBottom: 28 }}>
            <p style={{ ...label, color: C.ink70, marginBottom: 10 }}>Quantity</p>
            <div style={{ display: "inline-flex", alignItems: "center", border: `1px solid ${C.line}` }}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ ...sans, fontSize: 16, padding: "10px 16px", color: C.ink }} aria-label="Decrease quantity">−</button>
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
            {related.map((p) => <ProductCard key={p.slug} product={p} fragrance={data.fragrances.find((f) => f.slug === p.fragranceSlug)} nav={nav} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateRitualPage({ settings }) {
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
        <Field label="Preferred fragrance or mood" value={form.fragrance} onChange={set("fragrance")} placeholder="e.g. warm sandalwood, fresh florals…" />
        <Field label="Format" value={form.format} onChange={set("format")} placeholder="e.g. hero jar, wide jar, shot glass, wax melts, hamper" />
        <Field label="Occasion" value={form.occasion} onChange={set("occasion")} placeholder="e.g. Diwali, wedding favour, birthday" />
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
      <input {...props} style={{ ...sans, width: "100%", fontSize: 14, padding: "12px 14px", border: `1px solid ${C.line}`, background: "#fff" }} />
    </label>
  );
}
function FieldArea({ label: text, ...props }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ ...label, color: C.ink70, display: "block", marginBottom: 8 }}>{text}</span>
      <textarea {...props} rows={4} style={{ ...sans, width: "100%", fontSize: 14, padding: "12px 14px", border: `1px solid ${C.line}`, background: "#fff", resize: "vertical" }} />
    </label>
  );
}

function AboutPage() {
  return (
    <div className="container" style={{ padding: "48px 20px 80px", maxWidth: 760 }}>
      <SectionHeading eyebrow="Our Story" title="More than a candle." />
      <div style={{ marginTop: 28, display: "grid", gap: 20, ...sans, fontSize: 16, color: C.ink70, lineHeight: 1.8 }}>
        <p>Mysaa Rituals was created around a simple idea — that fragrance has the power to turn ordinary moments into memories. The smell of dhoop in a childhood home, jasmine gajras on a festival morning, roses pressed into an old letter — these are the moments we try to bottle into every candle, melt and sachet we make.</p>
        <p>Every piece is handcrafted with care, inspired by familiar Indian aromas, and designed to become part of someone's ritual — poured in small batches using a natural soy wax blend and cotton or wooden wicks.</p>
        <p>If nothing in the catalogue feels quite right, that's exactly what Custom Rituals are for. Tell us about your moment, and we'll create something made only for it.</p>
      </div>
      <div style={{ marginTop: 40 }}><Placeholder label="Studio / process photograph" ratio="16 / 9" /></div>

      <div style={{ marginTop: 64 }}>
        <SectionHeading eyebrow="Why Mysaa Rituals" title="Slow, deliberate, personal." />
        <div className="why-grid" style={{ marginTop: 32 }}>
          {[
            ["Handcrafted", "Made with care, not mass-produced."],
            ["Fragrance-led", "Inspired by memories, moods and familiar Indian aromas."],
            ["Personal", "Custom fragrances, formats, labels and gifting options."],
            ["Thoughtful Gifting", "Created for moments worth remembering."],
          ].map(([t, d]) => (
            <div key={t} className="hairline-top">
              <h4 style={{ ...serif, fontSize: 16, color: C.ink, fontWeight: 500, marginBottom: 8 }}>{t}</h4>
              <p style={{ ...sans, fontSize: 13.5, color: C.ink70, lineHeight: 1.6 }}>{d}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 64 }}>
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
  return (
    <div className="container" style={{ padding: "48px 20px 80px", maxWidth: 640 }}>
      <SectionHeading eyebrow="We'd Love To Hear From You" title="Get in touch" />
      <div style={{ marginTop: 32, display: "grid", gap: 0 }}>
        <ContactRow label="WhatsApp" value={settings.phone} href={waLink(settings.whatsapp, "Hello Mysaa Rituals!")} />
        <ContactRow label="Email" value={settings.email} href={`mailto:${settings.email}`} />
        <ContactRow label="Instagram" value={settings.instagramHandle || "@mysaarituals"} href={settings.instagram} />
        {settings.address && <ContactRow label="Studio" value={settings.address} />}
      </div>
    </div>
  );
}
function ContactRow({ label: text, value, href }) {
  const content = (
    <div style={{ padding: "20px 0", borderBottom: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ ...label, color: C.ink70 }}>{text}</span>
      <span style={{ ...sans, fontSize: 14, color: C.ink, fontWeight: 500 }}>{value}</span>
    </div>
  );
  return href ? <a href={href} target="_blank" rel="noreferrer">{content}</a> : content;
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

  const nav = useCallback((page, param, query) => { window.location.hash = buildHash(page, param, query); }, []);

  useEffect(() => {
    if (data && data.settings) document.title = data.settings.seoTitle || "Mysaa Rituals";
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
  else if (route.page === "create-ritual") page = <CreateRitualPage settings={settings} />;
  else if (route.page === "about") page = <AboutPage />;
  else if (route.page === "contact") page = <ContactPage settings={settings} />;
  else page = <HomePage data={data} nav={nav} settings={settings} />;

  return (
    <React.Fragment>
      <Header nav={nav} settings={settings} />
      <main style={{ minHeight: "60vh" }}>{page}</main>
      <Footer nav={nav} settings={settings} />
      <WhatsAppFloat settings={settings} />
    </React.Fragment>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
