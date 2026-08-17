# Contributing to Mote

Thanks for helping improve Mote.

Mote is intentionally small. Contributions should improve reliability or a proven user need without turning the project into a general-purpose editor framework.

## Development setup

```bash
npm install
npm run dev
```

Before submitting a change:

```bash
npm run check
npm test
npm run build
```

## Engineering principles

1. Markdown is the source of truth.
2. Prefer native browser behavior before adding an abstraction.
3. Keep Markdown editing on the native `<textarea>` unless there is strong evidence that it can no longer meet a real requirement.
4. Do not introduce `contenteditable` or a rich-text document model as a shortcut.
5. Do not add a UI framework unless the current architecture has a measured problem that the framework solves.
6. Do not add a dependency for behavior that can be implemented safely in a small amount of code.
7. Keep local-first behavior. Note content must not be sent to a server by default.
8. Preserve existing data when changing IndexedDB schemas or backup formats.
9. Fixed typography is part of Mote's design. Do not reintroduce an Editor Font setting without a product decision.
10. Keep animations subtle and functional.

## Editor changes

Selection, clipboard and Markdown formatting are high-risk areas.

Any change to formatting behavior should test at least the affected cases among:

- collapsed caret
- selected text
- multiple selected lines
- link labels and URLs
- inline code
- fenced code blocks
- copy/paste behavior

Formatting helpers should remain pure where possible so they can be tested without a browser UI.

## Pull requests

Keep a pull request focused on one problem.

Include:

- what changed
- why it changed
- how it was tested
- screenshots only when the UI changed materially

Do not include generated `dist/` or `node_modules/` files.

## Bug reports

For editor bugs, include:

- browser and operating system
- desktop or mobile
- exact Markdown sample if relevant
- selection/caret state before the action
- expected behavior
- actual behavior

Small reproducible cases are more useful than large note exports.
