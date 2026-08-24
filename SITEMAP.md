# MindCubby Sitemap

## Site Structure (Joy-First, Existing Content Only)

```
mindcubby.com/
│
├─ / (ROOT - HERO PAGE)
│  │
│  ├─ HERO SECTION
│  │  ├─ Featured Video (YouTube Shorts)
│  │  ├─ Headline: "MindCubby"
│  │  ├─ Subheading: "Things I make because they bring me joy"
│  │  └─ CTAs: "Buy One" or "Make Your Own"
│  │
│  ├─ SECTION 1: FEATURED PHYSICAL PRODUCTS (3 from Etsy API)
│  │  ├─ Grid of 3 product cards
│  │  ├─ Each card: Image + Title + Price
│  │  ├─ CTA 1: "Buy on Etsy"
│  │  ├─ CTA 2: "Get Digital Version" (link to STL download)
│  │  ├─ Optional: YouTube Short video below/embedded
│  │  └─ Subheading: "Physical Products"
│  │
│  ├─ SECTION 2: FEATURED DIGITAL PRODUCTS (3 Free from Printables)
│  │  ├─ Grid of 3 free design cards
│  │  ├─ Each card: Image + Title + "Free Download"
│  │  ├─ CTA: "Download STL" (link to Printables)
│  │  ├─ Optional: YouTube Short video below/embedded
│  │  └─ Subheading: "Free Designs"
│  │
│  ├─ SECTION 3: MAKE YOUR OWN (3D Creator Tools)
│  │  ├─ Headline: "Make Your Own"
│  │  ├─ Grid of 3 tool cards
│  │  ├─ Rotater | GCoder | Spooler
│  │  ├─ Each card: Icon + Title + Description
│  │  ├─ CTA: "Try it" → links to each tool
│  │  └─ Subheading: "3D Creator Tools"
│  │
│  ├─ SECTION 4: EXPLORE (Labs / Collections)
│  │  ├─ Headline: "Other Things I Make"
│  │  ├─ Grid of cards (optional, or just footer links)
│  │  ├─ Posts for Pause (productivity)
│  │  └─ Labs (experimental apps)
│  │
│  ├─ Footer Navigation
│  │  ├─ "Shop" → /etsy/
│  │  ├─ "About" → /about/
│  │  ├─ "Labs" → /labs/
│  │  ├─ Social links (YouTube, TikTok, Instagram)
│  │  └─ "Design System" (quiet link)
├─ /etsy/ (SHOP)
│  ├─ Public product storefront
│  ├─ Displays top products from Etsy API cache
│  ├─ "View on Etsy" CTA
│  ├─ "Want to make this? Download the STL" (if available)
│  └─ Cache age display
│
├─ /about/ (MAKER'S STORY)
│  ├─ "About MindCubby"
│  ├─ Philosophy: "Making things from joy"
│  ├─ Background (designer, maker, builder)
│  ├─ Why these products
│  ├─ Contact / Email
│  └─ Social links
│
├─ /design-system/ (or /smoothie/)
│  ├─ Smoothie Design System documentation
│  ├─ Visual components
│  ├─ Design principles
│  ├─ GitHub repository
│  └─ For: Developers, designers, recruiters
│
├─ /labs/ (SECONDARY PRODUCTS)
│  ├─ "Other Things I Make"
│  ├─ Productivity apps catalog:
│  │  ├─ Posts for Pause
│  │  ├─ Timer
│  │  ├─ Tracker
│  │  ├─ Note
│  │  ├─ Pad
│  │  └─ Others
│  └─ Note: "These are separate from MindCubby's 3D focus"
│
├─ /3d/apps/rotater/ (EXISTING)
│  └─ 3D Model Rotater tool (already exists)
│
├─ /3d/apps/gcoder/ (EXISTING)
│  └─ GCode Visualizer tool (already exists)
│
├─ /3d/apps/spooler/ (EXISTING)
│  └─ Spooler tool (already exists)
│
├─ /api/etsy/* (BACKEND - NOT USER-FACING)
│  ├─ /api/auth/etsy/ - OAuth initiator
│  ├─ /api/auth/etsy/callback - OAuth callback handler
│  ├─ /api/etsy/cache - Public product cache
│  ├─ /api/etsy/refresh-cache - Manual cache refresh
│  ├─ /api/etsy/cron-refresh - Daily auto-refresh (Vercel cron)
│  ├─ /api/health-check - System monitoring
│  └─ /api/middleware/* - Rate limiting, logging
│
└─ /robots.txt, /sitemap.xml, etc. (SEO)
```

