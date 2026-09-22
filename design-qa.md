# Design QA — Option 1 (editorial paper)

- **source visual truth path:** `generated-1790044844893.png` (selected option 1)
- **implementation screenshot path:** `design-qa-assets/impl-title-390.png` (live Pages, 390×844)
- **comparison path:** `design-qa-assets/compare-phones.png` (source | impl)
- **viewport:** 390 × 844
- **state:** title / home, light paper theme

## Full-view comparison

Source mock is 1024×1024; implementation is 390×844. Tonal balance is close (impl lighter/emptier — expected: live UI has less decorative ink than a marketing mock).

## Focused checks (pixels)

- **Colors:** bg samples `(247,244,239)` = `#f7f4ef` paper — matches tokens. Hero CTA band `(124,111,222)` = `#7c6fde` violet — matches `--accent-primary`.
- **Layout bands:** content in y≈160–660 (wordmark → lede → mode stack → note). Bottom whitespace matches calm editorial density.
- **Typography / copy:** Play Local hero + quiet secondaries + trust note present in live HTML.
- **Spacing:** single-column stack, max-width ~17.5rem, consistent with mock intent.

## Findings

- [P2] Mock is square marketing art vs phone UI — some decorative density will never match 1:1. Acceptable.
- [P2] Impl reads slightly lighter/emptier than mock (mean luminance 236 vs 220). Optional: soft paper grain or denser logo mark.
- [P3] Result sheet / picker states not captured in this pass (title-only).

## Comparison history

1. Aligned tokens, type, CTA hierarchy, result sheet to option 1 → deployed `e740d81`.
2. Live capture 390×844: paper + violet hero confirmed via pixel samples; no P0/P1 layout break.

## Implementation checklist

- [x] Paper tokens + type scale
- [x] Hero primary CTA (Play Local)
- [x] Quiet secondary modes
- [x] Trust copy
- [x] Warmer result sheet
- [ ] Optional P2 polish (grain / denser mark)

**final result:** passed
