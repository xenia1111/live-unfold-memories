

## Film Strip Carousel for Story Page

Transform the vertical story card list into a horizontal swipeable film-strip carousel, where each period (本周/上周/上上周) is a full-width "film frame" the user swipes through.

### Design Concept

```text
┌─────────────────────────────────┐
│  Period Tabs (week/month/...)   │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│  │  ◄  Film Frame 1 (本周)  ► │ │
│  │                             │ │
│  │  Title / Mood / Quote       │ │
│  │  Progress bar               │ │
│  │  Summary + Highlights       │ │
│  │  AI button / Notes / Share  │ │
│  │                             │ │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│        ● ○ ○  (dot indicators)  │
└─────────────────────────────────┘
```

### Changes

**`src/components/StoryPage.tsx`**

1. Replace the vertical `space-y-10` story card list with an Embla carousel (already installed via `embla-carousel-react`)
2. Each story card becomes a `CarouselItem` — full-width swipeable frame
3. Add film-strip styling: subtle sprocket-hole decorations on top/bottom edges of the carousel area, dark border framing
4. Add dot indicators below the carousel showing current slide position
5. Period tabs remain above the carousel as-is
6. Remove the `animationDelay` stagger since cards are now one-at-a-time
7. Track active slide index to sync with dot indicators

### Technical Details

- Use the existing `Carousel`, `CarouselContent`, `CarouselItem` from `src/components/ui/carousel.tsx`
- Each card's content stays identical — just wrapped in carousel items
- Add a film-frame border effect: `border-2 border-foreground/10` with small rounded-square "sprocket holes" as decorative pseudo-elements via CSS
- Dot pagination: simple flex row of small circles, active one filled

### Files to Edit
| File | Change |
|------|--------|
| `src/components/StoryPage.tsx` | Wrap story cards in Carousel, add dot indicators and film-strip decoration |

