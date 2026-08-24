# MindCubby Hub — Sitemap & Architecture

## Why This Structure

**MindCubby is a single HUB at mindcubby.com/**, not separate pages.

**User's requirements:**
- Brutalist design (no decorative elements)
- Everything on one page (no separate pages to maintain)
- Each Labs app gets its own card (not hidden in submenus)
- Physical products from Etsy API (3 featured)
- 3D creator tools (Rotater, GCoder, Spooler)
- Free designs via Printables embeds
- Dark/light theme toggle

---

## Sitemap: mindcubby.com/

```
mindcubby.com/
│
├─ HERO SECTION
│  ├─ Headline: "MindCubby"
│  ├─ Subheading: "Things I make because they bring me joy"
│  └─ CTAs: "Buy One" (Etsy) | "Make Your Own" (anchor to tools)
│
├─ SECTION 1: PHYSICAL PRODUCTS (3 from Etsy API cache)
│  ├─ Grid of 3 cards
│  ├─ Image + Title + Price
│  ├─ CTA: "Buy on Etsy"
│  └─ Auto-updates daily via cron job (no user auth needed)
│
├─ SECTION 2: 3D CREATOR TOOLS (Existing apps)
│  ├─ Rotater (GIF/MP4/PNG export)
│  ├─ G-coder (G-code specifications)
│  ├─ Spooler (Filament inventory)
│  └─ Each links to existing /3d/apps/*
│
├─ SECTION 3: FREE DESIGNS (Printables embeds)
│  ├─ 3 Printables embed iframes
│  ├─ No backend needed (Printables hosts everything)
│  └─ Users download directly from embeds
│
├─ SECTION 4: EXPERIMENTAL APPS (All Labs apps as cards)
│  ├─ Posts for Pause
│  ├─ Timer
│  ├─ Note
│  ├─ Pad
│  ├─ Tracker
│  └─ Today List
│
└─ FOOTER
   ├─ "Shop" → /etsy/
   ├─ "YouTube"
   └─ "TikTok"
```

---

## Design: Brutalist

- **Grid layout** with 1px borders separating cards
- **No shadows, gradients, or decorative elements**
- **Bold borders** between sections
- **High contrast** (black on white, white on black in dark mode)
- **Simple hover**: Card background inverts with text
- **Theme toggle** (light/dark, persistent in localStorage)

---

## Why Printables Over Custom API

**Printables:**
- ✅ Public embed iframes (no auth needed)
- ✅ Hardcoded model IDs
- ✅ Zero backend code
- ✅ Printables handles hosting, images, embeds

**Etsy (which we already built):**
- ✅ OAuth PKCE flow
- ✅ Redis caching
- ✅ Token management
- ✅ Daily cron refresh
- ✅ Multiple API endpoints

**Result**: Printables is 3 lines of HTML. Etsy is 300+ lines of backend code. For physical products, Etsy API is necessary. For free designs, Printables embeds are simpler.

---

## Existing Infrastructure Already Working

- ✅ Etsy API integration with Redis cache
- ✅ Daily cron refresh at 00:00 UTC
- ✅ Shop ID hardcoded (62670465) — no user auth needed
- ✅ `/etsy/` page displays products from cache
- ✅ Rate limiting on all endpoints
- ✅ Structured JSON logging

---

## What We Built (Phase 1 - Complete)

✅ **Single hub page** (mindcubby.com/)
✅ **Brutalist design** (borders, grid, no decoration)
✅ **Each Labs app as individual card** (all 6 visible)
✅ **Physical products** (3 from Etsy API cache)
✅ **3D tools section** (Rotater, GCoder, Spooler)
✅ **Free designs** (Printables embeds)
✅ **Dark/light theme toggle** (localStorage persistent)
✅ **Minimal footer** (Shop, YouTube, TikTok)

---

## What We Explicitly Skipped

❌ **Separate pages** (/design-system/, /about/, etc. — future if needed)
❌ **Blog** (never mentioned)
❌ **Content strategy** (not discussed)
❌ **A/B testing / Optimization phases** (not discussed)
❌ **Featured hero video** (physical products are the focus)
❌ **Multiple featured sections** (one cohesive hub)

