---
name: runtime-branding
description: Preserve brand identity, tokens, assets, and configured themes during web UI work. Respect tenant runtime settings where present without imposing multi-tenancy on single-brand projects.
---

# Brand and theme contracts

Trace colors, fonts, assets, semantic roles, and theme selection to existing tokens, stylesheets, providers, CMS/API settings, or brand guidelines. Preserve precedence/loading; do not invent tokens, aliases, or a runtime branding system.

## Existing projects

- Reuse the project's real color/font/surface/spacing/radius tokens and component variants. Trace aliases, consumers, and cascade before editing; avoid self-referencing aliases and untraced specificity overrides.
- Where values are runtime-configurable, keep dependent states runtime-aware. Do not compile a current tenant snapshot into Sass/build-time constants or copy merchant colors/fonts from screenshots into source.
- Brand primary/secondary colors, theme neutral surfaces, and semantic feedback colors have different roles. Do not force one accent or recolor every surface with primary. Static neutral/semantic defaults are valid when intentional.
- Keep brand font families and loading mechanisms. Tune scale/weight/wrapping instead of banning common fonts or serif. Check language glyph support and different font metrics where configurable.
- Preserve real assets/content and existing translation/currency formatting. Do not invent customer claims, product data, testimonials, or policies to improve a composition.

For multiple themes/tenants, preserve their distinct layout/shape/density language and test affected configurations. For a single-brand app, use its existing identity; do not add tenant abstractions or unnecessary theme switching.

## New projects

Use supplied assets/constraints or propose a provisional direction and semantic token roles. Label sample content. Build only the configuration flexibility requested.

## Verify changed states

Check actual foreground/background and focus contrast in normal, hover, active, and disabled states after transitions. An on-primary token or fixed color mix is not proof of readability. Trace translucent/gradient backgrounds; report uncertain results as unverified.

When configurable, check alternate light/dark or saturated brand colors, font metrics, and absent settings. Fix local foreground/surface treatment without rewriting upstream brand values. Test supported display modes; do not add a new mode as incidental polish.