---

## User Journeys Through This Sitemap

### Journey 1: Impulse Joy Seeker
```
mindcubby.com/ 
  → Video catches attention
  → "Buy One" 
  → /etsy/ 
  → Purchase
```

### Journey 2: Maker Who Wants to Create
```
mindcubby.com/ 
  → Video + "Make Your Own"
  → Download STL
  → Use 3D Tools (/3d/apps/*)
  → Watch process video
  → Print
```

### Journey 3: Technical Recruiter / Developer
```
mindcubby.com/ 
  → Sees design system link
  → /design-system/ 
  → GitHub repositories
  → Impressed by architecture
```

### Journey 4: Curious Follower
```
mindcubby.com/ 
  → Likes the energy
  → Follows on YouTube/TikTok
  → Reads /about/
  → Discovers /labs/ products
  → Becomes long-term follower
```

### Journey 5: Lost Someone Discovering Your Apps
```
Product Hunt / Google Search 
  → /labs/ (Posts for Pause or other app)
  → Likes the app
  → Clicks "More from this maker"
  → Discovers mindcubby.com/
  → Realizes you make 3D things too
```

---

## Key Decisions Needed

Before we build, confirm these choices:

### 1. Featured Products on Root
- [ ] Show top 3-5 featured products on mindcubby.com/ homepage?
- [ ] Or just a "Shop on Etsy" link (minimal)?
- [ ] If shown, do they link to Etsy or to a detail page?

### 2. STL Download Location
- Where should users download STL files?
  - [ ] Hosted on mindcubby.com/ (requires file storage)
  - [ ] Link to Etsy (where they're already sold)
  - [ ] Link to external platforms (Printables, Makerworld, etc.)
  - [ ] Mix of the above?

### 3. Design System Visibility
- [ ] Link on main page? (currently planning quiet link in "See the Craft")
- [ ] Separate /design-system/ page?
- [ ] Or completely hidden from public (only for recruiters who dig)?

### 4. /labs/ Positioning
- [ ] Link from main navigation?
- [ ] Only in footer?
- [ ] Separate domain entirely?
- [ ] Clear separation from MindCubby brand?

### 5. Blog / Writing Location
- Where should writing/blog posts live?
  - [ ] /blog/ on root site
  - [ ] Only on social (YouTube, Medium, etc.)
  - [ ] Embedded on pages (/about/, etc.)
  - [ ] Not yet (future feature)?

### 6. Email / Contact
- [ ] Email link on /about/?
- [ ] Newsletter signup on main page?
- [ ] Contact form?
- [ ] Social DMs only?

### 7. Video Hosting
- Where will the hero video live?
  - [ ] Embedded YouTube player on main page?
  - [ ] Embedded TikTok?
  - [ ] Hosted video file (MP4)?
  - [ ] Link to YouTube (external)?

---

## Structure Summary

**Primary (main narrative):**
- `/` (hero) → `/etsy/` (shop) → `/3d/apps/*` (tools) → `/about/` (maker story)

**Secondary (for curious/technical):**
- `/design-system/` (for builders)
- `/labs/` (for productivity users)

**Completely separate:**
- API endpoints `/api/*` (hidden, backend only)
- Existing apps `/3d/apps/*` (already functional)

---

Does this sitemap align with your vision? Any changes needed before we build?
