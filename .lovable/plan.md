

## Problem

The Calendar page has a fixed/sticky header bar (`fixed top-0`) with a backdrop blur, border-bottom, and pill-shaped buttons ("2026 3月", "今天"). This visual treatment is heavy and inconsistent with the other pages (Home, Story, Profile) which don't use this kind of chrome-heavy sticky toolbar.

## Approach

Replace the current fixed toolbar with a lighter, inline header that matches the app's minimalist journal aesthetic:

1. **Remove the fixed header bar** — eliminate `fixed top-0`, `bg-background/80 backdrop-blur-xl`, `border-b` wrapper entirely.

2. **Inline the controls into the content area** — place the title ("时间轴") and the month picker / today button as a simple inline row at the top of the scrollable content, similar to how the Story page handles its header. Use `pt-14` top padding (matching safe area) without a sticky bar.

3. **Soften the button styles**:
   - Month picker trigger: remove the `bg-muted/80` pill background, use a subtle text-only style with a small calendar icon (matching the muted, minimal look of other pages).
   - "今天" button: keep it as a small text link or a very subtle outlined pill instead of a solid `bg-primary` button.

4. **Adjust content padding** — change `pt-16` to `pt-4` since there's no fixed bar to account for anymore.

### Files to modify

- **`src/components/CalendarPage.tsx`**: 
  - Remove the `<div className="fixed top-0 ...">` wrapper.
  - Move the title + controls into the main content `<div>` as a non-sticky flex row with `px-5 pt-14 pb-4`.
  - Simplify button styles to text-weight links with subtle hover states.
  - Change content `pt-16` → `pt-0` (since header is now inline).

