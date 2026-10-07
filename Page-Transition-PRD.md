Absolutely. For NoBadFonts, I’d define this as a **global navigation transition system**, not a loading component. The key requirement is that the transition layer owns the screen during navigation and only reveals the destination once it is ready.

# PRD — NoBadFonts Global Page Transition System

## 1. Overview

**Feature:** Global Page Transition

**Project:** NoBadFonts

**Platform:** React + Vite + React Router

**Purpose:**  
Create a consistent, branded transition between pages across the NoBadFonts application.

Instead of immediately replacing the current page when navigation occurs, a full-screen NoBadFonts transition panel will slide over the current page. The panel will remain visible while the destination route loads. Once the destination is ready, the panel slides away and reveals the new page.

### Core experience

```text
Current Page
     ↓
User navigates
     ↓
Transition panel slides IN
     ↓
Current page completely covered
     ↓
Destination route loads
     ↓
Destination is ready
     ↓
Transition panel slides OUT
     ↓
New Page revealed
```

The NoBadFonts logo/star remains visible during the transition, with the star continuously rotating.

---

# 2. Goals

### Primary goals

- Create a **global page transition** that works throughout NoBadFonts.
- Avoid implementing transition logic separately on every page.
- Use the existing NoBadFonts SVG as the transition's visual identity.
- Cover the current page before changing/revealing the destination page.
- Keep the transition panel visible while the destination is loading.
- Reveal the destination only when it is ready.
- Make navigation feel intentional and branded rather than like a generic browser route change.
- Keep the implementation reusable and maintainable.

### Secondary goals

- Support both user-triggered and programmatic navigation.
- Prevent accidental transition overlap when users navigate rapidly.
- Respect `prefers-reduced-motion`.
- Avoid interfering with scroll position or page layout.
- Keep the transition performant.

---

# 3. Non-goals

This feature is **not** intended to:

- Replace skeleton loaders inside individual pages.
- Replace API/data loading states.
- Animate every component when its state changes.
- Animate tabs, filters, sorting, modals, dropdowns, etc.
- Require developers to manually add transition logic to every `<Link>`.
- Display a transition for every tiny URL/state change.
- Add a permanent loading screen to the application.

The transition and data loading remain separate concepts.

---

# 4. User Experience

## 4.1 Initial state

The application behaves normally.

```text
┌─────────────────────────────┐
│                             │
│       CURRENT PAGE          │
│                             │
│                             │
└─────────────────────────────┘
```

The transition layer is either:

```text
display: none
```

or positioned outside the viewport.

---

# 5. Navigation Flow

When a user navigates from one page to another:

### Step 1 — Navigation initiated

Example:

```text
Home → Fonts
```

The current page remains visible.

The destination must **not immediately become visually visible**.

---

### Step 2 — Transition panel enters

The transition panel starts below the viewport:

```text
┌─────────────────────────────┐
│                             │
│       CURRENT PAGE          │
│                             │
│                             │
├─────────────────────────────┤
│                             │
│      TRANSITION PANEL       │
│                             │
└─────────────────────────────┘
```

Then it slides upward:

```text
translateY(100%)
        ↓
translateY(0)
```

until it completely covers the current page.

---

# 6. Transition Panel

The panel should be:

```tsx
position: fixed;
inset: 0;
```

with a very high z-index.

Conceptually:

```tsx
<div className="fixed inset-0 z-[9999]">
    ...
</div>
```

It must not occupy normal document space.

### Panel contents

The panel contains:

1. NoBadFonts SVG
2. Rotating star
3. Background using the application's `bg-background`
4. Foreground using `text-foreground`

Example:

```text
┌────────────────────────────────┐
│                                │
│                                │
│                                │
│              ◉                 │
│             ✦ ↻                │
│                                │
│                                │
│                                │
└────────────────────────────────┘
```

---

# 7. Logo Animation

The SVG consists of two paths.

### Path 1

The main NoBadFonts shape.

