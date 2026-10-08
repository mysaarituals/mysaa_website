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
    if (!product)
        return 0;
    if (Number(product.mrp || 0) > 0)
        return Number(product.mrp);
    const rate = Number(product.discountPercent || DISCOUNT_RATES[product.categorySlug] || 0);
    const current = Number(product.price || 0);
    return rate > 0 && current > 0 ? current / (1 - rate / 100) : 0;
}
function discountPercent(product) {
    if (!product)
        return 0;
    return Number(product.discountPercent || DISCOUNT_RATES[product.categorySlug] || 0);
}
function DiscountedPrice({ product, currentPrice, large = false }) {
    const regular = regularPrice(product);
    const current = Number(currentPrice || (product === null || product === void 0 ? void 0 : product.price) || 0);
    const discount = discountPercent(product);
    return (React.createElement("div", { className: large ? "price-stack price-stack-large" : "price-stack" },
        regular > current && current > 0 && React.createElement("div", { className: "price-original-row" },
            React.createElement("span", { className: "price-original" }, inr(regular)),
            discount > 0 && React.createElement("span", { className: "price-discount" },
                "-",
                discount,
                "%")),
        React.createElement("span", { className: large ? "price-current price-current-large" : "price-current" }, inr(current))));
}
// Product customisation pricing. Standard packaging is included in the base price.
// Standard packaging is included where applicable. Flower moulds are included by default on jar products.
const PACKAGING_OPTIONS = {
    standard: {
        label: "Standard Packaging",
        shortLabel: "Standard",
        priceDelta: 0,
        description: "Our carefully packed everyday presentation, keeping the Mysaa Rituals experience simple and beautiful."
    }
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
    if (!src || failed)
        return React.createElement(Placeholder, { label: text, ratio: ratio });
    return React.createElement("div", { style: { aspectRatio: ratio, background: C.card, border: `1px solid ${C.line}`, overflow: "hidden" } },
        React.createElement("img", { src: src, alt: text || "Mysaa Rituals", onError: () => setFailed(true), style: { width: "100%", height: "100%", objectFit: "cover", display: "block" } }));
}
function waLink(number, message) {
    const clean = (number || "").replace(/[^0-9]/g, "");
    return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
const CART_KEY = "mysaa_rituals_cart_v1";
function readCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    }
    catch (_) {
        return [];
    }
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
    if (existing)
        existing.qty = Number(existing.qty || 0) + Number(item.qty || 1);
    else
        items.push({ ...item, key });
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
    if (queryPart)
        new URLSearchParams(queryPart).forEach((v, k) => (query[k] = v));
    return { page, param, query };
}
function buildHash(page, param, query) {
    let h = `#/${page}`;
    if (param)
        h += `/${encodeURIComponent(param)}`;
    if (query && Object.keys(query).length)
        h += `?${new URLSearchParams(query).toString()}`;
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
                const results = await Promise.all(files.map((f) => fetch(`data/${f}.json`).then((r) => {
                    if (!r.ok)
                        throw new Error(`Failed to load ${f}.json`);
                    return r.json();
                })));
                const images = await fetch("data/images.json").then((r) => r.ok ? r.json() : { products: {}, fragrances: {} }).catch(() => ({ products: {}, fragrances: {} }));
                if (!alive)
                    return;
                const [products, fragrances, categories, settings] = results;
                setState({ loading: false, error: null, data: { products, fragrances, categories, settings, images } });
            }
            catch (err) {
                if (!alive)
                    return;
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
    return (React.createElement("div", { style: {
            aspectRatio: ratio, background: C.card, border: `1px solid ${C.line}`,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        } },
        React.createElement("div", { style: { textAlign: "center" } },
            React.createElement("p", { style: { ...sans, color: C.ink70, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 } }, "Mysaa Rituals"),
            React.createElement("p", { style: { ...sans, color: C.ink70, fontSize: 12 } }, text))));
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
    return (React.createElement(Comp, { href: href, target: target, rel: target === "_blank" ? "noreferrer" : undefined, onClick: onClick, style: { ...base, ...variants[variant], ...styleOverride }, onMouseEnter: (e) => (e.currentTarget.style.opacity = "0.75"), onMouseLeave: (e) => (e.currentTarget.style.opacity = "1") }, children));
}
function SectionHeading({ eyebrow, title, sub, align = "left" }) {
    return (React.createElement("div", { style: { maxWidth: 640, margin: align === "center" ? "0 auto" : 0, textAlign: align } },
        eyebrow && React.createElement("p", { style: { ...label, color: C.rust, marginBottom: 10 } }, eyebrow),
        React.createElement("h2", { style: { ...serif, color: C.ink, fontWeight: 500, fontSize: "clamp(26px,4vw,36px)", marginBottom: 12 } }, title),
        sub && React.createElement("p", { style: { ...sans, color: C.ink70, fontSize: 16, lineHeight: 1.7 } }, sub)));
}
function Logo({ size = 42 }) {
    return React.createElement("img", { src: "assets/logo.png", alt: "Mysaa Rituals", style: { height: size, width: "auto", objectFit: "contain" } });
}
function ChatIcon({ color = "currentColor", size = 14 }) {
    return (React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.8" },
        React.createElement("path", { d: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" })));
}
function InstagramIcon({ color = "currentColor", size = 16 }) {
    return (React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.6" },
        React.createElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "5" }),
        React.createElement("circle", { cx: "12", cy: "12", r: "4" }),
        React.createElement("circle", { cx: "17.2", cy: "6.8", r: "1", fill: color, stroke: "none" })));
}
function SearchIcon({ color = "currentColor", size = 18 }) {
    return (React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.7" },
        React.createElement("circle", { cx: "11", cy: "11", r: "7" }),
        React.createElement("path", { d: "M21 21l-4.3-4.3" })));
}
function ChevronDownIcon({ color = "currentColor", size = 12 }) {
    return (React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2" },
        React.createElement("path", { d: "M6 9l6 6 6-6" })));
}
function HandIcon({ color = C.rust, size = 26 }) {
    return (React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5" },
        React.createElement("path", { d: "M8 12V5.5a1.5 1.5 0 0 1 3 0V11" }),
        React.createElement("path", { d: "M11 11V4a1.5 1.5 0 0 1 3 0v7" }),
        React.createElement("path", { d: "M14 11V5.5a1.5 1.5 0 0 1 3 0V13" }),
        React.createElement("path", { d: "M8 12l-1.6-1.4a1.4 1.4 0 0 0-2 2L8.6 17A5 5 0 0 0 12.4 19h1.1a5.5 5.5 0 0 0 5.5-5.5V9.5a1.5 1.5 0 0 0-3 0" })));
}
function FlameIcon({ color = C.rust, size = 26 }) {
    return (React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5" },
        React.createElement("path", { d: "M12 2.5c1 3-3 4.5-3 8.5a3 3 0 0 0 6 0c0-1.5-1-2-1-3.5 1.5 1 3 3.2 3 5.5a5 5 0 0 1-10 0c0-4.5 4-6.5 5-10.5z" })));
}
function SparkleIcon({ color = C.rust, size = 26 }) {
    return (React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5" },
        React.createElement("path", { d: "M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z" }),
        React.createElement("path", { d: "M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15z" })));
}
function GiftIcon({ color = C.rust, size = 26 }) {
    return (React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5" },
        React.createElement("rect", { x: "3", y: "9", width: "18", height: "11", rx: "1" }),
        React.createElement("path", { d: "M3 9h18v3H3z", fill: color, stroke: "none", opacity: 0.12 }),
        React.createElement("path", { d: "M12 9v11" }),
        React.createElement("path", { d: "M12 9C9 9 7.5 7.8 7.5 6.2A2.2 2.2 0 0 1 9.7 4c1.7 0 2.3 1.8 2.3 5z" }),
        React.createElement("path", { d: "M12 9c3 0 4.5-1.2 4.5-2.8A2.2 2.2 0 0 0 14.3 4c-1.7 0-2.3 1.8-2.3 5z" })));
}
const WHY_ITEMS = [
    { icon: HandIcon, title: "Handcrafted", body: "Made with care, not mass-produced." },
    { icon: FlameIcon, title: "Fragrance-led", body: "Inspired by memories, moods and familiar Indian aromas." },
    { icon: SparkleIcon, title: "Personal", body: "Custom fragrances, formats, labels and gifting options." },
    { icon: GiftIcon, title: "Thoughtful Gifting", body: "Created for moments worth remembering." },
];
function WhyGrid({ items = WHY_ITEMS }) {
    return (React.createElement("div", { className: "why-grid" }, items.map(({ icon: Icon, title, body }) => (React.createElement("div", { key: title, className: "hairline-top" },
        React.createElement("div", { style: { marginBottom: 14 } },
            React.createElement(Icon, null)),
        React.createElement("h4", { style: { ...serif, fontSize: 17, color: C.ink, fontWeight: 500, marginBottom: 8 } }, title),
        React.createElement("p", { style: { ...sans, fontSize: 13.5, color: C.ink70, lineHeight: 1.6 } }, body))))));
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
    const runSearch = () => { if (searchVal.trim())
        nav("catalogue", "all", { q: searchVal.trim() }); setSearchOpen(false); };
    return (React.createElement("header", { style: { position: "sticky", top: 0, zIndex: 40, background: "rgba(250,247,240,0.94)", borderBottom: `1px solid ${C.line}`, backdropFilter: "blur(6px)" } },
        React.createElement("div", { className: "container", style: { display: "flex", alignItems: "center", justifyContent: "space-between", height: 76 } },
            React.createElement("button", { onClick: () => nav("home"), "aria-label": "Mysaa Rituals home", style: { display: "flex", alignItems: "center" } },
                React.createElement(Logo, { size: 78 })),
            React.createElement("nav", { style: { display: "flex", alignItems: "center", gap: 30 }, className: "desktop-nav" },
                links.map(([lbl, page, param]) => (React.createElement("button", { key: lbl, onClick: () => nav(page, param), style: linkStyle(page) }, lbl))),
                React.createElement("div", { style: { position: "relative" }, onMouseEnter: () => setDiscoverOpen(true), onMouseLeave: () => setDiscoverOpen(false) },
                    React.createElement("button", { onClick: () => setDiscoverOpen((v) => !v), style: { ...sans, fontSize: 14, color: C.ink, display: "inline-flex", alignItems: "center", gap: 5 } },
                        "Discover ",
                        React.createElement(ChevronDownIcon, null)),
                    discoverOpen && (React.createElement("div", { style: { position: "absolute", top: "100%", left: 0, background: "#FFFDFA", border: `1px solid ${C.line}`, boxShadow: "0 12px 28px rgba(68,55,47,0.12)", minWidth: 210, padding: "8px 0", zIndex: 60 } }, discoverLinks.map(([lbl, page, param, query]) => (React.createElement("button", { key: lbl, onClick: () => { nav(page, param, query); setDiscoverOpen(false); }, style: { ...sans, display: "block", width: "100%", textAlign: "left", fontSize: 13.5, color: C.ink, padding: "10px 18px" } }, lbl)))))),
                tailLinks.map(([lbl, page, param]) => (React.createElement("button", { key: lbl, onClick: () => nav(page, param), style: linkStyle(page) }, lbl)))),
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 16 } },
                React.createElement("button", { onClick: () => nav("cart"), "aria-label": "Cart", className: "cart-nav-button" },
                    React.createElement("span", null, "Cart"),
                    React.createElement("span", { className: "cart-count" }, useCartCount())),
                React.createElement("div", { className: "desktop-nav", style: { position: "relative" } }, searchOpen ? (React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
                    React.createElement("input", { autoFocus: true, value: searchVal, onChange: (e) => setSearchVal(e.target.value), onKeyDown: (e) => { if (e.key === "Enter")
                            runSearch(); if (e.key === "Escape")
                            setSearchOpen(false); }, placeholder: "Search\u2026", style: { ...sans, fontSize: 13, padding: "8px 12px", border: `1px solid ${C.line}`, background: "#fff", width: 170 } }),
                    React.createElement("button", { onClick: runSearch, "aria-label": "Search", style: { color: C.ink } },
                        React.createElement(SearchIcon, null)))) : (React.createElement("button", { onClick: () => setSearchOpen(true), "aria-label": "Search", style: { color: C.ink, display: "flex" } },
                    React.createElement(SearchIcon, null)))),
                React.createElement("button", { className: "mobile-only", onClick: () => setOpen(!open), "aria-label": "Menu", style: { padding: 8 } },
                    React.createElement("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: C.ink, strokeWidth: "1.6" },
                        React.createElement("path", { d: "M3 6h18M3 12h18M3 18h18" }))))),
        open && (React.createElement("div", { className: "mobile-only", style: { padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 2, background: C.cream, borderTop: `1px solid ${C.line}` } }, [...links.map((l) => [...l, null]), ...discoverLinks, ...tailLinks.map((l) => [...l, null]), ["Cart", "cart", null, null]].map(([lbl, page, param, query]) => (React.createElement("button", { key: lbl, onClick: () => { nav(page, param, query); setOpen(false); }, style: { ...sans, textAlign: "left", padding: "12px 4px", fontSize: 15, color: C.ink, borderBottom: `1px solid ${C.line}` } }, lbl)))))));
}
function Footer({ nav, settings }) {
    return (React.createElement("footer", { style: { background: "#FCFAF7", borderTop: `1px solid ${C.line}`, marginTop: 80 } },
        React.createElement("div", { className: "container", style: { padding: "56px 20px 32px" } },
            React.createElement("div", { className: "footer-grid" },
                React.createElement("div", null,
                    React.createElement("div", { style: { marginBottom: 16 } },
                        React.createElement(Logo, { size: 66 })),
                    React.createElement("p", { style: { ...sans, color: C.ink70, fontSize: 14, lineHeight: 1.7, maxWidth: 300, marginBottom: 16 } },
                        settings.tagline || "Every flame remembers.",
                        " Small-batch candles, wax melts and gift hampers, made slowly and in limited quantity."),
                    React.createElement("div", { style: { display: "flex", gap: 10 } },
                        React.createElement("a", { href: settings.instagram, target: "_blank", rel: "noreferrer", "aria-label": "Instagram", style: { width: 34, height: 34, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.ink } },
                            React.createElement(InstagramIcon, null)),
                        React.createElement("a", { href: waLink(settings.whatsapp, "Hello Mysaa Rituals!"), target: "_blank", rel: "noreferrer", "aria-label": "WhatsApp", style: { width: 34, height: 34, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.ink } },
                            React.createElement(ChatIcon, null)))),
                React.createElement("div", null,
                    React.createElement("h4", { style: { ...label, marginBottom: 16, color: C.ink70 } }, "Explore"),
                    React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
                        React.createElement("button", { onClick: () => nav("catalogue", "all"), style: { ...sans, fontSize: 14, color: C.ink, textAlign: "left" } }, "Catalogue"),
                        React.createElement("button", { onClick: () => nav("catalogue", "fragrance"), style: { ...sans, fontSize: 14, color: C.ink, textAlign: "left" } }, "Shop by Fragrance"),
                        React.createElement("button", { onClick: () => nav("catalogue", "candle"), style: { ...sans, fontSize: 14, color: C.ink, textAlign: "left" } }, "Shop by Candle"),
                        React.createElement("button", { onClick: () => nav("catalogue", "category", { value: "gift-hampers" }), style: { ...sans, fontSize: 14, color: C.ink, textAlign: "left" } }, "Gift Hampers"),
                        settings.feedbackUrl && React.createElement("a", { href: settings.feedbackUrl, target: "_blank", rel: "noreferrer", style: { ...sans, fontSize: 14, color: C.rust } }, "Share Feedback \u2197"))),
                React.createElement("div", null,
                    React.createElement("h4", { style: { ...label, marginBottom: 16, color: C.ink70 } }, "Reach us"),
                    React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
                        React.createElement("a", { href: waLink(settings.whatsapp, "Hello Mysaa Rituals!"), target: "_blank", rel: "noreferrer", style: { ...sans, fontSize: 14, color: C.ink } }, "WhatsApp"),
                        React.createElement("a", { href: `mailto:${settings.email}`, style: { ...sans, fontSize: 14, color: C.ink } }, settings.email),
                        React.createElement("a", { href: settings.instagram, target: "_blank", rel: "noreferrer", style: { ...sans, fontSize: 14, color: C.ink } }, settings.instagramHandle || "Instagram"),
                        settings.phone && React.createElement("span", { style: { ...sans, fontSize: 14, color: C.ink } }, settings.phone)))),
            React.createElement("div", { style: { borderTop: `1px solid ${C.line}`, marginTop: 40, paddingTop: 20, ...sans, fontSize: 12, color: C.ink70, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 } },
                React.createElement("span", null,
                    "\u00A9 ",
                    new Date().getFullYear(),
                    " ",
                    settings.brandName || "Mysaa Rituals",
                    ". All rights reserved."),
                settings.address && React.createElement("span", { style: { letterSpacing: "0.04em", textTransform: "uppercase", fontSize: 11 } }, settings.address)))));
}
/* ============================================================
   Product / Fragrance cards
   ============================================================ */
