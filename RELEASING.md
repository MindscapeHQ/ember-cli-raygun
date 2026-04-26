# Releasing ember-cli-raygun

This package is published to **[npm](https://www.npmjs.com/package/ember-cli-raygun)**
as `ember-cli-raygun`. GitHub holds source only — consumers install via
`ember install ember-cli-raygun` (which is just `npm install` under the hood),
so npm is the actual distribution channel. There is no other host or registry
to push to.

## Prerequisites

Before you can release, you need:

1. **npm publish access** to the `ember-cli-raygun` package. Verify with:
   ```bash
   npm owner ls ember-cli-raygun
   ```
   If you're not on the list, ask an existing owner to grant access:
   ```bash
   npm owner add <your-npm-username> ember-cli-raygun
   ```

2. **`npm login`** with that account on your local machine. Verify with:
   ```bash
   npm whoami
   ```

3. **2FA enabled** on the npm account (recommended). If `npm publish` later
   prompts for a one-time password, that's why.

4. **A clean working tree** on the `main` branch with the merge of the change
   you want to release already pulled.

## Versioning

This project follows [SemVer](https://semver.org/):

- **Patch** (`2.0.0 → 2.0.1`) — bug fixes, internal refactors, dependency
  bumps, test-only changes, doc-only changes.
- **Minor** (`2.0.0 → 2.1.0`) — new features that are backwards-compatible
  to consumers (e.g. a new service method, new config option that defaults
  to current behavior).
- **Major** (`2.0.0 → 3.0.0`) — breaking changes to the public API
  (service signature, config keys, supported Ember/Node range, removed
  features).

When in doubt, ask: *"Will an existing app that upgrades by running
`npm install ember-cli-raygun@latest` need to change any code?"* If yes,
it's a major.

## Release steps

```bash
# 1. Make sure main is up to date and clean
git checkout main
git pull --ff-only origin main
git status   # should be clean

# 2. Bump the version. Choose ONE of:
npm version patch     # 2.0.0 -> 2.0.1
npm version minor     # 2.0.0 -> 2.1.0
npm version major     # 2.0.0 -> 3.0.0

# This automatically:
#   - bumps "version" in package.json + package-lock.json
#   - creates a commit "v2.0.1" (or whatever)
#   - creates a git tag v2.0.1

# 3. Push the commit and the tag
git push origin main --follow-tags

# 4. Publish to npm
npm publish

# (If your account requires 2FA: it will prompt for a one-time password.)

# 5. Create a GitHub Release on the new tag
#    https://github.com/MindscapeHQ/ember-cli-raygun/releases/new
#    - Choose the new tag (e.g. v2.0.1)
#    - Title it the same (v2.0.1)
#    - Paste the changelog entry from the merged PRs since the last release
```

## What gets published

Files included in the npm package are controlled by [`.npmignore`](./.npmignore).
At time of writing the published tarball contains:

- `addon/` — runtime source
- `app/` — host-namespace re-exports
- `blueprints/` — `ember install` scaffolding
- `config/environment.js` — addon's own ember-cli config
- `index.js` — build-time addon entry point
- `package.json`
- `README.md`
- `LICENSE.md`

Excluded: `tests/`, `dist/`, `tmp/`, all dotfiles, ember-try artifacts,
CI configs, `CONTRIBUTING.md`, `RELEASING.md`, `AGENTS.md`,
`ember-cli-build.js`, `testem.js`.

You can preview the exact tarball **without** publishing using:

```bash
npm pack --dry-run
```

## Pre-flight checklist

Before running `npm publish`, double-check:

- [ ] `npm run lint` passes
- [ ] `npm run test:ember` passes (or CI on the merge commit is green)
- [ ] `npm run build` succeeds
- [ ] `npm pack --dry-run` lists only the files you intend to ship
- [ ] The version in `package.json` matches the git tag you just created
- [ ] The README and any user-facing docs reflect what's in the release
- [ ] If this is a breaking change: the README has a migration note

## After publishing

- Verify the new version is live: `npm view ember-cli-raygun version` should
  echo what you just published. It can take ~30 seconds for the npm CDN to
  catch up.
- Verify a fresh install works in a scratch project:
  ```bash
  cd $(mktemp -d) && npm init -y && npm install ember-cli-raygun@latest
  ```
- Announce on whatever channels you use (changelog, internal Slack, etc.).

## Recovering from a bad release

If you publish something broken:

- **Within 72 hours**, you can `npm unpublish ember-cli-raygun@<bad-version>`.
  After 72 hours, npm will not let you unpublish.
- **Always preferred**: publish a follow-up patch release with the fix and
  optionally `npm deprecate ember-cli-raygun@<bad-version> "<reason>"` so
  installers see a warning. Existing consumers' lockfiles continue to work,
  but new installs get the fix.

## Future: automated releases

This repo currently releases manually. A future improvement would be to add
a `.github/workflows/release.yml` that triggers on `v*` tag pushes and runs
`npm publish` using a granular access token stored as a `NPM_TOKEN` repo
secret. That would reduce the steps above to:

```bash
npm version patch
git push origin main --follow-tags
# CI publishes automatically
```

Not implemented yet — track in an issue if/when there's appetite.
