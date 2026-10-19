---
name: web-design-guidelines
description: Verify web accessibility, responsive behavior, and UI states. Use minimal checks for additions and expanded checks for redesign or new UI, independent of framework.
---

# Web UI checks

## Minimal checklist: additions

- Correct button/link semantics, accessible names, keyboard activation, visible focus, and comfortable touch targets; no hover-only action.
- Readable text/control/focus contrast with actual branding and backgrounds; color alone does not convey state.
- No overlap, clipped labels, unwanted horizontal overflow, or obscured content at relevant mobile/desktop sizes and long labels. Preserve surrounding layout.
- Relevant loading, empty, disabled/busy, and error behavior; preserve navigation, forms, and business actions. Verify actual state changes, not just click completion.

## Expanded checklist: redesign and new UI

Also inspect heading/read order, meaningful image alternatives, form labels/errors, overlay focus handling, zoom/reflow, sticky obstruction, and reduced-motion behavior. Check sparse/dense data and missing assets where relevant. Use the project's i18n if present; do not add an i18n system solely for polish.

Use WCAG AA contrast criteria appropriate to text size and UI role. Aim for comfortable targets around 44px where feasible, without misrepresenting that value as a universal AA requirement. Do not remove global outlines, blur focused controls, or hide overflow to conceal layout defects.

This local checklist works offline. For an explicitly requested full Web Interface Guidelines audit, fetch https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md when tools allow; report if unavailable and interpret within project scope.

Report useful file/line evidence and distinguish source inspection, rendered verification, and unverified cases. Do not claim exhaustive compliance from a narrow check.