This remains stationary.

### Path 2

The star.

This rotates continuously.

```text
Main logo     → stationary
Star          → rotating
```

The star should use:

```css
transform-origin: 113.5px 113px;
```

and:

```css
animation: spin 2s linear infinite;
```

The rotation should continue while the transition panel is covering the screen.

---

# 8. Transition Out

Once the destination page is ready:

```text
translateY(0)
      ↓
translateY(-100%)
```

The panel slides upward and reveals the destination page underneath.

Final state:

```text
┌─────────────────────────────┐
│                             │
│       NEW PAGE              │
│                             │
│                             │
└─────────────────────────────┘
```

The transition component returns to its idle state.

---

# 9. Complete Timeline

Recommended timing:

```text
0ms
│
├── User clicks navigation
│
├── 0–450ms
│   Panel covers current page
│
├── ~450ms
│   Current page completely covered
│
├── Route transition
│
├── 450ms–X
│   Panel remains visible
│   Star continues rotating
│
├── Destination becomes ready
│
├── X–800ms
│   Panel slides away
│
└── Destination fully visible
```

### Important

The transition should **not artificially wait a fixed amount of time** before revealing the destination.

Bad:

```text
wait 2 seconds
→ reveal
```

Good:

```text
wait until destination ready
→ reveal
```

A minimum animation duration may be used to prevent extremely fast flashes, but it should not create unnecessary waiting.

---

# 10. Architecture

The feature should be centralized.

Recommended structure:

```text
src/
├── components/
│   └── transitions/
│       └── PageTransition.tsx
│
├── styles/
│   └── transition.css        optional
│
├── App.tsx
└── router/
    └── ...
```

Only the transition component owns the animation.

Pages should not contain transition code.

---

# 11. Component Responsibilities

## `PageTransition.tsx`

Responsible for:

- detecting navigation
- controlling transition state
- rendering the overlay
- starting the cover animation
- coordinating route changes
- detecting destination readiness
- starting reveal animation
- handling rapid navigation
- handling reduced-motion preferences
- cleaning up animation state

---

# 12. Transition State Machine

Use explicit states rather than scattered booleans.

Recommended:

```ts
type TransitionState =
  | "idle"
  | "covering"
  | "covered"
  | "revealing";
```

### State flow

```text
             navigation
                 │
                 ▼
              COVERING
                 │
                 │ panel reached 100%
                 ▼
              COVERED
                 │
                 │ destination ready
                 ▼
             REVEALING
                 │
                 │ animation complete
                 ▼
                IDLE
```

---

# 13. State Definitions

### `idle`

No transition is happening.

```text
Overlay hidden
```

---

### `covering`

The panel is moving over the current page.

```text
translateY(100%)
        ↓
translateY(0)
```

---

### `covered`

The panel completely covers the viewport.

```text
translateY(0)
```

The star continues rotating.

The destination page may be rendering/loading underneath.

---

### `revealing`

Destination is ready.

Panel moves away:

```text
translateY(0)
        ↓
translateY(-100%)
```

---

# 14. Destination Readiness

This is the most important architectural detail.

The transition system needs a reliable definition of:

> "The next page is finished loading."

There are two possible approaches.

## Preferred approach

Use React Router's navigation/loading state where available.

Conceptually:

```ts
navigation.state === "idle"
```

means the router has finished its navigation work.

---

## If pages load data manually

For pages that do something like:

```tsx
useEffect(() => {
    fetchFont();
}, []);
```

router idle does **not necessarily mean the page's own data is ready**.

In that case, introduce a small readiness mechanism.

Example:

```tsx
usePageReady(!loading);
```

The page can notify the global transition system:

```text
FontDetails
     │
     ├── loading = true
     │       ↓
     │   page not ready
     │
     └── loading = false
             ↓
         page ready
```

The transition should reveal only after both:

```text
Route ready
+
Page ready
```

---

# 15. Navigation Sources

The system should support:

### Internal `<Link>`

