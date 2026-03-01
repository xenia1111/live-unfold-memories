

## Problem

1. Header with month picker and "today" button scrolls away with the page -- useless for navigation
2. "Back to top" button design is ugly and redundant if we have sticky navigation

## Plan

### Make header sticky
- Change the header `div` from normal flow to `fixed` positioning at the top, with backdrop blur and subtle border
- Add `pt-16` or similar to the content below to compensate for the fixed header height
- Remove the ugly "back to top" button entirely since the sticky header with month picker + today button serves that purpose

### Refined sticky header design
- Clean frosted glass bar: `fixed top-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50`
- Inner container: `max-w-lg mx-auto px-5 py-3 flex items-center justify-between`
- Title slightly smaller in sticky mode
- Month picker and "today" button stay accessible at all times

### Files to modify
- `src/components/CalendarPage.tsx`: Make header fixed, remove back-to-top button, adjust content padding

