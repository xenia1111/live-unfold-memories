

## Performance Optimization Plan

### Problem Analysis

After reviewing the codebase, the main performance bottlenecks are:

1. **`removeWhiteBackground`** (imageUtils.ts) — runs a **flood-fill algorithm on every cat image** at full resolution on every render via `TransparentImage` in CatPet.tsx. This is a heavy canvas operation that blocks the main thread.

2. **`extractDominantColor`** (colorExtract.ts) — runs canvas color extraction for each month's photo in StoryPage, triggered on every mount.

3. **`calcCatFood` / `calcStreak` / `getCatPersonality`** — recomputed from the full task array on every render in multiple components (HomePage, CatPet, ProfilePage) without memoization at the source.

4. **i18n dictionary** — the entire 1300+ line dictionary file is loaded and parsed regardless of language. Minor but contributes to initial load.

### What Should Be Hardcoded / Precomputed on the Frontend

| Item | Current | Proposed |
|------|---------|----------|
| Cat images (white bg removal) | Runtime flood-fill per render | **Pre-process PNGs to have transparent backgrounds** at build time, remove `removeWhiteBackground` entirely |
| Cat personality labels/lines | Already frontend-only | No change needed |
| Cat growth stages/thresholds | Already frontend constants | No change needed |
| Background images mapping | Already frontend constants | No change needed |
| Taste comments | Already frontend constants | No change needed |
| Month names | Already frontend constants | No change needed |

### Implementation Steps

#### 1. Eliminate `removeWhiteBackground` runtime processing
- The cat PNG assets should already have transparent backgrounds. Pre-process them (or replace with proper transparent PNGs).
- Remove the `TransparentImage` component from CatPet.tsx and use plain `<img>` tags.
- Delete `src/lib/imageUtils.ts`.
- This alone will eliminate the single biggest performance bottleneck.

#### 2. Cache `extractDominantColor` results
- Store extracted colors in `localStorage` keyed by image URL.
- On subsequent loads, read from cache instead of re-running canvas extraction.
- Only run extraction for new/uncached photos.

#### 3. Memoize expensive computations in CatPet
- Wrap `calcCatFood`, `calcStreak`, `getCatStage`, `getCatPersonality` calls in `useMemo` with `[tasks]` dependency (verify current usage).
- Ensure CatPet doesn't re-render unnecessarily when parent state changes.

#### 4. Lazy-load StoryPage and ProfilePage
- Use `React.lazy()` + `Suspense` in Index.tsx for non-home tabs so they only load when accessed.

### Expected Impact
- **removeWhiteBackground removal**: Eliminates ~200-500ms of canvas processing per cat image displayed (the biggest win)
- **Color extraction caching**: Saves ~100ms per cached photo on StoryPage re-visits
- **Lazy loading**: Reduces initial bundle parse time by deferring unused page code

### Files to Modify
- `src/components/CatPet.tsx` — remove TransparentImage, use plain img
- `src/lib/imageUtils.ts` — delete file
- `src/components/StoryPage.tsx` — add localStorage caching for color extraction
- `src/pages/Index.tsx` — add React.lazy for StoryPage, CalendarPage, ProfilePage

