# Mote - Release Steps

This document is the source of truth for releasing future Mote versions manually or asking an AI assistant to do the release work.

Current release line starts at `v1.0.0`.

## 1. Choose the next version

Mote follows Semantic Versioning:

```text
PATCH: 1.0.0 -> 1.0.1
Small fixes, polish, bug fixes.

MINOR: 1.0.1 -> 1.1.0
New backward-compatible features.

MAJOR: 1.1.0 -> 2.0.0
Breaking changes or a major product/architecture change.
```

For most maintenance releases, use a PATCH version.

## 2. Keep CHANGELOG.md updated during development

New work should go under `Unreleased` first.

Example:

```md
## [Unreleased]

### Added

- Added note duplication.

### Fixed

- Fixed toolbar popup on iPhone.
- Fixed PDF table overflow.
```

When the version is ready to release, move those entries into a dated version section and reset `Unreleased`.

Example for `v1.0.1`:

```md
## [Unreleased]

No unreleased changes yet.

## [1.0.1] - 2026-08-25

### Added

- Added note duplication.

### Fixed

- Fixed toolbar popup on iPhone.
- Fixed PDF table overflow.
```

Keep the changelog factual and concise. It should describe what changed in the product, not the implementation history of every commit.

## 3. Bump package.json

Edit the version manually in `package.json`.

Example:

```json
{
  "version": "1.0.1"
}
```

Do not create the Git tag yet. The tag should only be created after the release changes are merged and verified on `main`.

## 4. Create release notes

Create:

```text
.github/releases/v<version>.md
```

Example:

```text
.github/releases/v1.0.1.md
```

Recommended structure:

```md
# Mote v1.0.1

Short summary of this release.

## Highlights

- Main user-visible improvement.
- Another important improvement.

## Fixes

- Important bug fix.
- Another bug fix.

## Try Mote

https://mote.namnth.com

## Notes

- Any compatibility or browser limitation worth mentioning.
```

`CHANGELOG.md` is the technical release history. Release notes are written for users and do not need to repeat every changelog entry.

## 5. Run release validation

Before creating the release PR, run:

```bash
npm install
npm run check
npm test
npm run build
```

All commands must pass.

Then smoke test the app, especially the areas changed by the release.

Minimum smoke test:

- Create and edit a note.
- Reload and confirm persistence.
- Switch between Markdown and Preview.
- Test interactive task checkboxes.
- Test the formatting toolbar.
- Test import/export if touched by the release.
- Test one desktop browser.
- Test iPhone/Safari when UI, editor, PWA, icons or responsive behavior changed.

See `docs/Deployment.md` for the broader production smoke-test checklist.

## 6. Create the release PR

Recommended branch name:

```bash
git checkout -b release/v1.0.1
```

The release PR should normally contain only release preparation changes such as:

```text
package.json
CHANGELOG.md
.github/releases/v1.0.1.md
```

Commit example:

```bash
git add package.json CHANGELOG.md .github/releases/v1.0.1.md
git commit -m "chore: prepare Mote v1.0.1 release"
git push origin release/v1.0.1
```

Open a PR to `main`.

Before merging:

- CI passes.
- Cloudflare Pages preview deploy succeeds.
- Release notes and version are correct.
- No unrelated code changes are included accidentally.

Then merge the PR into `main`.

## 7. Verify main before tagging

After the PR is merged:

```bash
git checkout main
git pull origin main
```

Verify the version:

```bash
node -p "require('./package.json').version"
```

Expected output for this example:

```text
1.0.1
```

Optionally run the release checks again:

```bash
npm run check
npm test
npm run build
```

Also confirm the production deployment is healthy at:

```text
https://mote.namnth.com
```

## 8. Create the Git tag

Create an annotated tag only after the intended release code is on `main`.

Example:

```bash
git tag -a v1.0.1 -m "Mote v1.0.1"
```

Verify it locally:

```bash
git tag --list
```

Push the tag to GitHub:

```bash
git push origin v1.0.1
```

Important:

```text
git tag ...
```

creates the tag only on the local machine.

```text
git push origin v1.0.1
```

publishes the tag to GitHub.

Verify the tag points to the intended release commit:

```bash
git show --no-patch v1.0.1
```

Never tag first and merge fixes afterward. The correct order is:

```text
finish changes
-> merge to main
-> validate main
-> create tag
```

## 9. Create the GitHub Release

### GitHub UI

Open the Mote repository and go to:

```text
Releases
-> Draft a new release
```

Use:

```text
Tag: v1.0.1
Release title: Mote v1.0.1
```

Copy the contents of:

```text
.github/releases/v1.0.1.md
```

into the release description.

Mark it as the latest release and publish it.

### GitHub CLI

If `gh` is installed:

```bash
gh release create v1.0.1 \
  --title "Mote v1.0.1" \
  --notes-file .github/releases/v1.0.1.md \
  --latest
```

The tag should normally already exist before running this command.

## 10. Post-release verification

After publishing the GitHub Release:

- Confirm the GitHub Release is visible.
- Confirm the tag exists.
- Confirm the release title/version matches `package.json`.
- Confirm Cloudflare Pages production is healthy.
- Open `mote.namnth.com` and perform a short smoke test.
- Confirm no unexpected browser/service-worker cache issue appeared.

The release is complete only after the production app is verified, not merely when the Git tag exists.

## 11. Hotfix release

If a serious bug is found after release:

```text
v1.0.1
-> fix the bug on a branch
-> update CHANGELOG.md
-> bump to v1.0.2
-> repeat this release process
```

Do not move or overwrite an already published release tag. Create a new PATCH version instead.

## 12. AI release instructions

For a future AI assistant, use a request similar to:

```text
Release Mote <NEXT_VERSION>.

Read docs/Release_Steps.md first and follow it as the source of truth.

Tasks:
- Review changes since the previous release.
- Decide whether the requested version bump is appropriate.
- Update package.json.
- Move relevant CHANGELOG.md entries from Unreleased into the new dated version section.
- Create .github/releases/v<NEXT_VERSION>.md with concise user-facing release notes.
- Run/verify npm run check, npm test and npm run build.
- Create a release branch, one release-preparation commit and a PR to main.
- Do not create the Git tag until the release PR is merged and main is verified.
- After merge, create and push annotated tag v<NEXT_VERSION>.
- Create the GitHub Release from .github/releases/v<NEXT_VERSION>.md.
- Verify the tag, release and production deployment.
- Report exactly what was changed and any manual verification still required.
```

The AI should never infer that a release is complete only because CI passed. It must verify the final tag/release and production state.

## Release checklist

```text
[ ] Choose next version
[ ] Update CHANGELOG.md
[ ] Bump package.json
[ ] Create .github/releases/v<version>.md
[ ] npm run check
[ ] npm test
[ ] npm run build
[ ] Smoke test changed areas
[ ] Create release PR
[ ] CI passes
[ ] Cloudflare preview succeeds
[ ] Merge to main
[ ] Verify main and production
[ ] Create annotated Git tag
[ ] Push tag to GitHub
[ ] Create GitHub Release
[ ] Final production smoke test
```
