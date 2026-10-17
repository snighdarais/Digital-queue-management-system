---
name: digital-queue-feature-integration
description: 'Use when integrating lecturer-requested features into this existing Digital Queue Management System website. Preserve the current implementation, design, and project structure; inspect existing code, resolve conflicts carefully, and validate each feature.'
argument-hint: 'Paste the supplied feature code and describe its expected behavior.'
---

# Digital Queue Feature Integration

## When to Use
Use this workflow when the user asks to add or adapt feature code for the existing Digital Queue Management System for Health Camps. This is maintenance of the current project, not a request to create a new site or project.

## Procedure

1. **Wait for the feature code.** If the user has not provided the code for the feature, make no application-file changes. Briefly ask them to send the code, then wait. Do not implement from a feature description alone or guess what the supplied code should do.

2. **Inspect the existing implementation first.** Once feature input is available, identify the relevant existing page, styles, scripts, and any connected backend or database code. Read the nearby code and call sites to understand how the current behavior works. Start with the named or currently edited file; do not map unrelated parts of the repository.

3. **Define a local integration hypothesis.** Identify the code path that controls the requested behavior, one likely conflict or compatibility concern, and one focused check that could show the hypothesis is wrong. Choose the smallest change that can test the behavior.

4. **Explain conflicts before adapting.** If the supplied code conflicts with existing names, structure, styling, DOM assumptions, dependencies, or behavior, explain the specific conflict and adapt the feature to the existing project conventions. Preserve existing behavior and avoid replacing whole files or rewriting the site.

5. **Integrate narrowly.** Modify only the necessary existing files. Retain the site's current design, layout, colors, navigation, working features, and project structure. Reuse existing functions, selectors, and styles when appropriate. Do not add a separate website or project.

6. **Validate each feature immediately.** After each feature integration, run the narrowest relevant test, build, lint, or browser check available. Check the new behavior and the nearby existing behavior it could affect. Fix regressions in the same slice and rerun the focused check. If automated checks are unavailable, perform a targeted manual check and say what was not verified.

7. **Close the loop.** Summarize what was integrated, which existing files changed, any conflict and its adaptation, and the checks and results. Mention any remaining uncertainty without claiming unverified behavior works.
