# Project

Mote is a minimal, local-first Markdown note app. Product requirements and current scope live in `docs/Project_Spec.md`.

Keep this file focused on reusable technical context and durable implementation decisions that are easy to accidentally regress. Do not copy product requirements or use it as a changelog. General setup and contribution guidance belong in `README.md` and `CONTRIBUTING.md`.

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

## Core architecture and data

- Markdown is the source of truth. Rendered HTML, highlighted code and Mermaid output are derived data.
- Preserve native browser editing behavior. Do not replace the `<textarea>` with `contenteditable`, a rich-text document model or an editor framework without a confirmed product need.
- Keep the architecture small. Add dependencies or abstractions only when the current implementation has a demonstrated limitation.
- Keep Mote local-first. Note content must not be uploaded, remotely logged or sent to an external service by default.
- Preserve existing user data when changing IndexedDB schemas, imports or backup formats.
- Sanitize rendered Markdown before inserting it into the Preview DOM. A render failure must never alter Markdown source.
- Fixed typography and the existing visual language are product decisions, not settings to expand casually.
- Prefer focused changes and reuse existing modules, styles and interaction patterns before introducing new ones.

## Preview and Markdown scroll sync

- Preview and Markdown are separate views that share `.document-main` as the scroll container.
- When switching views, preserve the Markdown source line nearest the top of the viewport, not a percentage of document height or a raw pixel offset.
- Preview blocks carry `data-source-line` metadata. Tables map individual rows and lists map individual items where possible because rendered heights can differ significantly from Markdown source.
- Restore the target position once after the destination view is ready. Do not continuously correct scroll with a long-lived `MutationObserver`, timer or repeated percentage restore.
- If the user starts scrolling or touching before a pending restore runs, user input wins and the pending restore should be cancelled.
- View switching must not interfere with native input scrolling, selection, typing or textarea resize behavior.

## Markdown editor typing stability

- While the Markdown editor is focused, typing, composition and paste must not make the document viewport jump unexpectedly.
- `resizeMarkdownEditor()` must not set the focused Markdown textarea to `height: auto`. While focused, it is grow-only: use the textarea's current height plus actual `scrollHeight - clientHeight` overflow when more room is needed.
- Full height recalculation with `height: auto` is allowed only when the textarea is not focused or when explicitly forced after focus leaves. This lets large deletes/cuts shrink the editor after blur without destabilizing the active typing viewport.
- Mobile `window.resize` events can be caused by the software keyboard. They must use the same grow-only path while the editor remains focused rather than collapsing and remeasuring the live textarea.
- Do not restore `.document-main.scrollTop` after normal typing or paste, and do not add input-time scroll correction in `src/interactions.js`. Delayed scroll correction can fight Safari/iOS caret behavior.
- Do not solve typing scroll bugs with long-lived observers, repeated timers or continuous scroll correction. Native caret visibility and direct user scrolling take priority.
- Clipboard, selection, caret, textarea auto-resize and mobile keyboard behavior are especially regression-prone on Safari/iOS and should be manually verified when touched.

## Mobile Group actions

- On mobile (`<= 760px`), a normal tap on a Group folder opens the Group.
- Long press on the Group folder opens the existing Group action menu. Do not add a permanently visible ellipsis beside the folder on mobile.
- Long press should be cancelled when pointer movement indicates the user is scrolling.
- Reuse the existing Rename, Delete group and Delete group with notes actions instead of creating separate mobile-only delete logic.

## Group dialog keyboard behavior

- Save is the only submit action in the Group dialog.
- Cancel is a normal button, not a submit button.
- Pressing Enter after entering a Group name should create the Group or save a rename. Clicking Cancel should close without saving.

## Group deletion semantics

- `Delete group` removes the Group and moves its notes to Inbox.
- `Delete group and notes` removes the Group and moves its notes to Trash.
- Keep these two behaviors distinct.

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
- Update this file only when new technical context or a durable decision is likely to help future tasks. Do not record trivial implementation history.

For editor or Group interaction changes near the decisions above, manually verify as relevant:

- Preview <-> Markdown switching in a long note, especially with a table near the top of the viewport.
- Immediate manual scroll after switching is not pulled back.
- On mobile Markdown editing, type in the middle of a long note and paste several lines; the viewport should stay stable while the caret remains visible.
- On mobile Markdown editing, delete/cut a large amount of text; while focused the editor may remain tall, then it should recalculate after focus leaves.
- Mobile Group tap opens the Group, long press opens actions and finger movement still scrolls normally.
- Enter saves both Create Group and Rename Group dialogs, while Cancel does not save.
