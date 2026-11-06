# Release and documentation policy

- Write public `README.md` as a brief, current English introduction.
- Keep the Traditional Chinese guide in `README.zh-TW.md`.
- Keep `CHANGELOG.md` as a short index. Put detailed changes in `releases/vX.Y.Z.md`; never stack all version notes in the README.
- Use **English** for future public release notes, leaving Chinese Sine preference labels verbatim when needed.

## Required release sections

1. `# Zen Compact Transparent HDR Guard vX.Y.Z — …`
2. `Changes`
3. `SDR/HDR and Zia compatibility`
4. `Validation and hardware limitations`
5. `Rollback`

Confirm `theme.json` and `preferences.json` when describing settings. Do not claim that automated tests demonstrate macOS OLED HDR accuracy. If a rule bypasses HDR detection (for example Bilibili immediate mode), state the risk prominently.

## No-release documentation changes

The release workflow watches `theme.json`, `releases/**` and the release workflow file on `main`. README, changelog and this policy are outside that trigger. The general validation workflow may still run on `main`; that is **testing, not deployment or release**.

Do not change `theme.json`, `updatedAt`, Sine preferences, runtime scripts, CSS, actors, tests, or workflows while performing a documentation-only clean-up. Leave historical release tags and notes intact; GitHub's existing published release bodies do not automatically update when archived Markdown notes change.
