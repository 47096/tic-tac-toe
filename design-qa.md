# Design QA — Option 1 (editorial paper)

- **source visual truth path:** `generated-1790044844893.png` (selected ideation option 1)
- **implementation screenshot path:** *missing — browser capture of the local preview was not available in this run*
- **viewport:** 390 × 844 (mobile-first)
- **state:** title / home, light paper theme
- **full-view comparison evidence:** source mock opened; implementation reviewed in `index.html` + `css/game.css` at matching content structure. Side-by-side pixel compare not performed without an implementation screenshot.
- **focused region comparison evidence:** not run (same blocker).

## Findings

- [P2] Home hierarchy vs mock
  Location: `#title-screen`
  Evidence: mock wants one dominant primary; implementation now uses `btn-hero` for Play Local and quiet secondaries — direction match, pixel fidelity unverified.
  Impact: first-screen clarity.
  Fix: after a browser capture, tune hero min-height / lede measure if drift remains.

- [P2] Type scale
  Location: `h1`, `.subtitle`, `.title-lede`
  Evidence: mock shows a calm display wordmark + quiet support line; implementation raises h1 to 2rem and adds lede/note.
  Impact: editorial feel of option 1.
  Fix: confirm optical tracking on device.

- [P1] Implementation screenshot missing
  Location: design-qa process
  Evidence: cannot place source and rendered UI in one comparison input.
  Impact: fidelity cannot be signed off.
  Fix: capture title at 390×844 from the served preview and re-run QA.

## Comparison history

1. First pass: structural + token alignment to option 1 (paper `#f7f4ef`, violet primary only on hero CTA, result sheet raised). No second visual iteration yet — blocked on rendered capture.

## Implementation checklist

1. Capture `index.html` title at 390×844
2. Compare with `generated-1790044844893.png` side by side
3. Adjust spacing/type if P1/P2 drift remains
4. Re-check picker and result sheet states

## Follow-up polish

- Featured emoji shortcuts on first picker screen
- Soft paper grain if it stays lightweight

**final result:** blocked
**blocker:** no browser-rendered implementation screenshot for side-by-side comparison
