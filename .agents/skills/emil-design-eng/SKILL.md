---
name: emil-design-eng
description: Purposeful web motion and interaction polish when animation is requested or necessary for state continuity. Use the existing framework and honor accessibility and responsiveness.
---

# Purposeful motion

First decide whether motion communicates state, continuity, or feedback. Keep frequent actions immediate. Do not add motion merely because a library is installed.

Use existing CSS/framework transition primitives. Choose a library only if needed for the actual interaction and permitted by scope; verify dependencies before imports. Do not assume React hooks, Vue lifecycle APIs, or a particular animation engine.

- Match product timing: small feedback is often 100-200ms and panels 150-300ms. Choose easing by behavior; do not ban every standard curve.
- Specify transition properties instead of `transition: all`. Prefer transform/opacity for movement. Measure necessary layout effects; do not label every CSS animation GPU-safe.
- Keep transitions interruptible and controls usable; preserve focus and origin-aware popovers.
- Honor reduced motion by removing nonessential movement, loops, and stagger. Content remains accessible if reveal logic fails.
- Gate hover motion for suitable pointers; do not require hover on touch or force movement for keyboard actions.
- Clean up listeners, observers, timers, and animations using the project's lifecycle. Avoid per-frame application-state updates for decorative pointer effects.

Verify repeated input, reduced motion, touch, and navigation/unmount behavior. No mandatory scroll reveals, parallax, loops, or magnetic buttons.
