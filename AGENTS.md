# AGENTS.md

Keep this file focused on durable implementation decisions that are easy to accidentally regress. General project setup and contribution guidance belong in `README.md` and `CONTRIBUTING.md`.

## Important decisions

### Preview and Markdown scroll sync

- Preview and Markdown are separate views that share `.document-main` as the scroll container.
- When switching views, preserve the Markdown source line nearest the top of the viewport, not a percentage of document height or a raw pixel offset.
- Preview blocks carry `data-source-line` metadata. Tables map individual rows and lists map individual items where possible because rendered heights can differ significantly from Markdown source.
- Restore the target position once after the destination view is ready. Do not continuously correct scroll with a long-lived `MutationObserver`, timer, or repeated percentage restore.
- If the user starts scrolling or touching before a pending restore runs, user input wins and the pending restore should be cancelled.
- Preserve the existing Markdown typing scroll stabilization in `src/interactions.js`; view switching must not interfere with selection, typing, or textarea resize behavior.

### Mobile Group actions

- On mobile (`<= 760px`), a normal tap on a Group folder opens the Group.
- Long press on the Group folder opens the existing Group action menu. Do not add a permanently visible ellipsis beside the folder on mobile.
- Long press should be cancelled when pointer movement indicates the user is scrolling.
- Reuse the existing Rename, Delete group, and Delete group with notes actions instead of creating separate mobile-only delete logic.

### Group dialog keyboard behavior

- Save is the only submit action in the Group dialog.
- Cancel is a normal button, not a submit button.
- Pressing Enter after entering a Group name should create the Group or save a rename. Clicking Cancel should close without saving.

### Group deletion semantics

- `Delete group` removes the Group and moves its notes to Inbox.
- `Delete group and notes` removes the Group and moves its notes to Trash.
- Keep these two behaviors distinct.

## Verification

Before completing editor or Group interaction changes, run:

```bash
npm run check
npm test
npm run build
```

For changes near the decisions above, also manually verify:

- Preview <-> Markdown switching in a long note, especially with a table near the top of the viewport.
- Immediate manual scroll after switching is not pulled back.
- Mobile Group tap opens the Group, long press opens actions, and finger movement still scrolls normally.
- Enter saves both Create Group and Rename Group dialogs, while Cancel does not save.