function ProductCard({ product, fragrance, images, nav }) {
    const outOfStock = isOutOfStock(product);
    return (React.createElement("button", { className: `product-card${outOfStock ? " product-card-out-of-stock" : ""}`, onClick: () => nav("product", product.slug), style: { textAlign: "left", display: "flex", flexDirection: "column", width: "100%", height: "100%" } },
        React.createElement("div", { className: "hairline-top", style: { paddingTop: 0 } },
            React.createElement("p", { style: { ...label, color: C.ink70, marginBottom: 8, minHeight: 14 } }, outOfStock ? "Out of Stock" : product.bestseller ? "Bestseller" : product.isNew ? "New" : product.customizable ? "Customizable" : "\u00A0"),
            isMoldCandle(product) ? (React.createElement("div", { className: "mold-product-card-visual" },
                React.createElement("div", { className: "mold-image-placeholder" }, "Add mold image"))) : (React.createElement(ImageOrPlaceholder, { src: productImage(product, images, 0), label: product.name }))),
        React.createElement("div", { className: "product-card-body", style: { paddingTop: 14 } },
            React.createElement("h3", { style: { ...serif, fontSize: 17, color: C.ink, fontWeight: 500, marginBottom: 4 } }, product.name),
            React.createElement("p", { style: { ...sans, fontSize: 13, color: C.ink70, marginBottom: 12 }, className: "line-clamp-2" }, product.shortDescription),
            React.createElement("div", { className: "product-card-actions", style: { marginTop: "auto" } },
                React.createElement("div", { className: "product-card-price" },
                    React.createElement(DiscountedPrice, { product: product, currentPrice: product.price })),
                React.createElement("span", { className: "product-card-details-link", style: { ...label, color: C.rust, textDecoration: "underline", textUnderlineOffset: "3px" } }, "View Details")))));
}
function FragranceCard({ fragrance, images, nav }) {
    return (React.createElement("button", { onClick: () => nav("catalogue", "fragrance", { value: fragrance.slug }), style: { textAlign: "left", display: "block" } },
        React.createElement(ImageOrPlaceholder, { src: fragranceImage(fragrance, images, 0), label: fragrance.name, ratio: "4 / 5" }),
        React.createElement("div", { style: { paddingTop: 14 } },
            React.createElement("h3", { style: { ...serif, fontSize: 17, color: C.ink, fontWeight: 500, marginBottom: 6 } }, fragrance.name),
            React.createElement("p", { style: { ...sans, fontSize: 13, color: C.ink70, lineHeight: 1.6, marginBottom: 8 }, className: "line-clamp-2" }, fragrance.description),
            React.createElement("p", { style: { ...label, color: C.ink70, fontSize: 10.5 } }, (fragrance.mood || "").split(",").map((m) => m.trim()).join(" · ")))));
}
function FilterChip({ active, onClick, children }) {
    return (React.createElement("button", { onClick: onClick, style: {
            ...sans, fontSize: 13, padding: "9px 16px", border: `1px solid ${active ? C.ink : C.line}`,
            background: active ? C.ink : "#fff", color: active ? "#fff" : C.ink,
        } }, children));
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
    return (React.createElement("div", null,
        React.createElement(SectionHeading, { eyebrow: eyebrow, title: title }),
        React.createElement("div", { className: "steps-grid", style: { marginTop: 32 } }, steps.map((s, i) => (React.createElement("div", { key: s.title, className: "hairline-top" },
            React.createElement("p", { style: { ...label, color: C.ink70, marginBottom: 14 } }, String(i + 1).padStart(2, "0")),
            React.createElement("h4", { style: { ...serif, fontSize: 17, color: C.ink, fontWeight: 500, marginBottom: 8 } }, s.title),
            React.createElement("p", { style: { ...sans, fontSize: 13.5, color: C.ink70, lineHeight: 1.6 } }, s.body)))))));
}
/* ============================================================
   Pages
   ============================================================ */
