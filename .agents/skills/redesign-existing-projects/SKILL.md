---
name: redesign-existing-projects
description: Audit, plan, implement, or review focused improvements to existing web UI while preserving identity, stack, data, and business behavior. Use for explicit redesign or vertical polish.
---

# Existing UI redesign

Use in mode B for the requested audit, plan, implementation, or review; audit alone does not authorize edits.

## Establish the baseline

Inspect the actual page, components, styling entry/partials, tokens, dependencies, and shared consumers. Follow project-required code exploration tools when available; do not assume a specific indexing service or project path exists.

Capture the current page when possible. Record user task, hierarchy, density, grid, type, imagery, shapes, responsiveness, and identity to preserve. Separate usability defects from visual opportunities. Old reports do not prove current source.

## Improve within scope

Choose a small set of changes tied to the observed issues. Prioritize hierarchy, alignment, spacing, contrast, and responsive constraints before effects. Use the existing framework, styling method, dependencies, fonts, and components. Do not migrate the stack to match an example.

Prefer theme/page/component-local changes. Trace shared impact and state the reason before editing global styles or shared components. Preserve routes, API contracts, state ownership, form validation/submit lifecycle, analytics hooks, i18n, and real content. DOM changes are allowed within an authorized redesign without altering business behavior.

Fix root layout constraints using normal flow, flex/grid, and content-responsive sizing. Avoid accumulated offsets, arbitrary reserves, or global overflow hiding to mask defects. Preserve legitimate existing dimensions; do not treat every fixed value as a bug.

## Verify and stop

Compare equivalent viewport/data states before and after. Check relevant mobile/desktop sizes, long labels, sparse/dense data, missing assets, configurable branding, and key interactions. Scope shared regression coverage to actual affected consumers/themes and report gaps.

Run appropriate existing checks/builds. Reuse valid evidence; broaden testing only for unresolved risk. Stop once scope is satisfied. Do not reopen accepted polish solely for optional spacing/shadow preferences without new regression evidence.
