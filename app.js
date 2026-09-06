"use strict";
/* ============================================================
   MYSAA RITUALS — Digital Catalogue
   Static, single-page React app (no build step; runs on GitHub Pages).
   Product data is fetched from ./data/*.json — the shop owner edits
   data/mysaa_products.xlsx and regenerates the JSON (see scripts/).
   ============================================================ */
const { useState, useEffect, useMemo, useCallback } = React;
const C = {
    ink: "#3A1420",
    ink70: "#6E4A50",
    gold: "#A97A3F",
    goldDeep: "#8C6431",
    maroon: "#7A1420",
    maroonDeep: "#5C0F17",
    cream: "#FBF3E8",
    card: "#F4E8D8",
    line: "#E4D2B8",
};
const serif = { fontFamily: "'Fraunces', serif" };
const sans = { fontFamily: "'Work Sans', sans-serif" };
const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
function waLink(number, message) {
    const clean = (number || "").replace(/[^0-9]/g, "");
    return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
/* ---------- tiny hash router: #/page/param1/param2?query ---------- */
function parseHash() {
    const raw = window.location.hash.replace(/^#\/?/, "");
    const [pathPart, queryPart] = raw.split("?");
    const parts = pathPart.split("/").filter(Boolean);
    const page = parts[0] || "home";
    const param = parts[1] ? decodeURIComponent(parts[1]) : null;
    const query = {};
    if (queryPart) {
        new URLSearchParams(queryPart).forEach((v, k) => (query[k] = v));
    }
    return { page, param, query };
}
function buildHash(page, param, query) {
    let h = `#/${page}`;
    if (param)
        h += `/${encodeURIComponent(param)}`;
    if (query && Object.keys(query).length) {
        h += `?${new URLSearchParams(query).toString()}`;
    }
    return h;
}
/* ---------- data loading ---------- */
function useCatalogueData() {
    const [state, setState] = useState({ loading: true, error: null, data: null });
    useEffect(() => {
        let alive = true;
        async function load() {
            try {
                const files = ["products", "fragrances", "feelings", "occasions", "categories", "settings"];
                const results = await Promise.all(files.map((f) => fetch(`data/${f}.json`).then((r) => {
                    if (!r.ok)
                        throw new Error(`Failed to load ${f}.json`);
                    return r.json();
                })));
                if (!alive)
                    return;
                const [products, fragrances, feelings, occasions, categories, settings] = results;
                setState({
                    loading: false,
                    error: null,
                    data: { products, fragrances, feelings, occasions, categories, settings },
                });
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
function Placeholder({ label = "Product image", ratio = "4 / 5" }) {
    return (React.createElement("div", { style: {
            aspectRatio: ratio, background: C.card, border: `1px dashed ${C.line}`,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        } },
        React.createElement("span", { style: { ...sans, color: C.ink70, fontSize: 13, textAlign: "center" } }, label)));
}
function Button({ children, variant = "solid", onClick, href, target, style: styleOverride }) {
    const base = {
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "13px 26px", fontSize: 14, letterSpacing: "0.02em", transition: "opacity 0.2s",
        ...sans,
    };
    const variants = {
        solid: { background: C.maroon, color: "#fff" },
        outline: { background: "transparent", color: C.ink, border: `1px solid ${C.ink}` },
        gold: { background: C.gold, color: "#fff" },
        ghost: { background: "transparent", color: C.maroon, border: `1px solid ${C.gold}` },
    };
    const Comp = href ? "a" : "button";
    return (React.createElement(Comp, { href: href, target: target, rel: target === "_blank" ? "noreferrer" : undefined, onClick: onClick, style: { ...base, ...variants[variant], ...styleOverride }, onMouseEnter: (e) => (e.currentTarget.style.opacity = "0.85"), onMouseLeave: (e) => (e.currentTarget.style.opacity = "1") }, children));
}
function SectionHeading({ eyebrow, title, sub, align = "left" }) {
    return (React.createElement("div", { style: { maxWidth: 640, margin: align === "center" ? "0 auto" : 0, textAlign: align } },
        eyebrow && React.createElement("p", { style: { ...sans, color: C.gold, fontSize: 14, marginBottom: 8 } }, eyebrow),
        React.createElement("h2", { style: { ...serif, color: C.ink, fontWeight: 500, fontSize: "clamp(26px,4vw,36px)", marginBottom: 12 } }, title),
        sub && React.createElement("p", { style: { ...sans, color: C.ink70, fontSize: 16, lineHeight: 1.7 } }, sub)));
}
function Badge({ children, tone = "ink" }) {
    const colors = {
        ink: { color: C.ink, borderColor: C.line },
        gold: { color: C.goldDeep, borderColor: C.gold },
        maroon: { color: "#fff", borderColor: C.maroon, background: C.maroon },
    };
    return (React.createElement("span", { style: { ...sans, fontSize: 11, padding: "4px 9px", border: "1px solid", background: "#fff", letterSpacing: "0.03em", ...colors[tone] } }, children));
}
function Logo({ size = 42, showWordmark = false }) {
    return (React.createElement("img", { src: "assets/logo.png", alt: "Mysaa Rituals", style: { height: size, width: "auto", objectFit: "contain" } }));
}
/* ============================================================
   Header / Footer
   ============================================================ */
function Header({ nav, settings }) {
    const [open, setOpen] = useState(false);
    const [discoverOpen, setDiscoverOpen] = useState(false);
    const navItems = [
        ["Home", "home", null, null],
        ["Catalogue", "catalogue", "all", null],
        ["Shop by Fragrance", "catalogue", "fragrance", null],
        ["Shop by Feeling", "catalogue", "feeling", null],
        ["Shop by Occasion", "catalogue", "occasion", null],
        ["Custom Rituals", "create-ritual", null, null],
    ];
    return (React.createElement("header", { style: { position: "sticky", top: 0, zIndex: 40, background: "rgba(251,243,232,0.95)", borderBottom: `1px solid ${C.line}`, backdropFilter: "blur(6px)" } },
        React.createElement("div", { className: "container", style: { display: "flex", alignItems: "center", justifyContent: "space-between", height: 76 } },
            React.createElement("button", { onClick: () => nav("home"), "aria-label": "Mysaa Rituals home", style: { display: "flex", alignItems: "center" } },
                React.createElement(Logo, { size: 54 })),
            React.createElement("nav", { style: { display: "flex", alignItems: "center", gap: 28 }, className: "desktop-nav" },
                React.createElement("button", { onClick: () => nav("home"), style: { ...sans, fontSize: 14, color: C.ink } }, "Home"),
                React.createElement("button", { onClick: () => nav("catalogue", "all"), style: { ...sans, fontSize: 14, color: C.ink } }, "Catalogue"),
                React.createElement("div", { style: { position: "relative" }, onMouseEnter: () => setDiscoverOpen(true), onMouseLeave: () => setDiscoverOpen(false) },
                    React.createElement("button", { style: { ...sans, fontSize: 14, color: C.ink } }, "Discover"),
                    discoverOpen && (React.createElement("div", { style: { position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)", width: 220, background: "#fff", border: `1px solid ${C.line}`, boxShadow: "0 8px 24px rgba(58,20,32,0.08)", zIndex: 50 } },
                        [
                            ["Shop by Fragrance", "fragrance"],
                            ["Shop by Feeling", "feeling"],
                            ["Shop by Occasion", "occasion"],
                        ].map(([label, type]) => (React.createElement("button", { key: label, onClick: () => nav("catalogue", type), style: { display: "block", width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 14, color: C.ink, ...sans } }, label))),
                        React.createElement("button", { onClick: () => nav("create-ritual"), style: { display: "block", width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 14, color: C.ink, ...sans, borderTop: `1px solid ${C.line}` } }, "Custom Rituals")))),
                React.createElement("button", { onClick: () => nav("about"), style: { ...sans, fontSize: 14, color: C.ink } }, "About"),
                React.createElement("button", { onClick: () => nav("contact"), style: { ...sans, fontSize: 14, color: C.ink } }, "Contact")),
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
                React.createElement("a", { href: waLink(settings.whatsapp, "Hello Mysaa Rituals, I would like to know more about your products."), target: "_blank", rel: "noreferrer", className: "desktop-nav", style: { ...sans, fontSize: 13, padding: "9px 16px", border: `1px solid ${C.gold}`, color: C.goldDeep } }, "Chat on WhatsApp"),
                React.createElement("button", { className: "mobile-only", onClick: () => setOpen(!open), "aria-label": "Menu", style: { padding: 8 } },
                    React.createElement("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: C.ink, strokeWidth: "1.6" },
                        React.createElement("path", { d: "M3 6h18M3 12h18M3 18h18" }))))),
        open && (React.createElement("div", { className: "mobile-only", style: { padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 2, background: C.cream, borderTop: `1px solid ${C.line}` } },
            navItems.map(([label, page, type]) => (React.createElement("button", { key: label, onClick: () => { nav(page, type); setOpen(false); }, style: { ...sans, textAlign: "left", padding: "12px 4px", fontSize: 15, color: C.ink, borderBottom: `1px solid ${C.line}` } }, label))),
            React.createElement("button", { onClick: () => { nav("about"); setOpen(false); }, style: { ...sans, textAlign: "left", padding: "12px 4px", fontSize: 15, color: C.ink, borderBottom: `1px solid ${C.line}` } }, "About"),
            React.createElement("button", { onClick: () => { nav("contact"); setOpen(false); }, style: { ...sans, textAlign: "left", padding: "12px 4px", fontSize: 15, color: C.ink } }, "Contact"),
            React.createElement("a", { href: waLink(settings.whatsapp, "Hello Mysaa Rituals, I would like to know more about your products."), target: "_blank", rel: "noreferrer", style: { ...sans, marginTop: 12, textAlign: "center", padding: "12px 4px", fontSize: 14, color: "#fff", background: C.maroon } }, "Chat on WhatsApp")))));
}
function Footer({ nav, settings }) {
    return (React.createElement("footer", { style: { background: C.ink, color: C.cream, marginTop: 80 } },
        React.createElement("div", { className: "container", style: { padding: "56px 20px 32px", display: "grid", gap: 40 } },
            React.createElement("div", { className: "footer-grid" },
                React.createElement("div", null,
                    React.createElement("div", { style: { marginBottom: 16, filter: "brightness(0) invert(1)" } },
                        React.createElement(Logo, { size: 48 })),
                    React.createElement("p", { style: { ...sans, color: "#D8C7B8", fontSize: 14, lineHeight: 1.7, maxWidth: 280 } }, settings.tagline || "Every flame remembers.")),
                React.createElement("div", null,
                    React.createElement("h4", { style: { ...serif, fontSize: 15, marginBottom: 14, color: C.gold, fontWeight: 500 } }, "Explore"),
                    React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
                        React.createElement("button", { onClick: () => nav("catalogue", "all"), style: { ...sans, fontSize: 14, color: "#D8C7B8", textAlign: "left" } }, "Catalogue"),
                        React.createElement("button", { onClick: () => nav("catalogue", "fragrance"), style: { ...sans, fontSize: 14, color: "#D8C7B8", textAlign: "left" } }, "Shop by Fragrance"),
                        React.createElement("button", { onClick: () => nav("create-ritual"), style: { ...sans, fontSize: 14, color: "#D8C7B8", textAlign: "left" } }, "Custom Rituals"),
                        React.createElement("button", { onClick: () => nav("about"), style: { ...sans, fontSize: 14, color: "#D8C7B8", textAlign: "left" } }, "About"))),
                React.createElement("div", null,
                    React.createElement("h4", { style: { ...serif, fontSize: 15, marginBottom: 14, color: C.gold, fontWeight: 500 } }, "Get in touch"),
                    React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
                        React.createElement("a", { href: waLink(settings.whatsapp, "Hello Mysaa Rituals!"), target: "_blank", rel: "noreferrer", style: { ...sans, fontSize: 14, color: "#D8C7B8" } }, "WhatsApp"),
                        React.createElement("a", { href: `mailto:${settings.email}`, style: { ...sans, fontSize: 14, color: "#D8C7B8" } }, settings.email),
                        React.createElement("a", { href: settings.instagram, target: "_blank", rel: "noreferrer", style: { ...sans, fontSize: 14, color: "#D8C7B8" } }, settings.instagramHandle || "Instagram")))),
            React.createElement("div", { style: { borderTop: "1px solid rgba(216,199,184,0.2)", paddingTop: 20, ...sans, fontSize: 12, color: "#B8A392", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 } },
                React.createElement("span", null,
                    "\u00A9 ",
                    new Date().getFullYear(),
                    " ",
                    settings.brandName || "Mysaa Rituals",
                    ". Handmade with care."),
                React.createElement("span", null, "Handmade \u00B7 Homegrown \u00B7 Heartfelt")))));
}
function WhatsAppFloat({ settings }) {
    return (React.createElement("a", { href: waLink(settings.whatsapp, "Hello Mysaa Rituals, I would like to know more about your products."), target: "_blank", rel: "noreferrer", "aria-label": "Chat on WhatsApp", style: {
            position: "fixed", bottom: 22, right: 22, zIndex: 50, width: 54, height: 54, borderRadius: "50%",
            background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
        } },
        React.createElement("svg", { width: "26", height: "26", viewBox: "0 0 24 24", fill: "#fff" },
            React.createElement("path", { d: "M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 1.67c2.24 0 4.34.87 5.93 2.46a8.23 8.23 0 0 1 2.42 5.85c0 4.56-3.71 8.27-8.35 8.27a8.3 8.3 0 0 1-4.21-1.15l-.3-.18-3.14.82.84-3.06-.2-.32a8.2 8.2 0 0 1-1.26-4.38c0-4.56 3.71-8.31 8.27-8.31M8.53 6.7c-.16 0-.43.06-.65.31-.22.24-.86.84-.86 2.05s.88 2.38 1 2.55c.13.16 1.7 2.72 4.2 3.71.58.25 1.04.4 1.4.51.59.19 1.12.16 1.55.1.47-.07 1.45-.59 1.65-1.17s.2-1.07.14-1.17c-.06-.1-.22-.16-.47-.28s-1.45-.72-1.68-.8c-.22-.08-.39-.13-.55.13-.16.25-.63.8-.78.97-.14.16-.29.18-.53.06-.25-.13-1.04-.38-1.99-1.23-.73-.66-1.23-1.46-1.37-1.71-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.16.04-.31-.02-.44-.07-.13-.55-1.4-.78-1.9-.19-.42-.4-.42-.55-.43z" }))));
}
/* ============================================================
   Product card + filter chips
   ============================================================ */
function ProductCard({ product, nav, lookups }) {
    return (React.createElement("button", { onClick: () => nav("product", product.slug), style: { textAlign: "left", display: "block" } },
        React.createElement("div", { style: { position: "relative" } },
            React.createElement(Placeholder, { label: product.name }),
            React.createElement("div", { style: { position: "absolute", top: 10, left: 10, display: "flex", gap: 6 } },
                product.bestseller && React.createElement(Badge, { tone: "maroon" }, "Bestseller"),
                product.isNew && React.createElement(Badge, { tone: "gold" }, "New"))),
        React.createElement("div", { style: { paddingTop: 14 } },
            React.createElement("h3", { style: { ...serif, fontSize: 18, color: C.ink, fontWeight: 500, marginBottom: 4 } }, product.name),
            React.createElement("p", { style: { ...sans, fontSize: 13, color: C.ink70, marginBottom: 8 }, className: "line-clamp-2" }, product.shortDescription),
            React.createElement("p", { style: { ...sans, fontSize: 14, color: C.maroon, fontWeight: 500 } }, product.priceOnRequest ? "Price on request" : inr(product.price)))));
}
function FilterChip({ active, onClick, children }) {
    return (React.createElement("button", { onClick: onClick, style: {
            ...sans, fontSize: 13, padding: "8px 14px", border: `1px solid ${active ? C.maroon : C.line}`,
            background: active ? C.maroon : "#fff", color: active ? "#fff" : C.ink,
        } }, children));
}
/* ============================================================
   Pages
   ============================================================ */
function HomePage({ data, nav, settings }) {
    const featured = data.products.filter((p) => p.featured && p.active).slice(0, 4);
    return (React.createElement("div", null,
        React.createElement("section", { style: { background: `linear-gradient(180deg, ${C.card} 0%, ${C.cream} 100%)`, borderBottom: `1px solid ${C.line}` } },
            React.createElement("div", { className: "container hero-grid", style: { padding: "72px 20px 64px", display: "grid", gap: 40 } },
                React.createElement("div", { style: { maxWidth: 560 } },
                    React.createElement("p", { style: { ...sans, color: C.gold, fontSize: 14, marginBottom: 14, letterSpacing: "0.02em" } }, "Handcrafted in small batches"),
                    React.createElement("h1", { style: { ...serif, fontSize: "clamp(34px,6vw,54px)", color: C.ink, fontWeight: 500, lineHeight: 1.12, marginBottom: 20 } }, "Fragrance, made personal."),
                    React.createElement("p", { style: { ...sans, fontSize: 17, color: C.ink70, lineHeight: 1.75, marginBottom: 32, maxWidth: 480 } }, "Candles and gifts inspired by the scents that live in Indian memory \u2014 dhoop drifting through a home, jasmine gajras, roses folded into old letters. Every piece is poured by hand and made to hold a moment."),
                    React.createElement("div", { style: { display: "flex", gap: 14, flexWrap: "wrap" } },
                        React.createElement(Button, { onClick: () => nav("catalogue", "all") }, "Explore the Catalogue"),
                        React.createElement(Button, { variant: "ghost", onClick: () => nav("create-ritual") }, "Create Your Own Ritual"))),
                React.createElement(Placeholder, { label: "Hero product photograph", ratio: "1 / 1" }))),
        React.createElement("section", { className: "container", style: { padding: "72px 20px" } },
            React.createElement(SectionHeading, { eyebrow: "Loved by our community", title: "Featured Rituals" }),
            React.createElement("div", { className: "product-grid", style: { marginTop: 36 } }, featured.map((p) => (React.createElement(ProductCard, { key: p.slug, product: p, nav: nav }))))),
        React.createElement("section", { style: { background: C.card, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` } },
            React.createElement("div", { className: "container", style: { padding: "72px 20px" } },
                React.createElement(SectionHeading, { eyebrow: "Find your ritual", title: "Shop by how you want to feel", align: "center" }),
                React.createElement("div", { className: "feeling-grid", style: { marginTop: 40 } }, data.feelings.filter((f) => f.active).map((f) => (React.createElement("button", { key: f.slug, onClick: () => nav("catalogue", "feeling", { value: f.slug }), style: { background: "#fff", border: `1px solid ${C.line}`, padding: "28px 20px", textAlign: "left" } },
                    React.createElement("h3", { style: { ...serif, fontSize: 18, color: C.ink, fontWeight: 500, marginBottom: 8 } }, f.name),
                    React.createElement("p", { style: { ...sans, fontSize: 13, color: C.ink70, lineHeight: 1.6 } }, f.description))))))),
        React.createElement("section", { className: "container", style: { padding: "72px 20px" } },
            React.createElement(SectionHeading, { eyebrow: "Every occasion, its own ritual", title: "Gifting made thoughtful" }),
            React.createElement("div", { className: "chip-wrap", style: { marginTop: 28 } }, data.occasions.filter((o) => o.active).map((o) => (React.createElement(FilterChip, { key: o.slug, active: false, onClick: () => nav("catalogue", "occasion", { value: o.slug }) }, o.name))))),
        React.createElement("section", { style: { background: C.maroon, color: "#fff" } },
            React.createElement("div", { className: "container", style: { padding: "64px 20px", textAlign: "center" } },
                React.createElement("h2", { style: { ...serif, fontSize: "clamp(24px,4vw,32px)", fontWeight: 500, marginBottom: 14 } }, "Can't find the right fragrance?"),
                React.createElement("p", { style: { ...sans, fontSize: 15, color: "#EAD9C8", maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.7 } }, "We make custom rituals \u2014 pick a fragrance, a vessel and a story, and we'll create it just for you."),
                React.createElement(Button, { variant: "gold", onClick: () => nav("create-ritual") }, "Start a Custom Ritual")))));
}
function CataloguePage({ data, nav, initialType, initialQuery, settings }) {
    const [category, setCategory] = useState("all");
    const [fragrance, setFragrance] = useState(initialType === "fragrance" ? (initialQuery.value || "all") : "all");
    const [feeling, setFeeling] = useState(initialType === "feeling" ? (initialQuery.value || "all") : "all");
    const [occasion, setOccasion] = useState(initialType === "occasion" ? (initialQuery.value || "all") : "all");
    const [search, setSearch] = useState("");
    const filtered = useMemo(() => {
        return data.products.filter((p) => {
            if (!p.active)
                return false;
            if (category !== "all" && p.categorySlug !== category)
                return false;
            if (fragrance !== "all" && !p.fragranceSlugs.includes(fragrance))
                return false;
            if (feeling !== "all" && !p.feelingSlugs.includes(feeling))
                return false;
            if (occasion !== "all" && !p.occasionSlugs.includes(occasion))
                return false;
            if (search && !p.name.toLowerCase().includes(search.toLowerCase()))
                return false;
            return true;
        });
    }, [data.products, category, fragrance, feeling, occasion, search]);
    const resetFilters = () => { setCategory("all"); setFragrance("all"); setFeeling("all"); setOccasion("all"); setSearch(""); };
    return (React.createElement("div", { className: "container", style: { padding: "48px 20px 80px" } },
        React.createElement(SectionHeading, { eyebrow: "The full collection", title: "Catalogue", sub: "Filter by category, fragrance, feeling or occasion to find the right ritual." }),
        React.createElement("div", { style: { marginTop: 32, display: "flex", flexDirection: "column", gap: 18 } },
            React.createElement("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search products\u2026", style: { ...sans, fontSize: 14, padding: "12px 16px", border: `1px solid ${C.line}`, background: "#fff", maxWidth: 320 } }),
            React.createElement("div", null,
                React.createElement("p", { style: { ...sans, fontSize: 12, color: C.ink70, marginBottom: 8, letterSpacing: "0.03em" } }, "CATEGORY"),
                React.createElement("div", { className: "chip-wrap" },
                    React.createElement(FilterChip, { active: category === "all", onClick: () => setCategory("all") }, "All"),
                    data.categories.filter((c) => c.active).map((c) => (React.createElement(FilterChip, { key: c.slug, active: category === c.slug, onClick: () => setCategory(c.slug) }, c.name))))),
            React.createElement("div", null,
                React.createElement("p", { style: { ...sans, fontSize: 12, color: C.ink70, marginBottom: 8, letterSpacing: "0.03em" } }, "FRAGRANCE"),
                React.createElement("div", { className: "chip-wrap" },
                    React.createElement(FilterChip, { active: fragrance === "all", onClick: () => setFragrance("all") }, "All"),
                    data.fragrances.filter((f) => f.active).map((f) => (React.createElement(FilterChip, { key: f.slug, active: fragrance === f.slug, onClick: () => setFragrance(f.slug) }, f.name))))),
            React.createElement("div", null,
                React.createElement("p", { style: { ...sans, fontSize: 12, color: C.ink70, marginBottom: 8, letterSpacing: "0.03em" } }, "FEELING"),
                React.createElement("div", { className: "chip-wrap" },
                    React.createElement(FilterChip, { active: feeling === "all", onClick: () => setFeeling("all") }, "All"),
                    data.feelings.filter((f) => f.active).map((f) => (React.createElement(FilterChip, { key: f.slug, active: feeling === f.slug, onClick: () => setFeeling(f.slug) }, f.name))))),
            React.createElement("div", null,
                React.createElement("p", { style: { ...sans, fontSize: 12, color: C.ink70, marginBottom: 8, letterSpacing: "0.03em" } }, "OCCASION"),
                React.createElement("div", { className: "chip-wrap" },
                    React.createElement(FilterChip, { active: occasion === "all", onClick: () => setOccasion("all") }, "All"),
                    data.occasions.filter((o) => o.active).map((o) => (React.createElement(FilterChip, { key: o.slug, active: occasion === o.slug, onClick: () => setOccasion(o.slug) }, o.name))))),
            (category !== "all" || fragrance !== "all" || feeling !== "all" || occasion !== "all" || search) && (React.createElement("button", { onClick: resetFilters, style: { ...sans, fontSize: 13, color: C.maroon, textAlign: "left", textDecoration: "underline" } }, "Clear filters"))),
        React.createElement("p", { style: { ...sans, fontSize: 13, color: C.ink70, marginTop: 28 } },
            filtered.length,
            " ritual",
            filtered.length !== 1 ? "s" : "",
            " found"),
        React.createElement("div", { className: "product-grid", style: { marginTop: 20 } }, filtered.map((p) => React.createElement(ProductCard, { key: p.slug, product: p, nav: nav }))),
        filtered.length === 0 && (React.createElement("div", { style: { padding: "60px 0", textAlign: "center" } },
            React.createElement("p", { style: { ...sans, color: C.ink70, marginBottom: 20 } }, "No rituals match those filters yet."),
            React.createElement(Button, { variant: "outline", onClick: resetFilters }, "Clear filters")))));
}
function ProductDetailPage({ data, nav, slug, settings }) {
    const product = data.products.find((p) => p.slug === slug);
    if (!product) {
        return (React.createElement("div", { className: "container", style: { padding: "80px 20px", textAlign: "center" } },
            React.createElement("p", { style: { ...sans, color: C.ink70, marginBottom: 20 } }, "We couldn't find that product."),
            React.createElement(Button, { onClick: () => nav("catalogue", "all") }, "Back to Catalogue")));
    }
    const fragranceNames = product.fragranceSlugs
        .map((s) => { var _a; return (_a = data.fragrances.find((f) => f.slug === s)) === null || _a === void 0 ? void 0 : _a.name; })
        .filter(Boolean);
    const feelingNames = product.feelingSlugs
        .map((s) => { var _a; return (_a = data.feelings.find((f) => f.slug === s)) === null || _a === void 0 ? void 0 : _a.name; })
        .filter(Boolean);
    const occasionNames = product.occasionSlugs
        .map((s) => { var _a; return (_a = data.occasions.find((o) => o.slug === s)) === null || _a === void 0 ? void 0 : _a.name; })
        .filter(Boolean);
    const enquiryMsg = `Hello Mysaa Rituals! I'm interested in "${product.name}"${product.priceOnRequest ? "" : ` (${inr(product.price)})`}. Could you share more details?`;
    return (React.createElement("div", { className: "container", style: { padding: "48px 20px 80px" } },
        React.createElement("button", { onClick: () => nav("catalogue", "all"), style: { ...sans, fontSize: 13, color: C.ink70, marginBottom: 24 } }, "\u2190 Back to catalogue"),
        React.createElement("div", { className: "product-detail-grid" },
            React.createElement(Placeholder, { label: product.name, ratio: "4 / 5" }),
            React.createElement("div", null,
                React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 14 } },
                    product.bestseller && React.createElement(Badge, { tone: "maroon" }, "Bestseller"),
                    product.isNew && React.createElement(Badge, { tone: "gold" }, "New"),
                    React.createElement(Badge, null, product.type)),
                React.createElement("h1", { style: { ...serif, fontSize: "clamp(26px,4vw,36px)", color: C.ink, fontWeight: 500, marginBottom: 10 } }, product.name),
                React.createElement("p", { style: { ...sans, fontSize: 22, color: C.maroon, fontWeight: 500, marginBottom: 18 } }, product.priceOnRequest ? "Price on request" : inr(product.price)),
                React.createElement("p", { style: { ...sans, fontSize: 15, color: C.ink70, lineHeight: 1.75, marginBottom: 26 } }, product.shortDescription),
                React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 } },
                    React.createElement(Button, { href: waLink(settings.whatsapp, enquiryMsg), target: "_blank" }, "Enquire on WhatsApp"),
                    product.customizable && React.createElement(Button, { variant: "ghost", onClick: () => nav("create-ritual") }, "Customize This")),
                React.createElement("div", { style: { borderTop: `1px solid ${C.line}`, paddingTop: 22, display: "grid", gap: 10, fontSize: 14, ...sans, color: C.ink70 } },
                    product.size && React.createElement("div", null,
                        React.createElement("strong", { style: { color: C.ink } }, "Size:"),
                        " ",
                        product.size),
                    product.burnTime && product.burnTime !== "—" && React.createElement("div", null,
                        React.createElement("strong", { style: { color: C.ink } }, "Burn time:"),
                        " ",
                        product.burnTime),
                    product.materials && React.createElement("div", null,
                        React.createElement("strong", { style: { color: C.ink } }, "Materials:"),
                        " ",
                        product.materials),
                    product.packaging && React.createElement("div", null,
                        React.createElement("strong", { style: { color: C.ink } }, "Packaging:"),
                        " ",
                        product.packaging),
                    fragranceNames.length > 0 && React.createElement("div", null,
                        React.createElement("strong", { style: { color: C.ink } }, "Fragrance:"),
                        " ",
                        fragranceNames.join(", ")),
                    feelingNames.length > 0 && React.createElement("div", null,
                        React.createElement("strong", { style: { color: C.ink } }, "Feeling:"),
                        " ",
                        feelingNames.join(", ")),
                    occasionNames.length > 0 && React.createElement("div", null,
                        React.createElement("strong", { style: { color: C.ink } }, "Good for:"),
                        " ",
                        occasionNames.join(", "))))),
        product.ritual && (React.createElement("div", { style: { marginTop: 64, background: C.card, border: `1px solid ${C.line}`, padding: "40px 32px" } },
            React.createElement("h2", { style: { ...serif, fontSize: 24, color: C.ink, fontWeight: 500, marginBottom: 24 } }, "The story behind this ritual"),
            React.createElement("div", { className: "ritual-grid" },
                product.ritual.fragrance && (React.createElement("div", null,
                    React.createElement("h4", { style: { ...sans, fontSize: 12, letterSpacing: "0.04em", color: C.gold, marginBottom: 8 } }, "FRAGRANCE"),
                    React.createElement("p", { style: { ...sans, fontSize: 14, color: C.ink70, lineHeight: 1.7 } }, product.ritual.fragrance))),
                product.ritual.feeling && (React.createElement("div", null,
                    React.createElement("h4", { style: { ...sans, fontSize: 12, letterSpacing: "0.04em", color: C.gold, marginBottom: 8 } }, "FEELING"),
                    React.createElement("p", { style: { ...sans, fontSize: 14, color: C.ink70, lineHeight: 1.7 } }, product.ritual.feeling))),
                product.ritual.inspiration && (React.createElement("div", null,
                    React.createElement("h4", { style: { ...sans, fontSize: 12, letterSpacing: "0.04em", color: C.gold, marginBottom: 8 } }, "INSPIRATION"),
                    React.createElement("p", { style: { ...sans, fontSize: 14, color: C.ink70, lineHeight: 1.7 } }, product.ritual.inspiration))),
                product.ritual.perfectFor && (React.createElement("div", null,
                    React.createElement("h4", { style: { ...sans, fontSize: 12, letterSpacing: "0.04em", color: C.gold, marginBottom: 8 } }, "PERFECT FOR"),
                    React.createElement("p", { style: { ...sans, fontSize: 14, color: C.ink70, lineHeight: 1.7 } }, product.ritual.perfectFor))))))));
}
function CreateRitualPage({ data, settings }) {
    const [form, setForm] = useState({ name: "", fragrance: "", vessel: "", occasion: "", notes: "" });
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
    const message = [
        "Hello Mysaa Rituals! I'd like to create a custom ritual.",
        form.name && `Name: ${form.name}`,
        form.fragrance && `Preferred fragrance / mood: ${form.fragrance}`,
        form.vessel && `Vessel / format: ${form.vessel}`,
        form.occasion && `Occasion: ${form.occasion}`,
        form.notes && `Notes: ${form.notes}`,
    ].filter(Boolean).join("\n");
    return (React.createElement("div", { className: "container", style: { padding: "48px 20px 80px", maxWidth: 720 } },
        React.createElement(SectionHeading, { eyebrow: "Made just for you", title: "Create Your Own Ritual", sub: "Tell us a little about what you're looking for, and we'll get back to you on WhatsApp to design it together." }),
        React.createElement("div", { style: { marginTop: 36, display: "grid", gap: 18 } },
            React.createElement(Field, { label: "Your name", value: form.name, onChange: set("name") }),
            React.createElement(Field, { label: "Preferred fragrance or mood", value: form.fragrance, onChange: set("fragrance"), placeholder: "e.g. warm sandalwood, fresh florals\u2026" }),
            React.createElement(Field, { label: "Vessel or format", value: form.vessel, onChange: set("vessel"), placeholder: "e.g. candle, hamper, personalised gift" }),
            React.createElement(Field, { label: "Occasion", value: form.occasion, onChange: set("occasion"), placeholder: "e.g. Diwali, wedding favour, birthday" }),
            React.createElement(FieldArea, { label: "Anything else we should know?", value: form.notes, onChange: set("notes") }),
            React.createElement(Button, { href: waLink(settings.whatsapp, message), target: "_blank", style: { marginTop: 8, width: "fit-content" } }, "Send via WhatsApp"))));
}
function Field({ label, ...props }) {
    return (React.createElement("label", { style: { display: "block" } },
        React.createElement("span", { style: { ...sans, fontSize: 13, color: C.ink70, display: "block", marginBottom: 6 } }, label),
        React.createElement("input", { ...props, style: { ...sans, width: "100%", fontSize: 14, padding: "12px 14px", border: `1px solid ${C.line}`, background: "#fff" } })));
}
function FieldArea({ label, ...props }) {
    return (React.createElement("label", { style: { display: "block" } },
        React.createElement("span", { style: { ...sans, fontSize: 13, color: C.ink70, display: "block", marginBottom: 6 } }, label),
        React.createElement("textarea", { ...props, rows: 4, style: { ...sans, width: "100%", fontSize: 14, padding: "12px 14px", border: `1px solid ${C.line}`, background: "#fff", resize: "vertical" } })));
}
function AboutPage({ settings }) {
    return (React.createElement("div", { className: "container", style: { padding: "48px 20px 80px", maxWidth: 760 } },
        React.createElement(SectionHeading, { eyebrow: "Our story", title: "Handmade, homegrown, heartfelt" }),
        React.createElement("div", { style: { marginTop: 28, display: "grid", gap: 20, ...sans, fontSize: 16, color: C.ink70, lineHeight: 1.8 } },
            React.createElement("p", null, "Mysaa Rituals began with a simple idea: that fragrance can hold memory. The smell of dhoop in a childhood home, jasmine gajras on a festival morning, roses pressed into an old letter \u2014 these are the moments we try to bottle into every candle we pour."),
            React.createElement("p", null, "Each piece is handcrafted in small batches using a soy wax blend and cotton wicks, and finished with care in our signature packaging. We believe gifting should feel personal, so every fragrance, feeling and occasion in our catalogue is a starting point \u2014 not the end of the conversation."),
            React.createElement("p", null, "If nothing in the catalogue feels quite right, that's exactly what our Custom Rituals are for. Tell us about your moment, and we'll create something made only for it.")),
        React.createElement(Placeholder, { label: "Studio / process photograph", ratio: "16 / 9" })));
}
function ContactPage({ settings }) {
    return (React.createElement("div", { className: "container", style: { padding: "48px 20px 80px", maxWidth: 640 } },
        React.createElement(SectionHeading, { eyebrow: "We'd love to hear from you", title: "Get in touch" }),
        React.createElement("div", { style: { marginTop: 32, display: "grid", gap: 16 } },
            React.createElement(ContactRow, { label: "WhatsApp", value: settings.phone, href: waLink(settings.whatsapp, "Hello Mysaa Rituals!") }),
            React.createElement(ContactRow, { label: "Email", value: settings.email, href: `mailto:${settings.email}` }),
            React.createElement(ContactRow, { label: "Instagram", value: settings.instagramHandle || "@mysaarituals", href: settings.instagram }),
            settings.address && React.createElement(ContactRow, { label: "Studio", value: settings.address }))));
}
function ContactRow({ label, value, href }) {
    const content = (React.createElement("div", { style: { padding: "18px 20px", border: `1px solid ${C.line}`, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" } },
        React.createElement("span", { style: { ...sans, fontSize: 13, color: C.ink70 } }, label),
        React.createElement("span", { style: { ...sans, fontSize: 14, color: C.ink, fontWeight: 500 } }, value)));
    return href ? React.createElement("a", { href: href, target: "_blank", rel: "noreferrer" }, content) : content;
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
        window.location.hash = buildHash(page, param, query);
    }, []);
    useEffect(() => {
        if (data && data.settings) {
            document.title = data.settings.seoTitle || "Mysaa Rituals";
        }
    }, [data]);
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
        page = React.createElement(CataloguePage, { data: data, nav: nav, initialType: route.param, initialQuery: route.query, settings: settings });
    else if (route.page === "product")
        page = React.createElement(ProductDetailPage, { data: data, nav: nav, slug: route.param, settings: settings });
    else if (route.page === "create-ritual")
        page = React.createElement(CreateRitualPage, { data: data, settings: settings });
    else if (route.page === "about")
        page = React.createElement(AboutPage, { settings: settings });
    else if (route.page === "contact")
        page = React.createElement(ContactPage, { settings: settings });
    else
        page = React.createElement(HomePage, { data: data, nav: nav, settings: settings });
    return (React.createElement(React.Fragment, null,
        React.createElement(Header, { nav: nav, settings: settings }),
        React.createElement("main", { style: { minHeight: "60vh" } }, page),
        React.createElement(Footer, { nav: nav, settings: settings }),
        React.createElement(WhatsAppFloat, { settings: settings })));
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App, null));