function FestivalBanner({ nav, settings }) {
    var _a;
    const enabled = String((_a = settings.festivalBannerEnabled) !== null && _a !== void 0 ? _a : "true").toLowerCase() !== "false";
    if (!enabled)
        return null;
    const eyebrow = settings.festivalBannerEyebrow || "Festive Collection";
    const title = settings.festivalBannerTitle || "Light up the season. Gift a little warmth.";
    const text = settings.festivalBannerText || "Our festive edit brings together candles and thoughtful gifts for Navratri, Dussehra and the celebrations ahead.";
    const buttonText = settings.festivalBannerButtonText || "Shop the Festive Collection";
    const image = settings.festivalBannerImage || "";
    const action = () => {
        const category = settings.festivalBannerCategory || "festivals-celebrations";
        nav("catalogue", "occasion", { value: category });
    };
    return (React.createElement("section", { className: "festival-banner", "aria-label": eyebrow, style: image ? { backgroundImage: `linear-gradient(90deg, rgba(250,247,240,.96) 0%, rgba(250,247,240,.82) 46%, rgba(250,247,240,.16) 100%), url("${image}")` } : undefined },
        React.createElement("div", { className: "container festival-banner-inner" },
            React.createElement("div", { className: "festival-banner-copy" },
                React.createElement("p", { style: { ...label, color: C.rust, marginBottom: 12 } }, eyebrow),
                React.createElement("h2", { style: { ...serif, fontSize: "clamp(28px,4vw,42px)", color: C.ink, fontWeight: 500, lineHeight: 1.05, marginBottom: 12 } }, title),
                React.createElement("p", { style: { ...sans, color: C.ink70, fontSize: 15, lineHeight: 1.7, maxWidth: 560, marginBottom: 22 } }, text),
                React.createElement(Button, { variant: "rust", onClick: action },
                    buttonText,
                    " \u2192")))));
}
function HomePage({ data, nav, settings }) {
    var _a, _b, _c, _d, _e, _f;
    const fragranceById = Object.fromEntries(data.fragrances.map((f) => [f.slug, f]));
    const activeFragrances = data.fragrances.filter((f) => f.active);
    // Homepage collection: prioritize products explicitly marked as bestsellers
    // across candle formats. If the data has no bestseller flags yet, fall back
    // to a balanced mix of Signature Ritual, Everyday Ritual and Mini Ritual candles.
    const candleProducts = data.products.filter((p) => p.active && ["hero-jar-candle", "wide-jar-candle", "shot-glass-candle"].includes(p.categorySlug));
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
    return (React.createElement("div", null,
        React.createElement("section", { style: { borderBottom: `1px solid ${C.line}` } },
            React.createElement("div", { className: "container hero-grid", style: { padding: "72px 20px 64px" } },
                React.createElement("div", { style: { maxWidth: 540 } },
                    React.createElement("p", { style: { ...label, color: C.rust, marginBottom: 16 } }, "Handcrafted in small batches"),
                    React.createElement("h1", { style: { ...serif, fontSize: "clamp(38px,6vw,56px)", color: C.ink, fontWeight: 500, lineHeight: 1.02, marginBottom: 20 } }, "Fragrance, Made Personal."),
                    React.createElement("p", { style: { ...sans, fontSize: 16, color: C.ink70, lineHeight: 1.75, marginBottom: 30, maxWidth: 470 } }, "Handcrafted candles and gifts inspired by Indian fragrances, memories and everyday rituals."),
                    React.createElement("div", { className: "hero-actions" },
                        React.createElement("button", { className: "hero-action hero-action-primary", onClick: () => nav("catalogue", "all") }, "Explore the Catalogue"),
                        React.createElement("button", { className: "hero-action hero-action-secondary", onClick: () => nav("create-ritual") }, "Create Your Ritual"))),
                React.createElement(ImageOrPlaceholder, { src: (_b = (_a = data.images) === null || _a === void 0 ? void 0 : _a.site) === null || _b === void 0 ? void 0 : _b.hero, label: "Hero product photograph", ratio: "4 / 3" }))),
        React.createElement(FestivalBanner, { nav: nav, settings: settings }),
        React.createElement("section", { className: "container", style: { padding: "72px 20px 24px" } },
            React.createElement(SectionHeading, { eyebrow: "The Fragrances", title: "Every fragrance holds a feeling.", sub: "From the warmth of sandalwood to the romance of jasmine and the mystery of night-blooming flowers, each Mysaa Ritual is created to evoke something personal." })),
        React.createElement("section", { className: "container", style: { padding: "24px 20px 72px" } },
            React.createElement("div", { className: "fragrance-grid" }, activeFragrances.map((f) => (React.createElement(FragranceCard, { key: f.slug, fragrance: f, images: data.images, nav: nav }))))),
        discoverySet && (React.createElement("section", { className: "container", style: { padding: "8px 20px 72px" } },
            React.createElement("div", { className: "discovery-set-feature" },
                React.createElement(ImageOrPlaceholder, { src: productImage(discoverySet, data.images, 0), label: discoverySet.name, ratio: "4 / 3" }),
                React.createElement("div", null,
                    React.createElement("p", { style: { ...label, color: C.rust, marginBottom: 12 } }, "New \u00B7 Discovery Set"),
                    React.createElement("h2", { style: { ...serif, fontSize: "clamp(28px,3.6vw,36px)", color: C.ink, fontWeight: 500, marginBottom: 12 } }, "Six fragrances. One beautiful beginning."),
                    React.createElement("p", { style: { ...sans, fontSize: 15, color: C.ink70, lineHeight: 1.75, maxWidth: 520, marginBottom: 18 } }, "Explore all six Mysaa Rituals fragrances in six 60 ml Mini Ritual candles \u2014 a complete set for discovering the scent that becomes your ritual."),
                    React.createElement("div", { className: "price-stack price-stack-large", style: { marginBottom: 20 } },
                        React.createElement("span", { style: { ...sans, fontSize: 20, color: C.ink, fontWeight: 500 } }, inr(discoverySet.price))),
                    React.createElement(Button, { variant: "outline", onClick: () => nav("product", discoverySet.slug) }, "View Discovery Set \u2192"))))),
        React.createElement("section", { style: { background: C.card, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` } },
            React.createElement("div", { className: "container", style: { padding: "72px 20px" } },
                React.createElement(SectionHeading, { eyebrow: "Discover", title: "Discover your ritual", align: "center" }),
                React.createElement("div", { className: "discovery-grid", style: { marginTop: 38 } },
                    React.createElement("button", { onClick: () => nav("catalogue", "fragrance"), className: "editorial-card" },
                        React.createElement("p", { style: { ...label, color: C.rust, marginBottom: 12 } }, "01"),
                        React.createElement("h3", { style: { ...serif, fontSize: 24, color: C.ink, fontWeight: 500, marginBottom: 8 } }, "Shop by Fragrance"),
                        React.createElement("p", { style: { ...sans, fontSize: 14, color: C.ink70, lineHeight: 1.65, marginBottom: 16 } }, "Find the scent that feels like you."),
                        React.createElement("span", { style: { ...label, color: C.rust } }, "Explore \u2192")),
                    React.createElement("button", { onClick: () => nav("catalogue", "candle"), className: "editorial-card" },
                        React.createElement("p", { style: { ...label, color: C.rust, marginBottom: 12 } }, "02"),
                        React.createElement("h3", { style: { ...serif, fontSize: 24, color: C.ink, fontWeight: 500, marginBottom: 8 } }, "Shop by Candle"),
                        React.createElement("p", { style: { ...sans, fontSize: 14, color: C.ink70, lineHeight: 1.65, marginBottom: 16 } }, "Choose your format first \u2014 Signature Ritual, Everyday Ritual, Mini Ritual or Grand Ritual."),
                        React.createElement("span", { style: { ...label, color: C.rust } }, "Explore \u2192"))),
                React.createElement("div", { className: "discovery-grid compact-discovery-grid", style: { marginTop: 16 } },
                    React.createElement("div", { className: "editorial-card compact-editorial-card" },
                        React.createElement("p", { style: { ...label, color: C.rust, marginBottom: 10 } }, "03"),
                        React.createElement("h3", { style: { ...serif, fontSize: 24, color: C.ink, fontWeight: 500, marginBottom: 8 } }, "Shop by Feeling"),
                        React.createElement("p", { style: { ...sans, fontSize: 13.5, color: C.ink70, lineHeight: 1.55, marginBottom: 16 } }, "Start with the mood you want to bring into your space."),
                        React.createElement("select", { className: "discovery-select", defaultValue: "", onChange: (e) => e.target.value && nav("catalogue", "feeling", { value: e.target.value }), "aria-label": "Shop by feeling" },
                            React.createElement("option", { value: "", disabled: true }, "Choose a feeling"),
                            feelingGroups.map((group) => React.createElement("option", { key: group.slug, value: group.slug }, group.title)))),
                    React.createElement("div", { className: "editorial-card compact-editorial-card" },
                        React.createElement("p", { style: { ...label, color: C.rust, marginBottom: 10 } }, "04"),
                        React.createElement("h3", { style: { ...serif, fontSize: 24, color: C.ink, fontWeight: 500, marginBottom: 8 } }, "Shop by Occasion"),
                        React.createElement("p", { style: { ...sans, fontSize: 13.5, color: C.ink70, lineHeight: 1.55, marginBottom: 16 } }, "Choose something for the moment you're celebrating."),
                        React.createElement("select", { className: "discovery-select", defaultValue: "", onChange: (e) => e.target.value && nav("catalogue", "occasion", { value: e.target.value }), "aria-label": "Shop by occasion" },
                            React.createElement("option", { value: "", disabled: true }, "Choose an occasion"),
                            occasionGroups.map((group) => React.createElement("option", { key: group.slug, value: group.slug }, group.title))))))),
        React.createElement("section", { className: "container", style: { padding: "72px 20px" } },
            React.createElement(SectionHeading, { eyebrow: "Best Sellers", title: "Made to be lit slowly.", sub: "A selection of Mysaa candles across our Signature Ritual, Everyday Ritual and Mini Ritual formats." }),
            React.createElement("div", { className: "product-grid", style: { marginTop: 36 } }, featured.map((p) => (React.createElement(ProductCard, { key: p.slug, product: p, fragrance: fragranceById[p.fragranceSlug], images: data.images, nav: nav })))),
            React.createElement("div", { style: { marginTop: 30 } },
                React.createElement(Button, { variant: "ghost", onClick: () => nav("catalogue", "all") }, "View the full collection \u2192"))),
        React.createElement("section", { className: "container", style: { padding: "16px 20px 72px" } },
            React.createElement("div", { className: "personalize-grid" },
                React.createElement(ImageOrPlaceholder, { src: "assets/personalisation.jpeg", label: "Personalization options", ratio: "4 / 3" }),
                React.createElement("div", null,
                    React.createElement("p", { style: { ...label, color: C.rust, marginBottom: 14 } }, "Personalization"),
                    React.createElement("h2", { style: { ...serif, fontSize: "clamp(28px,3.6vw,36px)", color: C.ink, fontWeight: 500, marginBottom: 16 } }, "Made for your moment."),
                    React.createElement("p", { style: { ...sans, fontSize: 15, color: C.ink70, lineHeight: 1.75, marginBottom: 24, maxWidth: 450 } }, "Have something specific in mind? Choose your fragrance, shape, label or packaging and let us create something personal for you."),
                    React.createElement(Button, { variant: "ghost", onClick: () => nav("create-ritual") }, "Create Your Ritual \u2192")))),
        React.createElement("section", { style: { background: C.card, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` } },
            React.createElement("div", { className: "container gifting-grid", style: { padding: "72px 20px" } },
                React.createElement("div", null,
                    React.createElement("p", { style: { ...label, color: C.rust, marginBottom: 14 } }, "Gifting"),
                    React.createElement("h2", { style: { ...serif, fontSize: "clamp(28px,3.6vw,36px)", color: C.ink, fontWeight: 500, marginBottom: 16 } }, "Gifts that feel personal."),
                    React.createElement("p", { style: { ...sans, fontSize: 15, color: C.ink70, lineHeight: 1.75, maxWidth: 450, marginBottom: 22 } }, "Thoughtful pieces for festivals, birthdays, weddings, housewarmings, return gifts and moments that deserve a little more thought."),
                    React.createElement("div", { className: "gifting-list gifting-recommendations" },
                        React.createElement("button", { onClick: () => nav("catalogue", "occasion", { value: "festivals-celebrations" }) },
                            React.createElement("strong", null, "Festivals"),
                            React.createElement("span", null, "Dhoop & Chandan \u00B7 Madhuban")),
                        React.createElement("button", { onClick: () => nav("catalogue", "occasion", { value: "weddings-return-gifts" }) },
                            React.createElement("strong", null, "Weddings"),
                            React.createElement("span", null, "Gajre Ka Shringar \u00B7 Gulab Ki Chitthi")),
                        React.createElement("button", { onClick: () => nav("catalogue", "occasion", { value: "birthdays-just-because" }) },
                            React.createElement("strong", null, "Birthdays & Just Because"),
                            React.createElement("span", null, "Raat Ki Rani \u00B7 Saanjh"))),
                    React.createElement(Button, { variant: "link", onClick: () => nav("catalogue", "category", { value: "gift-hampers" }), style: { marginTop: 26, color: C.rust, fontWeight: 600, letterSpacing: "0.11em", textTransform: "uppercase", textDecoration: "underline", textUnderlineOffset: "4px" } }, "Explore Gifting \u2192")),
                React.createElement(ImageOrPlaceholder, { src: (_d = (_c = data.images) === null || _c === void 0 ? void 0 : _c.site) === null || _d === void 0 ? void 0 : _d.gifting, label: "Hand-packed Mysaa Rituals gift hamper", ratio: "4 / 3" }))),
        React.createElement("section", { className: "container", style: { padding: "72px 20px" } },
            React.createElement("div", { className: "story-block" },
                React.createElement(SectionHeading, { eyebrow: "Our Story", title: "More than a candle." }),
                React.createElement("div", { className: "home-story-copy" },
                    React.createElement("p", null, "Mysaa Rituals was created around a simple idea \u2014 that fragrance has the power to turn ordinary moments into memories."),
                    React.createElement("p", null, "Every piece is handcrafted with care, inspired by familiar Indian aromas and designed to become part of someone's ritual.")),
                React.createElement("div", { style: { marginTop: 26 } },
                    React.createElement(Button, { variant: "ghost", onClick: () => nav("about") }, "Read Our Story \u2192")),
                React.createElement("div", { style: { marginTop: 32 } },
                    React.createElement(ImageOrPlaceholder, { src: (_f = (_e = data.images) === null || _e === void 0 ? void 0 : _e.site) === null || _f === void 0 ? void 0 : _f.story, label: "Our Story", ratio: "16 / 9" })))),
        React.createElement("section", { style: { borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` } },
            React.createElement("div", { className: "container", style: { padding: "72px 20px" } },
                React.createElement(SectionHeading, { eyebrow: "Why Mysaa Rituals", title: "Slow, deliberate, personal." }),
                React.createElement("div", { style: { marginTop: 34 } },
                    React.createElement(WhyGrid, null)))),
        React.createElement("section", { className: "container", style: { padding: "72px 20px" } },
            React.createElement(HowToOrder, { steps: [
                    { title: "Choose", body: "Pick your fragrance, format or gift." },
                    { title: "Enquire", body: "Send us your order through the cart by email." },
                    { title: "Personalize", body: "Share quantity, occasion and preferences." },
                    { title: "Confirm", body: "We confirm availability, final price and delivery details." },
                ], title: "Simple, personal, unhurried." })),
        React.createElement("section", { style: { background: C.ink, color: "#fff" } },
            React.createElement("div", { className: "container", style: { padding: "64px 20px", textAlign: "center" } },
                React.createElement("p", { style: { ...label, color: "#D8CFC3", marginBottom: 12 } }, "Mysaa Rituals"),
                React.createElement("h2", { style: { ...serif, fontSize: "clamp(26px,3.4vw,34px)", fontWeight: 500, marginBottom: 12 } }, "Have something special in mind?"),
                React.createElement("p", { style: { ...sans, fontSize: 14, color: "#D8CFC3", maxWidth: 460, margin: "0 auto 24px", lineHeight: 1.7 } }, "Tell us what you're looking for and we'll help you create the right ritual."),
                React.createElement("div", { style: { display: "flex", justifyContent: "center", gap: 22, flexWrap: "wrap" } },
                    React.createElement("a", { href: `mailto:${settings.email}`, style: { ...label, color: "#fff", textDecoration: "underline", textUnderlineOffset: "4px" } }, "Order by Email"),
                    React.createElement("a", { href: settings.instagram, target: "_blank", rel: "noreferrer", style: { ...label, color: "#fff", textDecoration: "underline", textUnderlineOffset: "4px" } }, "Follow @mysaarituals"))))));
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
            if (!p.active)
                return false;
            if (category !== "all" && p.categorySlug !== category)
                return false;
            if (fragrance !== "all" && p.fragranceSlug !== fragrance)
                return false;
            if (feeling !== "all") {
                const group = FEELING_FILTERS.find((item) => item.slug === feeling);
                if (!group || !group.fragrances.includes(p.fragranceSlug))
                    return false;
            }
            if (occasion !== "all") {
                const group = OCCASION_FILTERS.find((item) => item.slug === occasion);
                const assigned = Array.isArray(p.occasionSlugs) ? p.occasionSlugs : [];
                if (!group || !assigned.includes(occasion))
                    return false;
            }
            if ((p.price || 0) > priceCap)
                return false;
            if (search) {
                const q = search.toLowerCase();
                if (!p.name.toLowerCase().includes(q) && !(p.shortDescription || "").toLowerCase().includes(q))
                    return false;
            }
            return true;
        });
    }, [data.products, category, fragrance, feeling, occasion, search, priceCap]);
    const filtersActive = category !== "all" || fragrance !== "all" || feeling !== "all" || occasion !== "all" || !!search || priceCap < maxPrice;
    const resetFilters = () => { setCategory("all"); setFragrance("all"); setFeeling("all"); setOccasion("all"); setSearch(""); setPriceCap(maxPrice); };
    return (React.createElement("div", { className: "container", style: { padding: "48px 20px 80px" } },
        React.createElement(SectionHeading, { eyebrow: "Catalogue", title: "The Collection", sub: "Explore fragrances, candles and gifts made for everyday rituals and meaningful moments." }),
        React.createElement("div", { className: "catalogue-layout", style: { marginTop: 36 } },
            React.createElement("aside", null,
                React.createElement("div", { style: { marginBottom: 32 } },
                    React.createElement("p", { style: { ...label, color: C.ink70, marginBottom: 10 } }, "Search"),
                    React.createElement("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search by product, fragrance or feeling\u2026", style: { ...sans, fontSize: 14, padding: "12px 16px", width: "100%", border: `1px solid ${C.line}`, background: "#FCFAF7" } })),
                React.createElement("div", { style: { marginBottom: 32 } },
                    React.createElement("p", { style: { ...label, color: C.ink70, marginBottom: 12 } }, priceCap >= maxPrice ? "Up to any price" : `Up to ${inr(priceCap)}`),
                    React.createElement("input", { type: "range", min: 0, max: maxPrice, step: 50, value: priceCap, onChange: (e) => setPriceCap(Number(e.target.value)), className: "price-range" })),
                React.createElement("div", { style: { marginBottom: 32 } },
                    React.createElement("p", { style: { ...label, color: C.ink70, marginBottom: 10 } }, "Shop by Category"),
                    React.createElement("div", { className: "chip-wrap" },
                        React.createElement(FilterChip, { active: category === "all", onClick: () => setCategory("all") }, "All"),
                        data.categories.filter((c) => c.active).map((c) => (React.createElement(FilterChip, { key: c.slug, active: category === c.slug, onClick: () => setCategory(c.slug) }, c.name))))),
                React.createElement("div", { style: { marginBottom: 32 } },
                    React.createElement("p", { style: { ...label, color: C.ink70, marginBottom: 10 } }, "Shop by Fragrance"),
                    React.createElement("div", { className: "chip-wrap" },
                        React.createElement(FilterChip, { active: fragrance === "all", onClick: () => setFragrance("all") }, "All"),
                        data.fragrances.filter((f) => f.active).map((f) => (React.createElement(FilterChip, { key: f.slug, active: fragrance === f.slug, onClick: () => setFragrance(f.slug) }, f.name))))),
                React.createElement("div", { style: { marginBottom: 24 } },
                    React.createElement("label", { style: { ...label, color: C.ink70, display: "block", marginBottom: 10 } }, "Shop by Feeling"),
                    React.createElement("select", { value: feeling, onChange: (e) => setFeeling(e.target.value), className: "catalogue-select" },
                        React.createElement("option", { value: "all" }, "All feelings"),
                        FEELING_FILTERS.map((group) => React.createElement("option", { key: group.slug, value: group.slug }, group.title)))),
                React.createElement("div", { style: { marginBottom: 32 } },
                    React.createElement("label", { style: { ...label, color: C.ink70, display: "block", marginBottom: 10 } }, "Shop by Occasion"),
                    React.createElement("select", { value: occasion, onChange: (e) => setOccasion(e.target.value), className: "catalogue-select" },
                        React.createElement("option", { value: "all" }, "All occasions"),
                        OCCASION_FILTERS.map((group) => React.createElement("option", { key: group.slug, value: group.slug }, group.title)))),
                filtersActive && (React.createElement("button", { onClick: resetFilters, style: { ...label, color: C.rust, textAlign: "left", textDecoration: "underline", textUnderlineOffset: "3px" } }, "Clear filters"))),
            React.createElement("div", null, filtered.length === 0 ? (React.createElement("div", { style: { border: `1px solid ${C.line}`, background: C.card, padding: "80px 24px", textAlign: "center" } },
                React.createElement("h3", { style: { ...serif, fontSize: 24, color: C.ink, fontWeight: 500, marginBottom: 14 } }, "Nothing here yet."),
                React.createElement("p", { style: { ...sans, fontSize: 14.5, color: C.ink70, lineHeight: 1.7, maxWidth: 420, margin: "0 auto 22px" } }, "Try a different fragrance or feeling \u2014 or tell us what you're imagining and we'll create it."),
                React.createElement(Button, { variant: "outline", onClick: resetFilters }, "Clear filters"))) : (React.createElement(React.Fragment, null,
                React.createElement("p", { style: { ...sans, fontSize: 13, color: C.ink70, marginBottom: 20 } },
                    filtered.length,
                    " product",
                    filtered.length !== 1 ? "s" : "",
                    " found"),
                React.createElement("div", { className: "product-grid" }, [...filtered].sort((a, b) => Number(isOutOfStock(a)) - Number(isOutOfStock(b))).map((p) => (React.createElement(ProductCard, { key: p.slug, product: p, fragrance: fragranceById[p.fragranceSlug], images: data.images, nav: nav }))))))))));
}
function ProductGallery({ product, images }) {
    const gallery = (images && images.products && images.products[`${product.fragranceSlug}/${product.categorySlug}`]) || [];
    const [activeIndex, setActiveIndex] = useState(0);
    const total = gallery.length;
    useEffect(() => {
        setActiveIndex(0);
    }, [product.slug]);
    const move = (direction) => {
        if (total < 2)
            return;
        setActiveIndex((current) => (current + direction + total) % total);
    };
    return (React.createElement("div", { className: "product-gallery" },
        React.createElement("div", { className: "product-gallery-main" },
            React.createElement("div", { className: "product-gallery-main-frame" },
                React.createElement(ImageOrPlaceholder, { src: gallery[activeIndex], label: product.name, ratio: "4 / 5" }),
                total > 1 && (React.createElement(React.Fragment, null,
                    React.createElement("button", { className: "gallery-arrow gallery-arrow-left", onClick: () => move(-1), "aria-label": "Previous product image" }, "\u2039"),
                    React.createElement("button", { className: "gallery-arrow gallery-arrow-right", onClick: () => move(1), "aria-label": "Next product image" }, "\u203A"),
                    React.createElement("div", { className: "gallery-counter" },
                        activeIndex + 1,
                        " / ",
                        total))))),
        total > 1 && (React.createElement("div", { className: "product-gallery-thumbs", "aria-label": "Product photographs" }, gallery.map((src, index) => (React.createElement("button", { key: src, className: `gallery-thumb${index === activeIndex ? " active" : ""}`, onClick: () => setActiveIndex(index), "aria-label": `View product image ${index + 1}`, "aria-current": index === activeIndex ? "true" : undefined },
            React.createElement("img", { src: src, alt: `${product.name} photograph ${index + 1}` }))))))));
}
function MoldShapeVisual({ shape }) {
    const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" };
    const shapes = {
        Daisy: React.createElement(React.Fragment, null,
            React.createElement("circle", { cx: "50", cy: "50", r: "10", ...common }),
            Array.from({ length: 8 }).map((_, i) => { const a = i * Math.PI / 4; return React.createElement("ellipse", { key: i, cx: 50 + 28 * Math.cos(a), cy: 50 + 28 * Math.sin(a), rx: "9", ry: "16", transform: `rotate(${i * 45} ${50 + 28 * Math.cos(a)} ${50 + 28 * Math.sin(a)})`, ...common }); })),
        Rose: React.createElement("path", { d: "M50 78c-20-2-30-15-26-29 3-10 13-17 25-17 11 0 22 6 25 16 5 15-7 29-24 30ZM35 50c9-8 23-8 31 0M39 42c7-6 16-6 22 0M44 35c4-3 8-3 12 0", ...common }),
        Carnation: React.createElement("path", { d: "M30 55c5-14 14-22 20-18 6-4 15 4 20 18 2 8-1 17-8 22H38c-7-5-10-14-8-22Zm6-8c5 4 10 4 14 0 5 4 10 4 14 0M38 58c8 5 16 5 24 0M41 67c6 3 12 3 18 0", ...common }),
        Cactus: React.createElement("path", { d: "M42 78V39c0-9 6-15 12-15s12 6 12 15v8h6v-8c0-4 3-7 7-7s7 3 7 7v12c0 9-7 16-16 16h-4v11H42ZM42 52H34c-5 0-9-4-9-9V35c0-4 3-7 7-7s7 3 7 7v6h3", ...common }),
        Tortoise: React.createElement("path", { d: "M24 58c4-16 17-25 31-25s27 9 31 25c-5 12-17 19-31 19S29 70 24 58Zm8-2c8 8 16 12 23 12 8 0 16-4 23-12M50 34v38M33 48c12 6 24 6 34 0M31 72l-8 5M69 72l8 5M26 55l-8-4M74 55l8-4", ...common }),
        Laddu: React.createElement("circle", { cx: "50", cy: "54", r: "28", ...common }),
        Chakli: React.createElement("path", { d: "M50 79c-18 0-31-10-31-24 0-16 14-28 31-28s31 12 31 28c0 14-13 24-31 24Zm0-8c-12 0-21-6-21-16 0-10 9-18 21-18s21 8 21 18c0 10-9 16-21 16Zm0-8c-6 0-11-3-11-8s5-10 11-10 11 5 11 10-5 8-11 8Z", ...common })
    };
    return React.createElement("svg", { viewBox: "0 0 100 100", className: "mold-shape-visual", "aria-hidden": "true" }, shapes[shape] || shapes.Daisy);
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
    return (React.createElement("div", { className: "container mold-page", style: { padding: "32px 20px 80px" } },
        React.createElement("p", { style: { ...label, color: C.ink70, marginBottom: 24 } },
            React.createElement("button", { onClick: () => nav("catalogue", "all"), style: { ...label, color: C.ink70 } }, "Catalogue"),
            " / ",
            React.createElement("span", { style: { color: C.ink } }, "Mold Candles")),
        React.createElement("div", { className: "mold-page-heading" },
            React.createElement("div", null,
                React.createElement("p", { style: { ...label, color: C.rust, marginBottom: 10 } }, "Custom Candle Studio"),
                React.createElement("h1", { style: { ...serif, color: C.ink, fontSize: "clamp(34px,5vw,52px)", fontWeight: 500, lineHeight: 1.02, marginBottom: 10 } }, "Mold Candles"),
                React.createElement("p", { style: { ...sans, color: C.ink70, fontSize: 14.5, lineHeight: 1.7, maxWidth: 680 } },
                    "Minimum order 6 pieces \u00B7 ",
                    React.createElement("strong", { style: { color: C.ink } }, "\u20B9399 for 6 pieces"),
                    ". Create your own batch by choosing a mould, fragrance and primary colour."))),
        React.createElement("div", { className: "mold-builder-grid" },
            React.createElement("div", { className: "mold-builder" },
                React.createElement("section", { className: "mold-step" },
                    React.createElement("div", { className: "mold-step-heading" },
                        React.createElement("span", null, "1"),
                        React.createElement("h2", null, "Choose your mould")),
                    React.createElement("div", { className: "mold-shape-grid" }, MOLD_CANDLE_SHAPES.map((item) => (React.createElement("button", { key: item, onClick: () => setShape(item), className: `mold-shape-card${shape === item ? " selected" : ""}` },
                        React.createElement("div", { className: "mold-shape-art" },
                            React.createElement("div", { className: "mold-image-placeholder" }, "Add mold image")),
                        React.createElement("span", null, item)))))),
                React.createElement("section", { className: "mold-step" },
                    React.createElement("div", { className: "mold-step-heading" },
                        React.createElement("span", null, "2"),
                        React.createElement("h2", null, "Choose your fragrance")),
                    React.createElement("div", { className: "mold-fragrance-grid" }, data.fragrances.filter((f) => f.active).map((f) => (React.createElement("button", { key: f.slug, onClick: () => setFragranceSlug(f.slug), className: `mold-fragrance-card${fragranceSlug === f.slug ? " selected" : ""}` },
                        React.createElement("strong", null, f.name))))),
                    React.createElement("button", { className: "mold-more-link", onClick: () => nav("catalogue", "fragrance", { value: fragranceSlug }) }, "View fragrance notes \u2192")),
                React.createElement("section", { className: "mold-step" },
                    React.createElement("div", { className: "mold-step-heading" },
                        React.createElement("span", null, "3"),
                        React.createElement("h2", null, "Choose your primary colour")),
                    React.createElement("div", { className: "mold-color-grid" }, MOLD_COLORS.map((c) => (React.createElement("button", { key: c.name, onClick: () => setColor(c.name), className: `mold-color-card${color === c.name ? " selected" : ""}` },
                        React.createElement("span", { className: "mold-color-swatch", style: { background: c.hex } }),
                        React.createElement("span", null, c.name)))))),
                React.createElement("div", { className: "mold-note" },
                    React.createElement("strong", null, "One batch = one mould + one fragrance + one primary colour."),
                    React.createElement("span", null, "Minimum order is 6 pieces. You can increase the quantity after selecting your batch."))),
            React.createElement("aside", { className: "mold-summary" },
                React.createElement("p", { style: { ...label, color: C.ink70, marginBottom: 16 } }, "Your selection"),
                React.createElement("div", { className: "mold-summary-preview" },
                    React.createElement("div", { className: "mold-summary-art", style: { background: colorData.hex } },
                        React.createElement("div", { className: "mold-image-placeholder" }, "Add mold image")),
                    React.createElement("div", null,
                        React.createElement("strong", null, shape),
                        React.createElement("span", null, fragrance ? fragrance.name : ""),
                        React.createElement("span", null, color))),
                React.createElement("div", { className: "mold-summary-line" },
                    React.createElement("span", null, "Quantity"),
                    React.createElement("div", { className: "mold-quantity" },
                        React.createElement("button", { onClick: () => setQty((q) => Math.max(MOLD_CANDLE_MOQ, q - 1)) }, "\u2212"),
                        React.createElement("strong", null, qty),
                        React.createElement("button", { onClick: () => setQty((q) => q + 1) }, "+"))),
                React.createElement("div", { className: "mold-summary-price" },
                    React.createElement("span", null, "Current batch price"),
                    React.createElement("strong", null, inr(subtotal)),
                    React.createElement("small", null, "Batch basis: \u20B9399 for the minimum 6 pieces")),
                React.createElement("div", { className: "mold-moq-note" },
                    "Minimum order: ",
                    MOLD_CANDLE_MOQ,
                    " pieces. Your selected mould, fragrance and colour will be made as one batch."),
                React.createElement("div", { className: "mold-gift-wrap" },
                    React.createElement("label", null,
                        React.createElement("input", { type: "checkbox", checked: giftWrap, onChange: (e) => setGiftWrap(e.target.checked) }),
                        React.createElement("span", null,
                            React.createElement("strong", null, "Gift wrapping"),
                            React.createElement("small", null,
                                "+",
                                inr(giftWrapCharge))))),
                React.createElement("button", { className: "mold-create-button", onClick: addMoldToCart },
                    "Add batch to cart ",
                    React.createElement("span", null, "\u2192")),
                React.createElement("button", { className: "mold-enquiry-button", onClick: addMoldToCart }, "Add to cart")))));
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
        return (React.createElement("div", { className: "container", style: { padding: "80px 20px", textAlign: "center" } },
            React.createElement("p", { style: { ...sans, color: C.ink70, marginBottom: 20 } }, "We couldn't find that product."),
            React.createElement(Button, { onClick: () => nav("catalogue", "all") }, "Back to Catalogue")));
    }
    if (isMoldForState) {
        return React.createElement(MoldCandleProductPage, { data: data, nav: nav, product: product, settings: settings });
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
    const minQty = isMold ? MOLD_CANDLE_MOQ : 1;
    const unitPrice = Number(product.price || 0);
    const subtotal = unitPrice * qty;
    const giftWrapTotal = giftWrap ? giftWrapCharge : 0;
    const totalPrice = subtotal + giftWrapTotal;
    const addCurrentProductToCart = () => {
        if (isOutOfStock(product))
            return;
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
        ["Burn Time", product.burnTime],
        ["Collection", category ? category.name : ""],
    ].filter(([, v]) => v);
    const candleCareSteps = [
        { title: "Trim the wick", body: "Trim the wick to 5 mm before every burn." },
        { title: "Let the first burn reach a full melt pool", body: "For the first burn, allow 2–3 hours so the wax melts evenly across the surface." },
        { title: "Keep the flame calm", body: "Keep the candle away from drafts and direct sunlight." },
        { title: "Know when to stop", body: "Stop burning when about 1 cm of wax remains at the base." },
        { title: "Never leave it unattended", body: "Always extinguish the candle before leaving the room or going to sleep." },
    ];
    return (React.createElement("div", { className: "container product-detail-page", style: { padding: "32px 20px 80px" } },
        React.createElement("p", { style: { ...label, color: C.ink70, marginBottom: 28 } },
            React.createElement("button", { onClick: () => nav("catalogue", "all"), style: { ...label, color: C.ink70 } }, "Catalogue"),
            " / ",
            React.createElement("button", { onClick: () => nav("catalogue", "category", { value: product.categorySlug }), style: { ...label, color: C.ink70 } }, category ? category.name : ""),
            " / ",
            React.createElement("span", { style: { color: C.ink } }, product.name)),
        React.createElement("div", { className: "product-detail-grid" },
            React.createElement(ProductGallery, { product: product, images: data.images }),
            React.createElement("div", { className: "product-detail-content" },
                React.createElement("h1", { style: { ...serif, fontSize: "clamp(26px,4vw,36px)", color: C.ink, fontWeight: 500, marginBottom: 14 } }, product.name),
                React.createElement("div", { className: "product-detail-price", style: { marginBottom: 6 } },
                    React.createElement(DiscountedPrice, { product: product, currentPrice: unitPrice, large: true })),
                isMold && (React.createElement("p", { style: { ...sans, fontSize: 12.5, color: C.ink70, marginBottom: 16 } },
                    "Minimum order ",
                    MOLD_CANDLE_MOQ,
                    " pieces \u00B7 price shared on enquiry")),
                React.createElement("p", { className: "product-detail-description" }, product.description || product.shortDescription),
                isMold && (React.createElement("div", { style: { marginBottom: 28 } },
                    React.createElement("p", { style: { ...label, color: C.ink70, marginBottom: 10 } }, "Choose Your Mould"),
                    React.createElement("div", { className: "option-grid" }, MOLD_CANDLE_SHAPES.map((shape) => (React.createElement("button", { key: shape, onClick: () => setMoldShape(shape), className: `selection-card${moldShape === shape ? " selected" : ""}` },
                        React.createElement("span", { style: { ...sans, fontSize: 13.5, color: C.ink, fontWeight: 500 } }, shape))))),
                    React.createElement("p", { style: { ...sans, fontSize: 12.5, color: C.rust, lineHeight: 1.6, marginTop: 10 } },
                        "Minimum order: ",
                        MOLD_CANDLE_MOQ,
                        " pieces. Select one mould style for your batch."))),
                fragrance && (React.createElement("div", { style: { marginBottom: 24 } },
                    React.createElement("p", { style: { ...label, color: C.ink70, marginBottom: 10 } }, "Variant"),
                    React.createElement("span", { style: { ...sans, fontSize: 13, padding: "9px 16px", border: `1px solid ${C.ink}`, display: "inline-block" } }, fragrance.name))),
                hasPackagingOptions && (React.createElement("div", { className: "standard-packaging-note" },
                    React.createElement("span", null, "Standard Packaging \u00B7 Included"),
                    React.createElement("small", null, packagingChoice.description),
                    React.createElement("em", null, "Premium packaging is coming soon."))),
                giftWrapAvailable && (React.createElement("div", { style: { marginBottom: 28, padding: "16px", border: `1px solid ${C.line}`, background: C.card } },
                    React.createElement("label", { style: { display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" } },
                        React.createElement("input", { type: "checkbox", checked: giftWrap, onChange: (e) => setGiftWrap(e.target.checked), style: { marginTop: 3, accentColor: C.rust } }),
                        React.createElement("span", null,
                            React.createElement("strong", { style: { ...serif, fontSize: 18, fontWeight: 500, color: C.ink } }, "Gift wrapping"),
                            React.createElement("span", { style: { ...sans, display: "block", fontSize: 13.5, color: C.ink70, lineHeight: 1.6, marginTop: 4 } },
                                "Add gift wrapping for someone special \u00B7 +",
                                inr(giftWrapCharge)))))),
                React.createElement("div", { style: { marginBottom: 28 } },
                    React.createElement("p", { style: { ...label, color: C.ink70, marginBottom: 10 } }, "Quantity"),
                    React.createElement("div", { style: { display: "inline-flex", alignItems: "center", border: `1px solid ${C.line}` } },
                        React.createElement("button", { onClick: () => setQty((q) => Math.max(minQty, q - 1)), style: { ...sans, fontSize: 16, padding: "10px 16px", color: C.ink }, "aria-label": "Decrease quantity" }, "\u2212"),
                        React.createElement("span", { style: { ...sans, fontSize: 14, padding: "0 16px", minWidth: 28, textAlign: "center" } }, qty),
                        React.createElement("button", { onClick: () => setQty((q) => q + 1), style: { ...sans, fontSize: 16, padding: "10px 16px", color: C.ink }, "aria-label": "Increase quantity" }, "+"))),
                isOutOfStock(product) ? (React.createElement("button", { className: "out-of-stock-button", disabled: true }, "Out of Stock")) : (React.createElement(Button, { onClick: addCurrentProductToCart, variant: "solid", style: { width: "100%", justifyContent: "center" } }, "Add to Cart")),
                product.customizable && (React.createElement("button", { onClick: () => nav("create-ritual"), style: { ...label, color: C.rust, marginTop: 18, display: "block", textDecoration: "underline", textUnderlineOffset: "3px" } }, "Want this customized instead? \u2192")),
                React.createElement("div", { className: "product-information-inline" },
                    React.createElement("h2", { style: { ...serif, fontSize: 21, color: C.ink, fontWeight: 500, marginBottom: 14 } }, "Product Information"),
                    React.createElement("div", null, infoRows.map(([k, v]) => (React.createElement("div", { key: k, className: "product-information-row" },
                        React.createElement("span", { style: { ...label, color: C.ink70 } }, k),
                        React.createElement("span", { style: { ...sans, fontSize: 13.5, color: C.ink, textAlign: "right" } }, v)))))),
                isDiscoverySet && (React.createElement("div", { className: "hairline-top", style: { marginTop: 32 } },
                    React.createElement("h2", { style: { ...serif, fontSize: 20, color: C.ink, fontWeight: 500, marginBottom: 12 } }, "What's Inside the Discovery Set"),
                    React.createElement("p", { style: { ...sans, fontSize: 14.5, color: C.ink70, lineHeight: 1.75, marginBottom: 14 } }, "Six 60 ml Mini Ritual candles, one in each Mysaa Rituals fragrance, so you can experience the full collection and discover the scent that feels most personal to you."),
                    React.createElement("div", { className: "discovery-fragrance-list" }, DISCOVERY_SET_FRAGRANCES.map((slug, index) => {
                        const f = data.fragrances.find((item) => item.slug === slug);
                        return f ? (React.createElement("div", { key: slug, className: "discovery-fragrance-item" },
                            React.createElement("span", { style: { ...label, color: C.rust } }, String(index + 1).padStart(2, "0")),
                            React.createElement("span", { style: { ...serif, fontSize: 17, color: C.ink } }, f.name))) : null;
                    })))))),
        React.createElement("div", { style: { marginTop: 64 } },
            React.createElement(HowToOrder, { steps: HOW_TO_ORDER_PRODUCT })),
        React.createElement("div", { className: "candle-care-section", style: { marginTop: 64 } },
            React.createElement(SectionHeading, { eyebrow: "Candle Care", title: "A little care goes a long way.", sub: "Simple habits help your Mysaa Rituals candle burn cleanly, evenly and beautifully." }),
            React.createElement("div", { className: "steps-grid candle-care-steps", style: { marginTop: 32 } }, candleCareSteps.map((step, i) => (React.createElement("div", { key: step.title, className: "hairline-top candle-care-step" },
                React.createElement("p", { style: { ...label, color: C.rust, marginBottom: 14 } }, String(i + 1).padStart(2, "0")),
                React.createElement("h4", { style: { ...serif, fontSize: 18, color: C.ink, fontWeight: 500, marginBottom: 8 } }, step.title),
                React.createElement("p", { style: { ...sans, fontSize: 13.5, color: C.ink70, lineHeight: 1.65 } }, step.body)))))),
        related.length > 0 && (React.createElement("div", { style: { marginTop: 64 } },
            React.createElement("h2", { style: { ...serif, fontSize: 22, color: C.ink, fontWeight: 500, marginBottom: 24 } }, "You May Also Like"),
            React.createElement("div", { className: "product-grid" }, [...related].sort((a, b) => Number(isOutOfStock(a)) - Number(isOutOfStock(b))).map((p) => (React.createElement(ProductCard, { key: p.slug, product: p, fragrance: data.fragrances.find((f) => f.slug === p.fragranceSlug), images: data.images, nav: nav }))))))));
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
    return (React.createElement("div", { className: "container", style: { padding: "48px 20px 80px", maxWidth: 680 } },
        React.createElement(SectionHeading, { eyebrow: "Made Just For You", title: "Create Your Own Ritual", sub: "Tell us a little about what you're looking for, and send your custom request to us by email." }),
        React.createElement("div", { style: { marginTop: 36, display: "grid", gap: 18 } },
            React.createElement(Field, { label: "Your name", value: form.name, onChange: set("name") }),
            React.createElement(SelectField, { label: "Preferred fragrance or mood", value: form.fragrance, onChange: set("fragrance"), placeholder: "Help me choose", options: (data.fragrances || []).filter((f) => f.active !== false).map((f) => f.name) }),
            React.createElement(SelectField, { label: "Format", value: form.format, onChange: set("format"), placeholder: "Not sure", options: (data.categories || []).filter((c) => c.active !== false).map((c) => c.name) }),
            React.createElement(SelectField, { label: "Occasion", value: form.occasion, onChange: set("occasion"), placeholder: "Not sure yet", options: ["Birthday", "Anniversary", "Wedding / Wedding Favour", "Festival", "Housewarming", "Corporate / Gifting", "Other"] }),
            React.createElement(FieldArea, { label: "Anything else we should know?", value: form.notes, onChange: set("notes") }),
            React.createElement(Button, { href: `mailto:${settings.email}?subject=${encodeURIComponent("Mysaa Rituals — Custom Ritual Request")}&body=${encodeURIComponent(message)}`, style: { marginTop: 8, width: "fit-content" } }, "Send via Email"))));
}
function Field({ label: text, ...props }) {
    return (React.createElement("label", { style: { display: "block" } },
        React.createElement("span", { style: { ...label, color: C.ink70, display: "block", marginBottom: 8 } }, text),
        React.createElement("input", { ...props, style: { ...sans, width: "100%", fontSize: 14, padding: "12px 14px", border: `1px solid ${C.line}`, background: "#FCFAF7" } })));
}
function SelectField({ label: text, options = [], placeholder = "Select", ...props }) {
    return (React.createElement("label", { style: { display: "block" } },
        React.createElement("span", { style: { ...label, color: C.ink70, display: "block", marginBottom: 8 } }, text),
        React.createElement("select", { ...props, style: { ...sans, width: "100%", fontSize: 14, padding: "12px 14px", border: `1px solid ${C.line}`, background: "#FCFAF7", color: props.value ? C.ink : C.ink70, appearance: "auto" } },
            React.createElement("option", { value: "" }, placeholder),
            options.map((option) => React.createElement("option", { key: option, value: option }, option)))));
}
function FieldArea({ label: text, ...props }) {
    return (React.createElement("label", { style: { display: "block" } },
        React.createElement("span", { style: { ...label, color: C.ink70, display: "block", marginBottom: 8 } }, text),
        React.createElement("textarea", { ...props, rows: 4, style: { ...sans, width: "100%", fontSize: 14, padding: "12px 14px", border: `1px solid ${C.line}`, background: "#FCFAF7", resize: "vertical" } })));
}
function AboutPage({ data }) {
    var _a, _b;
    return (React.createElement("div", { className: "container about-page", style: { padding: "48px 20px 80px", maxWidth: 820 } },
        React.createElement("div", { className: "about-section about-intro" },
            React.createElement(SectionHeading, { eyebrow: "Our Story", title: "More than a candle." }),
            React.createElement("div", { className: "about-copy" },
                React.createElement("p", null, "Mysaa Rituals was created around a simple idea \u2014 that fragrance has the power to turn ordinary moments into memories. The smell of dhoop in a childhood home, jasmine gajras on a festival morning, roses pressed into an old letter \u2014 these are the moments we try to bottle into every candle, melt and sachet we make."),
                React.createElement("p", null, "Every piece is handcrafted with care, inspired by familiar Indian aromas, and designed to become part of someone's ritual \u2014 poured in small batches using a natural soy wax blend and cotton or wooden wicks."),
                React.createElement("p", null, "If nothing in the catalogue feels quite right, that's exactly what Custom Rituals are for. Tell us about your moment, and we'll create something made only for it.")),
            React.createElement("div", { style: { marginTop: 32 } },
                React.createElement(ImageOrPlaceholder, { src: "./assets/story.jpg", label: "Studio / process photograph", ratio: "16 / 9" }))),
        React.createElement("div", { className: "about-section" },
            React.createElement(SectionHeading, { eyebrow: "Why Mysaa Rituals", title: "Slow, deliberate, personal." }),
            React.createElement("div", { style: { marginTop: 32 } },
                React.createElement(WhyGrid, null))),
        React.createElement("div", { className: "about-section process-section" },
            React.createElement("div", { className: "process-layout" },
                React.createElement("div", null,
                    React.createElement(SectionHeading, { eyebrow: "Our Process", title: React.createElement(React.Fragment, null,
                            "Thoughtfully made,",
                            React.createElement("br", null),
                            "from start to finish.") }),
                    React.createElement("div", { className: "process-steps" }, [
                        ["01", "Curate familiar Indian fragrances."],
                        ["02", "Blend with a natural soy wax mix."],
                        ["03", "Hand-pour in small batches."],
                        ["04", "Finish and package with care."],
                    ].map(([num, text]) => (React.createElement("div", { className: "process-step", key: num },
                        React.createElement("span", { className: "process-number" }, num),
                        React.createElement("span", null, text)))))),
                React.createElement(ImageOrPlaceholder, { src: ((_b = (_a = data.images) === null || _a === void 0 ? void 0 : _a.site) === null || _b === void 0 ? void 0 : _b.about2) || "./assets/about 2.jpeg", label: "Mysaa Rituals making process", ratio: "4 / 3" }))),
        React.createElement("div", { className: "about-section" },
            React.createElement(SectionHeading, { eyebrow: "Candle Care", title: "A little care goes a long way." }),
            React.createElement("ul", { style: { marginTop: 20, paddingLeft: 20, ...sans, fontSize: 14.5, color: C.ink70, lineHeight: 1.9 } },
                React.createElement("li", null, "Trim the wick to 5mm before every burn."),
                React.createElement("li", null, "Let the wax pool reach the edge of the jar on the first burn \u2014 this prevents tunnelling."),
                React.createElement("li", null, "Burn for no more than 3\u20134 hours at a stretch."),
                React.createElement("li", null, "Keep away from drafts, and out of reach of children and pets.")))));
}
function ContactPage({ settings }) {
    const feedbackReady = !!(settings.feedbackUrl || settings.feedbackQr);
    const connectQr = settings.connectQr || "./assets/connect-qr.jpeg";
    return (React.createElement("div", { className: "contact-page" },
        React.createElement("section", { className: "contact-hero" },
            React.createElement("div", { className: "contact-hero-copy" },
                React.createElement("p", { style: { ...label, color: C.rust, marginBottom: 12 } }, "We'd Love To Hear From You"),
                React.createElement("h1", { style: { ...serif, color: C.ink, fontSize: "clamp(44px,6vw,64px)", fontWeight: 500, lineHeight: 1.02, marginBottom: 18 } }, "Get in touch"),
                React.createElement("p", { style: { ...sans, color: C.ink70, fontSize: 17, lineHeight: 1.65, maxWidth: 430, marginBottom: 28 } }, "Have a question, a custom request or just want to say hello? We're always happy to connect."),
                React.createElement("div", { className: "contact-details" },
                    React.createElement(ContactRow, { icon: React.createElement(ChatIcon, { size: 25, color: C.rust }), label: "WhatsApp", value: settings.phone, href: waLink(settings.whatsapp, "Hello Mysaa Rituals!") }),
                    React.createElement(ContactRow, { icon: React.createElement("span", { style: { fontSize: 26, color: C.rust } }, "\u2709"), label: "Email", value: settings.email, href: `mailto:${settings.email}` }),
                    React.createElement(ContactRow, { icon: React.createElement(InstagramIcon, { size: 25, color: C.rust }), label: "Instagram", value: settings.instagramHandle || "@mysaarituals", href: settings.instagram }),
                    settings.address && React.createElement(ContactRow, { icon: React.createElement("span", { style: { fontSize: 25, color: C.rust } }, "\u2316"), label: "Studio", value: settings.address }))),
            React.createElement("div", { className: "contact-hero-image" },
                React.createElement(ImageOrPlaceholder, { src: "./assets/contact.jpg", label: "Mysaa Rituals candle", ratio: "1 / 1" }),
                React.createElement("div", { className: "contact-ritual-caption" },
                    React.createElement("p", { style: { ...serif, fontSize: 20, color: C.ink, lineHeight: 1.05, margin: 0 } },
                        "Carry",
                        React.createElement("br", null),
                        "the ritual",
                        React.createElement("br", null),
                        "with you.")))),
        React.createElement("section", { className: "contact-connect-grid" },
            React.createElement("div", { className: "contact-connect-card" },
                React.createElement("p", { style: { ...label, color: C.rust, marginBottom: 10 } }, "Feedback"),
                React.createElement("h2", { style: { ...serif, color: C.ink, fontSize: "clamp(30px,4vw,40px)", fontWeight: 500, lineHeight: 1.05, marginBottom: 12 } },
                    "Tell us about",
                    React.createElement("br", null),
                    "your Mysaa experience."),
                React.createElement("p", { style: { ...sans, color: C.ink70, fontSize: 15, lineHeight: 1.65, maxWidth: 430 } }, "Your feedback helps us improve our fragrances, products and overall experience."),
                feedbackReady && (React.createElement("div", { className: "qr-action-row" },
                    settings.feedbackQr && React.createElement("img", { className: "contact-qr", src: settings.feedbackQr, alt: "QR code for the Mysaa Rituals feedback form" }),
                    React.createElement("div", null, settings.feedbackUrl && (React.createElement("a", { className: "qr-link", href: settings.feedbackUrl, target: "_blank", rel: "noreferrer" },
                        "Scan to open",
                        React.createElement("br", null),
                        "feedback form ",
                        React.createElement("span", null, "\u2192"))))))),
            React.createElement("div", { className: "contact-connect-card" },
                React.createElement("p", { style: { ...label, color: C.rust, marginBottom: 10 } }, "Stay Connected"),
                React.createElement("h2", { style: { ...serif, color: C.ink, fontSize: "clamp(30px,4vw,40px)", fontWeight: 500, lineHeight: 1.05, marginBottom: 12 } },
                    "Scan to connect",
                    React.createElement("br", null),
                    "with us."),
                React.createElement("p", { style: { ...sans, color: C.ink70, fontSize: 15, lineHeight: 1.65, maxWidth: 430 } }, "Follow Mysaa Rituals and stay close to new drops, offers and little rituals."),
                React.createElement("div", { className: "qr-action-row" },
                    React.createElement("img", { className: "contact-qr", src: connectQr, alt: "Mysaa Rituals connection QR code" }),
                    React.createElement("div", null,
                        React.createElement("a", { className: "qr-link", href: settings.instagram, target: "_blank", rel: "noreferrer" },
                            "Visit @mysaarituals",
                            React.createElement("br", null),
                            "on Instagram ",
                            React.createElement("span", null, "\u2192"))))))));
}
function ContactRow({ icon, label: text, value, href }) {
    const content = (React.createElement("div", { className: "contact-row" },
        React.createElement("div", { className: "contact-row-icon" }, icon),
        React.createElement("div", { className: "contact-row-copy" },
            React.createElement("span", null, text),
            React.createElement("strong", null, value))));
    return href ? React.createElement("a", { href: href, target: "_blank", rel: "noreferrer" }, content) : content;
}
function WelcomePopup() {
    const [open, setOpen] = useState(false);
    useEffect(() => {
        try {
            if (!window.localStorage.getItem("mysaa-welcome-seen-v2"))
                setOpen(true);
        }
        catch (_) {
            setOpen(true);
        }
    }, []);
    const close = () => {
        try {
            window.localStorage.setItem("mysaa-welcome-seen-v2", "1");
        }
        catch (_) { }
        setOpen(false);
    };
    if (!open)
        return null;
    return (React.createElement("div", { className: "welcome-overlay", role: "dialog", "aria-modal": "true", "aria-labelledby": "welcome-title" },
        React.createElement("div", { className: "welcome-card" },
            React.createElement("button", { className: "welcome-close", onClick: close, "aria-label": "Close welcome message" }, "\u00D7"),
            React.createElement("img", { src: "assets/logo.png", alt: "Mysaa Rituals", className: "welcome-logo" }),
            React.createElement("p", { className: "welcome-eyebrow" }, "A little welcome from Mysaa"),
            React.createElement("h2", { id: "welcome-title" }, "Goodies in every order."),
            React.createElement("p", null, "Every order comes with free goodies, and our launch discount is live. Discover your next little ritual with Mysaa."),
            React.createElement("button", { className: "welcome-cta", onClick: close }, "Start exploring \u2192"))));
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
    return (React.createElement("div", { className: "container cart-page", style: { padding: "48px 20px 80px" } },
        React.createElement(SectionHeading, { eyebrow: "Your Cart", title: "Ready to make it a ritual?", sub: "Review your products, add gift wrapping if you need it, then send the complete order to us by email." }),
        items.length === 0 ? (React.createElement("div", { className: "cart-empty" },
            React.createElement("p", { style: { ...serif, fontSize: 26, color: C.ink, marginBottom: 10 } }, "Your cart is empty."),
            React.createElement("p", { style: { ...sans, fontSize: 14, color: C.ink70, marginBottom: 20 } }, "Choose something from the catalogue and it will appear here."),
            React.createElement(Button, { variant: "solid", onClick: () => nav("catalogue", "all") }, "Explore the Catalogue"))) : (React.createElement("div", { className: "cart-grid" },
            React.createElement("div", { className: "cart-items" },
                items.map((item) => {
                    const lineTotal = Number(item.unitPrice) * Number(item.qty) + (item.giftWrap ? Number(item.giftWrapCharge || GIFT_WRAP_CHARGE) : 0);
                    return (React.createElement("div", { className: "cart-item", key: item.key },
                        React.createElement("div", { className: "cart-item-main" },
                            React.createElement("div", null,
                                React.createElement("h3", null, item.name),
                                item.fragranceName && React.createElement("p", null,
                                    "Fragrance: ",
                                    item.fragranceName),
                                item.details && React.createElement("p", null, item.details),
                                item.giftWrap && React.createElement("p", null,
                                    "Gift wrapping: +",
                                    inr(item.giftWrapCharge || GIFT_WRAP_CHARGE))),
                            React.createElement("strong", null, inr(lineTotal))),
                        React.createElement("div", { className: "cart-item-actions" },
                            React.createElement("div", { className: "cart-qty" },
                                React.createElement("button", { onClick: () => changeQty(item, -1) }, "\u2212"),
                                React.createElement("span", null, item.qty),
                                React.createElement("button", { onClick: () => changeQty(item, 1) }, "+")),
                            React.createElement("button", { className: "cart-remove", onClick: () => remove(item.key) }, "Remove"))));
                }),
                React.createElement("button", { className: "cart-continue", onClick: () => nav("catalogue", "all") }, "\u2190 Continue shopping")),
            React.createElement("aside", { className: "cart-summary" },
                React.createElement("div", { className: "cart-summary-total" },
                    React.createElement("span", null, "Total"),
                    React.createElement("strong", null, inr(total))),
                React.createElement("div", { className: "cart-order-policy" },
                    React.createElement("p", null,
                        React.createElement("strong", null, "Delivery"),
                        React.createElement("span", null, "Estimated delivery time is confirmed with your order.")),
                    React.createElement("p", null,
                        React.createElement("strong", null, "Shipping"),
                        React.createElement("span", null, "Shipping cost is separate and will be shared while confirming payment.")),
                    React.createElement("p", null,
                        React.createElement("strong", null, "Returns"),
                        React.createElement("span", null, "Returns are accepted only if the wrong product or a defective product is received."))),
                React.createElement("p", { className: "cart-email-note" }, "Orders are placed through email only. Your email app will open with the order details already filled in."),
                React.createElement("div", { className: "cart-customer-fields" },
                    React.createElement("label", null,
                        React.createElement("span", null, "Name"),
                        React.createElement("input", { value: customer.name, onChange: setCustomerField("name"), placeholder: "Your name" })),
                    React.createElement("label", null,
                        React.createElement("span", null, "Email"),
                        React.createElement("input", { type: "email", value: customer.email, onChange: setCustomerField("email"), placeholder: "your@email.com" })),
                    React.createElement("label", null,
                        React.createElement("span", null, "Full Address"),
                        React.createElement("textarea", { value: customer.address, onChange: setCustomerField("address"), placeholder: "House / flat, street, area" })),
                    React.createElement("div", { className: "cart-address-row" },
                        React.createElement("label", null,
                            React.createElement("span", null, "City"),
                            React.createElement("input", { value: customer.city, onChange: setCustomerField("city"), placeholder: "City" })),
                        React.createElement("label", null,
                            React.createElement("span", null, "State"),
                            React.createElement("input", { value: customer.state, onChange: setCustomerField("state"), placeholder: "State" }))),
                    React.createElement("div", { className: "cart-address-row" },
                        React.createElement("label", null,
                            React.createElement("span", null, "PIN / Postal Code"),
                            React.createElement("input", { value: customer.pincode, onChange: setCustomerField("pincode"), placeholder: "PIN code" })),
                        React.createElement("label", null,
                            React.createElement("span", null, "Landmark"),
                            React.createElement("input", { value: customer.landmark, onChange: setCustomerField("landmark"), placeholder: "Nearby landmark (optional)" }))),
                    React.createElement("label", null,
                        React.createElement("span", null, "Order notes"),
                        React.createElement("textarea", { value: customer.note, onChange: setCustomerField("note"), placeholder: "Occasion, delivery notes, gifting details\u2026" }))),
                React.createElement("a", { className: "cart-email-button", href: emailHref }, "Send Order by Email \u2192"),
                React.createElement("p", { className: "cart-small-note" },
                    "To: ",
                    settings.email))))));
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
        if (!data || !data.settings)
            return;
        const settings = data.settings;
        const base = "Mysaa Rituals";
        const product = route.page === "product" ? data.products.find((p) => p.slug === route.param) : null;
        const fragrance = product ? data.fragrances.find((f) => f.slug === product.fragranceSlug) : null;
        const category = product ? data.categories.find((c) => c.slug === product.categorySlug) : null;
        const title = product
            ? `${product.name} | ${base}`
            : route.page === "catalogue"
                ? `Handcrafted Candles, Gift Hampers & Fragrance | ${base}`
                : settings.seoTitle || `${base} — Handcrafted Fragrance & Gifting`;
        const description = product
            ? `${product.description || product.shortDescription} ${product.burnTime ? `Burn time: ${product.burnTime}.` : ""} Shop ${product.name} from ${base}.`
            : settings.seoDescription || "Handcrafted soy wax candles, Indian fragrance candles, gift hampers and personalised rituals from Mysaa Rituals.";
        document.title = title;
        let meta = document.querySelector('meta[name="description"]');
        if (!meta) {
            meta = document.createElement("meta");
            meta.name = "description";
            document.head.appendChild(meta);
        }
        meta.setAttribute("content", description.slice(0, 300));
        let keywords = document.querySelector('meta[name="keywords"]');
        if (!keywords) {
            keywords = document.createElement("meta");
            keywords.name = "keywords";
            document.head.appendChild(keywords);
        }
        keywords.setAttribute("content", product
            ? (product.seoKeywords || `${product.name}, ${fragrance ? fragrance.name : ""} candle, handcrafted soy wax candle, Indian fragrance candle, Mysaa Rituals`)
            : (settings.seoKeywords || "handcrafted candles India, soy wax candles India, luxury candles, Indian fragrance candles, gift hampers India, wedding return gifts, festive candles, personalised candles, Mysaa Rituals"));
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement("link");
            canonical.rel = "canonical";
            document.head.appendChild(canonical);
        }
        canonical.href = product
            ? `${window.location.origin}${window.location.pathname}products/${product.slug}/`
            : window.location.href.split("#")[0];
        document.querySelectorAll('script[data-mysaa-seo]').forEach((el) => el.remove());
        if (product) {
            const schema = document.createElement("script");
            schema.type = "application/ld+json";
            schema.dataset.mysaaSeo = "product";
            schema.textContent = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Product",
                "name": product.name,
                "description": product.description || product.shortDescription,
                "brand": { "@type": "Brand", "name": base },
                "category": category ? category.name : "Candles",
                "image": (product.images || []).filter(Boolean).map((src) => new URL(src, window.location.href).href),
                "sku": product.slug,
                "offers": Number(product.price) > 0 ? {
                    "@type": "Offer",
                    "priceCurrency": "INR",
                    "price": Number(product.price),
                    "availability": isOutOfStock(product) ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
                    "url": `${window.location.origin}${window.location.pathname}products/${product.slug}/`
                } : undefined
            });
            document.head.appendChild(schema);
        }
    }, [data, route.page, route.param]);
    if (loading) {
        return (React.createElement("div", { style: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream } },
            React.createElement("p", { style: { ...sans, color: C.ink70 } }, "Loading catalogue\u2026")));
    }
    if (error) {
        return (React.createElement("div", { style: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream, padding: 20, textAlign: "center" } },
            React.createElement("p", { style: { ...sans, color: C.ink70 } },
                "Couldn't load the catalogue data. Make sure this site is served over http(s), not opened directly as a file. (",
                error,
                ")")));
    }
    const { settings } = data;
    let page;
    if (route.page === "home")
        page = React.createElement(HomePage, { data: data, nav: nav, settings: settings });
    else if (route.page === "catalogue")
        page = React.createElement(CataloguePage, { data: data, nav: nav, initialType: route.param, initialQuery: route.query });
    else if (route.page === "product")
        page = React.createElement(ProductDetailPage, { data: data, nav: nav, slug: route.param, settings: settings });
    else if (route.page === "create-ritual")
        page = React.createElement(CreateRitualPage, { settings: settings, data: data });
    else if (route.page === "about")
        page = React.createElement(AboutPage, { data: data });
    else if (route.page === "contact")
        page = React.createElement(ContactPage, { settings: settings });
    else if (route.page === "cart")
        page = React.createElement(CartPage, { nav: nav, settings: settings });
    else
        page = React.createElement(HomePage, { data: data, nav: nav, settings: settings });
    return (React.createElement(React.Fragment, null,
        React.createElement(WelcomePopup, null),
        React.createElement(Header, { nav: nav, settings: settings, route: route }),
        React.createElement("main", { style: { minHeight: "60vh" } }, page),
        React.createElement(Footer, { nav: nav, settings: settings })));
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App, null));
