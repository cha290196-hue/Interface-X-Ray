# Security model

This is a browser developer tool. Inspected webpages may contain confidential content; treat exported reports and screenshots accordingly.

- The extension uses `activeTab` and `scripting`, without blanket host permission.
- The control UI is created under a Shadow DOM root and content script code runs in the browser's isolated world.
- The build contains no remotely loaded JavaScript and performs no extension-side network calls.
- CSS edits use a fixed allowlist of properties and validate values with `CSS.supports`. They do not write to site source files.
- Screenshot requests are checked against the active tab, and the user is prompted before capture.
- HTML strings drawn inside the extension UI are escaped for text values. Geometry SVG is built from numeric measurements.

## Boundaries

Shadow DOM isolation is not a browser security sandbox against a malicious page. A hostile page may manipulate the DOM during an inspection. Cross-origin frame internals, closed Shadow DOM and browser-privileged pages are not inspected. CSS diagnostics are heuristic, not a security vulnerability scanner. A screenshot mask is a convenience and must not be treated as complete redaction.

For a suspected issue, include a minimal reproducible HTML/CSS page, browser version, and steps to reproduce. Do not include private website credentials or full-page screenshots from confidential systems in a public issue.
