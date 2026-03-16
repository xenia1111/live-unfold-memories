

## Problem Analysis

The current swipe implementation only triggers month switching when the scroll container is at its boundary (top/bottom). This means:
1. If the card content is short and doesn't scroll, swiping works but feels unreliable
2. If the card content is long, users must scroll all the way to the bottom before a swipe-up switches months — very unintuitive
3. The user wants **direct swipe between months** as the primary gesture, not scroll-then-swipe

## Plan

### Approach: Outer swipe zone + inner scroll separation

Instead of putting touch handlers on the scrollable content area (which conflicts with scrolling), restructure the touch interaction:

1. **Put touch handlers on the entire container** (the outer `div`), not on the scroll area
2. **Track horizontal vs vertical intent**: Use the initial touch movement direction. Since this is vertical-only navigation, detect swipe on the card edges (left/right margins) or use a two-finger / velocity-based approach
3. **Better approach — drag-to-switch with visual feedback**:
   - Track `touchStart` on the outer container
   - On `touchMove`, calculate vertical delta. If the touch originated outside the scroll content (on the stacked edges) OR if the scroll is at boundary, apply a visual drag offset to the active card
   - On `touchEnd`, if drag exceeds threshold, switch month with animation; otherwise snap back

### Revised Implementation

**Key change**: Add a dedicated swipe overlay zone on the stacked card edges (top/bottom peek areas) that always triggers month switching on swipe. For the main card area, keep the current boundary-detection logic but lower the threshold significantly (20px instead of 40px) and increase the timeout (800ms instead of 600ms).

Actually, simpler and more effective:

1. **Attach touch handlers to the whole container** (`h-[calc(100vh-80px)]`)
2. **On touchEnd**: Check if scroll container exists and is mid-scroll. If so, ignore. Otherwise, switch months based on swipe direction
3. **Remove the boundary check entirely** — instead, use a simple heuristic: if the swipe is fast (velocity > threshold), always switch months regardless of scroll position. This mimics how iOS card stacks work.
4. **Add `"← 三月"` button label** showing the current month name clearly (already done per code review)

### Specific changes to `StoryPage.tsx`:

1. **Move `onTouchStart`/`onTouchEnd` from the scroll div to the outer container** so swipes on stacked edges also work
2. **Change swipe logic**: Use velocity-based detection. If swipe velocity > 0.3px/ms AND distance > 30px, switch month regardless of scroll position. For slower swipes, keep boundary detection.
3. **Add visual "current month" indicator**: The `← {monthName}` button already exists. Ensure it shows the localized current month name.

### Files to modify:
- `src/components/StoryPage.tsx` — Touch handler restructure + velocity-based swipe detection

