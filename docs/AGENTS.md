# Project

Mote is a minimal, local-first Markdown note app. Product requirements and current scope live in `docs/Project_Spec.md`.

Keep this file focused on reusable technical context. Do not copy product requirements or use it as a changelog.

# Tech

- HTML, CSS and Vanilla JavaScript.
- Vite is the development and build tool, not an application framework.
- Markdown editing uses a native `<textarea>`.
- IndexedDB stores notes, groups and persisted settings.
- `localStorage` is used only for lightweight layout preferences such as pane widths.
- Markdown Preview uses Marked, DOMPurify, highlight.js and Mermaid.
- PWA behavior uses `manifest.webmanifest` and `sw.js`.
- Static hosting is Cloudflare Pages.

Important source areas:

- `src/app.js`: main UI state and feature orchestration.
- `src/db.js`: IndexedDB persistence and backup transactions.
- `src/format.js`: Markdown selection transforms. Keep helpers pure where practical.
- `src/markdown.js`: Markdown Preview pipeline.
- `src/features.js`, `src/interactions.js`, `src/tasks.js` and related files: feature and interaction logic split out of the main app.
- `src/browser-compat.js`: browser/mobile compatibility fixes. Review this before changing dialogs, mobile toolbar menus, service worker refresh or related behavior.
- `test/`: unit and regression tests.

# Commands

```bash
npm install
npm run dev
npm run check
npm test
npm run build
```

Use the checks relevant to the change. Do not automatically run every check for a small change that can be verified safely with a narrower check or manual test. Run broader checks when the change affects shared logic, persistence, build behavior or other high-risk areas.

# Decisions

- Markdown is the source of truth. Rendered HTML, highlighted code and Mermaid output are derived data.
- Preserve native browser editing behavior. Do not replace the `<textarea>` with `contenteditable`, a rich-text document model or an editor framework without a confirmed product need.
- Keep the architecture small. Add dependencies or abstractions only when the current implementation has a demonstrated limitation.
- Keep Mote local-first. Note content must not be uploaded, remotely logged or sent to an external service by default.
- Preserve existing user data when changing IndexedDB schemas, imports or backup formats.
- Sanitize rendered Markdown before inserting it into the Preview DOM. A render failure must never alter Markdown source.
- Fixed typography and the existing visual language are product decisions, not settings to expand casually.
- Prefer focused changes and reuse existing modules, styles and interaction patterns before introducing new ones.

# Known Issues

- Safari/iOS previously failed to render some self-hosted SVG icons when the sprite relied on internal SVG styles. Keep icon changes compatible with Safari/iOS and manually verify them when relevant.
- Menus and toolbar popovers have previously been clipped by scroll containers, especially on mobile. Compatibility handling exists in `src/browser-compat.js`; do not remove or bypass it without testing the affected layouts.
- Editor selection, caret, clipboard, auto-resize and scroll behavior are regression-prone. Changes in these areas should preserve native browser behavior and use focused regression tests when practical.
- `docs/Project_Spec.md` still labels the release as v1.0.0 while the package and changelog are at v1.0.1. Treat the current code and `CHANGELOG.md` as additional evidence of shipped behavior until the spec is synchronized.

# Before completing a task

- Review `docs/Project_Spec.md`, this file and the code related to the change before editing.
- Verify the changed behavior at a level proportional to its risk.
- If an automated check fails because of the change, fix it before reporting completion.
- Review the final diff for unintended changes.
- Report checks actually run, manual verification performed and anything that could not be verified.
- Update `docs/Project_Spec.md` only when the product requirement intentionally changes.
- Update this file only when new technical context is likely to help future tasks. Do not record trivial implementation history.
