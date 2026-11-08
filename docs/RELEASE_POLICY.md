# Release and documentation policy

- Write public `README.md` as a brief, current English introduction.
- Keep the Traditional Chinese guide in `README.zh-TW.md`.
- Keep `CHANGELOG.md` as a short index. Put detailed changes in `releases/vX.Y.Z.md`; never stack all version notes in the README.
- Use **English** for future public release notes, leaving Chinese Sine preference labels verbatim when needed.

## Required release sections

1. `# Zen Compact Transparent HDR Guard vX.Y.Z — …`
2. `## Changes`
3. `## SDR/HDR and Zia compatibility`
4. `## Validation and hardware limitations`
5. `## Rollback`

Confirm `theme.json` and `preferences.json` when describing settings. Do not claim that automated tests demonstrate macOS OLED HDR accuracy. If a rule bypasses HDR detection (for example Bilibili immediate mode), state the risk prominently.

## No-release documentation changes

The release workflow watches `theme.json`, `releases/**` and the release workflow file on `main`. README, changelog and this policy are outside that trigger. The general validation workflow may still run on `main`; that is **testing, not deployment or release**.

Do not change `theme.json`, `updatedAt`, Sine preferences, runtime scripts, CSS, actors, tests, or workflows while performing a documentation-only clean-up. Leave historical release tags and notes intact; GitHub's existing published release bodies do not automatically update when archived Markdown notes change.

## Release gate and consistency checks (v0.2.8+)

- The current version comes **only** from `theme.json.version`; `updatedAt` must advance for a versioned Sine release.
- The English `README.md`, Traditional Chinese `README.zh-TW.md`, and concise `CHANGELOG.md` must all state the same current version. Do not leave the previous version as the current one.
- The latest `releases/vX.Y.Z.md` must start with the exact title prefix above and contain all four exact English H2 headings **in order**. The published GitHub Release body is created from that file, and the Release title uses its first H1 line.
- Describe the actual changed behavior (not only proposed tasks), options/defaults and how to verify success. State CI results and **separate macOS/OLED acceptance still outstanding**; never imply static tests prove hardware brightness recovery.
- The rollback section must contain the **immediately prior tagged release**, the full backup branch and the default-OFF Sine switch where available. Keep old Git tags and published historical release bodies intact.
- Run JavaScript syntax checks, **all Node regressions and the automated release-policy test** on the pull request. The publishing workflow independently repeats these checks **before** calling `gh release create`. Any failure blocks the release.
- Documentation-only improvements update only README, CHANGELOG, or policy text; do not mutate `releases/**`, `theme.json`, runtime files or publish workflow for a documentation-only cleanup. This preserves Sine update behavior.


## Version carry rule (future releases)

- For all new releases, keep minor and patch components between 0 and 9, carrying to the next position after 9: `v0.3.9 → v0.4.0` and `v0.9.9 → v1.0.0`. Do not create future `v0.3.10`-style tags; major versions may grow beyond 9 when needed.
- This convention applies prospectively to **all projects**. Preserve all already-published tags, SHAs, and existing project histories; do not rename old versions or silently modify unrelated repositories.
