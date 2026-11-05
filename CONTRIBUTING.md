# Contributing

Reproducible behavior matters more than unverified feature claims.

1. Describe the concrete failure and include a minimal HTML/CSS reproduction without personal data.
2. Identify the relevant engine (`inspect`, `diagnose`, `scene`, `patch` or `ui`). Keep browser permissions minimal.
3. Add a scenario or unit test reproducing the bug. Run `npm run check`, `npm test`, and appropriate Playwright tests.
4. For visual changes, include **actual browser screenshots** at a desktop and a mobile width. Do not substitute illustrative mockups for verification screenshots.
5. Document false positives, unsupported browser behavior and regressions honestly.

Do not introduce tracking SDKs, remote-code loading or blanket site permissions for convenience. Retain the local-first design and lightweight offline build unless a change demonstrably requires otherwise.
