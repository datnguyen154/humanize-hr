---
name: design-taste-frontend
description: Route web UI audit, planning, implementation, and review to scoped additions, existing UI redesign, or new UI creation. Detect and respect the project's actual stack.
---

# UI dispatcher

Read project instructions and the brief. Identify source root, framework, rendering model, styling, dependencies, components, tokens, and languages. Do not assume a stack, source path, or theme count. Planning-only requests do not authorize application edits.

State mode, surfaces, and outcome. Load only routed skills; scope/contracts override taste.

## A. Additions / Shared UI sync

For adding components, missing states, or shared capabilities, load [branding](../runtime-branding/SKILL.md) and the Minimal checklist in [web guidelines](../web-design-guidelines/SKILL.md).

Preserve surrounding layout, hierarchy, spacing, cards, navigation, and established behavior. Match the added component to each surface's visual language. Make only local integration changes needed to avoid overlap or overflow. Share behavior where appropriate without making every theme visually identical. Do not load redesign/visual skills for incidental polish.

## B. Existing UI redesign / Vertical polish

For requested deeper improvements, load [redesign](../redesign-existing-projects/SKILL.md), [branding](../runtime-branding/SKILL.md), [visual quality](../high-end-visual-design/SKILL.md), and [web guidelines](../web-design-guidelines/SKILL.md). Apply them during audit/planning and review as well as implementation. Preserve identity unless a new direction is requested.

## C. New project / New UI

Use [branding](../runtime-branding/SKILL.md), [visual quality](../high-end-visual-design/SKILL.md), and [web guidelines](../web-design-guidelines/SKILL.md). Establish audience, primary task, content, and visual direction before implementation. Honor a specified stack; if absent, choose a proportionate stack and state the choice. Do not run an existing-UI audit where no baseline exists. Follow existing architecture when adding a new page to an established app.

## Conditional detail and verification

Load [motion](../emil-design-eng/SKILL.md) only for requested motion or necessary state continuity. Existing hover/focus treatment alone does not require it.

For mixed tasks, route per surface. Preserve current UI if scope is unclear. No automatic dependencies, display modes, or decoration.

Preserve real data, business logic, navigation, i18n, accessibility, and unrelated work. Trace shared consumers. Complete behavior without placeholders; keep temporary fixtures out of production fallbacks.

Verify within the task using appropriate checks and rendered states. Report scope, evidence, and limits. Do not create a separate acceptance project or claim visual success from source alone. Target 2,000-3,000 skill tokens for B, excluding source/brief/project context.