```tsx
<Link to="/fonts">
```

### Programmatic navigation

```tsx
navigate("/fonts");
```

### Navbar

```text
Home
Fonts
Moods
Boards
```

### Cards

```text
FontCard
BoardCard
MoodCard
```

### Browser navigation

```text
Back
Forward
```

Where technically practical, these should use the same transition system.

---

# 16. Do Not Add This Everywhere

Avoid this architecture:

```tsx
<Link onClick={startTransition}>
```

on every link.

That would create:

- duplicated logic
- inconsistent behavior
- missed links
- maintenance problems
- bugs with programmatic navigation

Instead, the transition should live at the router/application level.

---

# 17. Layout

The transition panel should use:

```tsx
fixed
inset-0
```

rather than:

```tsx
w-screen
h-screen
```

as the primary positioning mechanism.

Recommended:

```tsx
<div className="fixed inset-0 z-[9999] ...">
```

This guarantees that it covers the viewport regardless of:

- page height
- scroll position
- current layout
- content size

---

# 18. Animation

## Panel

Recommended easing:

```css
cubic-bezier(0.76, 0, 0.24, 1)
```

This gives the panel a deliberate, smooth movement.

Recommended duration:

```text
400–500ms
```

---

## Star

The star should use constant rotation:

```css
linear
```

Recommended:

```text
2 seconds / rotation
```

```css
animation: spin 2s linear infinite;
```

The star should not use the same easing as the panel.

---

# 19. Visual Design

### Panel

```tsx
bg-background
text-foreground
```

This allows the transition to automatically follow the NoBadFonts theme.

### SVG

```tsx
fill="currentColor"
```

No hardcoded colors.

This ensures:

```text
Light mode → correct foreground
Dark mode  → correct foreground
Custom theme → correct foreground
```

---

# 20. Rapid Navigation

Users may click multiple links quickly.

Example:

```text
Home
 ↓
Fonts
 ↓
Moods
 ↓
Boards
```

The transition system must prevent multiple overlays from stacking.

There should always be **one transition controller**.

Possible strategy:

```text
Transition active
      ↓
new navigation
      ↓
update destination
      ↓
continue current transition
```

Do not start another panel animation on top of the existing panel.

---

# 21. Same-Page Navigation

Not every navigation should trigger the full transition.

Examples that may not need the transition:

```text
/font/megora?style=bold
/font/megora#license
```

depending on the application's routing semantics.

The transition system should trigger primarily for actual page-level navigation.

---

# 22. Scroll Position

The transition itself should not interfere with scroll position.

When navigation happens:

```text
Current page
    ↓
panel covers screen
    ↓
destination navigation
    ↓
destination scroll position handled normally
```

The transition layer should not manipulate scroll unless explicitly required by the router.

---

# 23. Accessibility

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

For users who prefer reduced motion:

```text
No sliding animation
No continuous star rotation
```

Instead:

```text
navigation
↓
short/simple opacity transition
↓
destination
```

Or transition immediately.

The feature should never make navigation inaccessible.

---

# 24. Performance Requirements

The transition must use GPU-friendly properties.

Preferred:

```css
transform
opacity
```

Avoid animating:

```css
top
left
width
height
margin
padding
```

The main panel animation should therefore use:

```css
transform: translateY(...)
```

rather than changing its position.

---

# 25. Loading Failure

If the destination page fails to load its data:

```text
Panel remains visible indefinitely
```

must **not** happen.

There should be a failure/timeout strategy.

For example:

```text
Destination loading
       ↓
normal loading state
       ↓
error
       ↓
reveal page
       ↓
page displays its error UI
```

The transition should not hide an error forever.

---

# 26. Error Handling

The transition controller should have a maximum safety timeout.

Example:

```text
Maximum covered state
≈ 5–10 seconds
```

If the destination never reports readiness:

```text
force reveal
```

This prevents the entire application from appearing frozen.

The exact timeout should be configurable rather than hardcoded throughout the codebase.

