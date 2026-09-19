# Settings native ownership

Baseline: `d42b8bc64d9098c49a794012566c4de2f93d4433` on
`road-brain-v1-implementation`. This is an ownership move with no intended
product, permission, diagnostics, statistics, or Startup design change.

## Characterised shipped result

`tests/fixtures/settings/shipped.json` freezes the rendered Settings DOM and
Settings/Close CSS from the baseline web and iOS builds. The fixture records
all sections, including hidden content, rather than just visible headings.
`tests/check-settings-native.js` executes the actual Settings, Units, Startup
and Onboarding refresh scripts in a DOM, with permission/share APIs controlled
at the platform boundary. It runs against the template and both built outputs.

- Section order: Audio, Appearance & Display, Statistics, About, Help & privacy,
  Advanced and Experimental Features. Audio, Statistics, About and Advanced
  remain hidden by the shipped CSS. Stable build flags remain build-owned.
- Display order: Appearance, Units, Visible elements. The old positional
  decorator targeted the second setting (Units), so it did not add
  `compact-choice-list` to Visible elements. Preserve that shipped result.
- Help & privacy: Location first, then Feedback, Something not working?,
  diagnostic sharing/status, and the external privacy-policy link.
- Statistics retain the shipped labels, counters and network panel; collection,
  persistence and reset logic remain unchanged.
- Card/sheet, responsive, light-theme, footer and Close styles retain their
  original values. Historical style/script IDs remain as stable markers.
- Close is the first child of the sheet and forwards clicks to `closeSettings`.
  Only this button's construction and styles were removed from Startup.
- Existing accordion wiring remains: Settings initialization opens all sections;
  headers retain their shipped non-interactive styling and visible bodies.

## Build boundaries deliberately retained

No Settings-specific injection module is needed. `build.js` already validates
`version.json` and substitutes `__APP_VERSION__`; the native footer and runtime
use that existing placeholder. The runtime keeps the shipped web
`Version <version>` / native `Version 1.0 · Build <version>` distinction.
`build-ios.js` still packages the native bridge, rewrites geolocation references
and the hidden About version/build timestamp, and checks native Location markers.
Those are build/platform configuration, not Settings redesign.

`build/support-diagnostics.js` still injects the sanitised report and sharing
runtime using version/channel/Brain inputs. Its obsolete temporary Settings
section is removed; the final sharing control and copy are native markup.
Formatter, sharing, retention and privacy semantics are unchanged. The old
privacy test asserting intermediate, never-shipped diagnostic copy is replaced
by native-control checks plus the existing sensitive-data exclusion tests and
real sharing/copy/cancel/fallback tests.

## Native permission lifecycle deliberately retained

The Settings runtime retains its status state, web geolocation wrappers,
Permissions API change listener, two initialization refresh calls, pageshow and
visible-document refresh. Native Manage/Open Settings forwards to the same
bridge API. Browser help stays user-agent-specific and toggles in place.

`build/positive-onboarding.js` retains its separate native row refresh script
unchanged: Settings click refreshes now and after 180 ms, visibility refreshes
now and after 180 ms, and focus refreshes after 80 ms. It updates the row/label
but not the action text. `native-ios.js` and its lifecycle are unchanged. These
paths are intentionally not consolidated here.

## Verification scope

Ownership assertions must fail on the baseline and pass on native source.
DOM snapshots normalize whitespace/attribute order and version/build values;
template comparison accounts only for the existing stable build hidden flags.
Explicit assertions also verify configured version text. CSS is compared exactly.
Permission transitions, error paths, Close, diagnostics sharing and no automatic
sharing are exercised. The complete quality gate includes web and iOS packaging;
its native UI suite step checks suite contracts, not a live simulator run.
