# Privacy policy

**Applies to Interface X-Ray 1.0.0.** Interface X-Ray operates locally within the inspected tab after a deliberate user interaction. It does not use accounts, telemetry, advertising or external analytics and does not transmit DOM inspection results to a developer-controlled service.

## Permissions

The extension requests `activeTab` and `scripting`. It does not request blanket host permissions, browsing history or cookie access. `activeTab` gives temporary access to the user-invoked tab. Some browser-internal or privileged pages cannot be inspected.

## Data processed

The content script reads DOM element names, IDs, classes, computed CSS, element dimensions and relationships, and approximate stacking-context triggers. These values are processed in the tab and used to draw the visualization. JSON exports include element identifiers, geometry and diagnostic evidence. Text nodes, form values, cookies, local storage and password values are not intentionally collected by inspection exports. **Element IDs, class names and selectors may themselves reveal private or proprietary details.**

## Screenshot exports

A screenshot can include visible website text, private messages, images, video, canvas data and form values. The user must explicitly request and confirm tab capture. Optional masks cover common visible form-control rectangles; this is not complete redaction of all private content. Review any screenshots before sharing them.

## CSS changes and retention

Session patches are applied to the in-memory page and recorded locally in the content script to support undo/redo and reset. They do not alter on-disk site files or upload CSS. Closing the inspector or reloading the tab ends this session. The browser's normal page scripts may make independent modifications during inspection; conflict restoration is intentionally conservative.

The project has no remote collection endpoint, background synchronization or persistent user profile database. See the source for an independently verifiable implementation.
