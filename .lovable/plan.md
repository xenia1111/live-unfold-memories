

## Problem

The Story page feels too flat and tool-like — the tabs, cards, and category list lack visual breathing room and organic warmth. The layout is dense and utilitarian, missing the hand-drawn/journal aesthetic the rest of the app aims for.

## Design Direction

Transform the Story page from a "dashboard tool" into a "personal journal/scrapbook" with more white space, softer edges, layered depth, and gentle decorative touches.

## Changes

### 1. View Mode Toggle — More Spacious & Organic
- Add more vertical padding above the toggle (e.g. a soft greeting or decorative element)
- Make the toggle pills taller with more internal padding, rounded-3xl
- Add a subtle shadow instead of flat `bg-muted/40`

### 2. Period Tabs — Breathing Room
- Increase spacing between pills (`gap-3`, `py-2.5`, `px-5`)
- Active tab gets a subtle shadow + slightly larger text
- Add a small decorative line or dot pattern below the tabs as a separator

### 3. Story Cards — Journal Page Feel
- Increase vertical spacing between cards (`space-y-10` instead of `space-y-8`)
- Add more internal padding (`px-7 pt-7 pb-5`)
- Use softer background colors with more opacity variation
- Add a decorative "page corner" or subtle tape/stamp element
- The timeline header gets more breathing room (`mb-5` instead of `mb-3`)

### 4. Category View — Card Expansion
- Add more padding inside category cards (`px-6 py-5`)
- Increase spacing between category items (`space-y-5`)
- Make the emoji larger and add a soft circular background behind it
- Add subtle gradient borders instead of flat borders
- More whitespace between expanded content sections

### 5. Global Breathing Elements
- Add a page title/header area at the top with a decorative emoji and subtitle
- Soft animated entrance for the whole page
- Gentle decorative SVG dividers between sections (like the wavy line already in story cards)

### Files to Edit
- `src/components/StoryPage.tsx` — layout spacing, tab styling, card padding, decorative elements
- `src/components/CategoryStoryView.tsx` — card spacing, emoji backgrounds, expanded content padding