---

# 27. Mobile

The transition must work on:

- desktop
- tablet
- mobile

The SVG should scale responsively.

Example:

```tsx
className="w-20 h-20 sm:w-24 sm:h-24"
```

The panel remains:

```tsx
fixed inset-0
```

---

# 28. Theme Compatibility

The transition must use existing NoBadFonts design tokens.

Do not introduce a separate transition color system.

Use:

```tsx
bg-background
text-foreground
```

This means the transition automatically works with:

- light mode
- dark mode
- custom themes
- future theme changes

---

# 29. Files

### Required

```text
src/components/transitions/PageTransition.tsx
```

### Potentially required

```text
src/styles/transition.css
```

Only create this if the animation cannot be cleanly handled using the existing Tailwind setup.

### Modified

One of:

```text
src/App.tsx
```

or:

```text
src/router/index.tsx
src/routes/index.tsx
```

depending on the existing NoBadFonts architecture.

---

# 30. Acceptance Criteria

The feature is complete when:

- [ ] Navigating between major pages triggers the transition.
- [ ] Current page remains visible while the panel enters.
- [ ] Panel completely covers the current page.
- [ ] Destination is not visually revealed prematurely.
- [ ] NoBadFonts SVG appears in the center of the panel.
- [ ] Main SVG shape remains stationary.
- [ ] Star continuously rotates.
- [ ] Star rotation continues while waiting for destination readiness.
- [ ] Destination page loads underneath the panel.
- [ ] Panel remains visible until destination is ready.
- [ ] Panel slides away after destination readiness.
- [ ] New page is revealed smoothly.
- [ ] Transition works across the application's major routes.
- [ ] No individual page needs custom transition code.
- [ ] No individual `<Link>` needs custom transition code.
- [ ] Programmatic navigation is supported.
- [ ] Rapid navigation does not create multiple transition layers.
- [ ] Transition does not affect document layout.
- [ ] Transition works on mobile.
- [ ] Transition works in dark/light themes.
- [ ] `prefers-reduced-motion` is respected.
- [ ] A failed/stuck page cannot leave the transition covering the application forever.
- [ ] Browser back/forward navigation is handled appropriately.

---

# 31. Recommended Implementation Order

### Phase 1 — Component

Create:

```text
PageTransition.tsx
```

Implement:

```text
idle
→ covering
→ covered
→ revealing
→ idle
```

---

### Phase 2 — Visual transition

Implement:

```text
Panel enters from bottom
        ↓
Panel covers screen
        ↓
Panel exits through top
```

Add the SVG.

Add rotating star.

---

### Phase 3 — Router integration

Connect the component to the application's router/navigation state.

---

### Phase 4 — Destination readiness

Connect:

```text
router readiness
+
page/data readiness
```

so the panel doesn't disappear before the destination is actually usable.

---

### Phase 5 — Edge cases

Handle:

- rapid navigation
- browser back
- browser forward
- navigation errors
- slow API requests
- failed requests
- reduced motion

---

### Phase 6 — Polish

Tune:

```text
cover duration
reveal duration
easing
star rotation speed
SVG size
z-index
mobile sizing
```

---

# 32. Final Architecture

The intended architecture should end up roughly like this:

```text
                    NoBadFonts App
                          │
                    ┌─────▼─────┐
                    │   Router  │
                    └─────┬─────┘
                          │
                 ┌────────▼────────┐
                 │  PageTransition │
                 └────────┬────────┘
                          │
             ┌────────────┴────────────┐
             │                         │
       Routed Content            Transition Layer
             │                         │
     ┌───────┼────────┐          ┌────▼────┐
     │       │        │          │   SVG   │
    Home   Fonts    Boards       │  ✦ ↻    │
                                └─────────┘
```

**The important design principle:** the transition is a **global visual layer around your routing system**, not a component that individual pages have to know about.

That will give NoBadFonts one consistent navigation identity instead of 10 different page-loading animations.