Water Chemistry Assistant PWA V5

DEPLOY
Extract this ZIP and commit its contents at the root of the Water-Chemistry-App
repository. index.html must be at that root. Enable GitHub Pages for the branch
and root folder. All app paths are relative and support /Water-Chemistry-App/.
Use HTTPS or localhost; opening index.html as a file is not a supported PWA setup.
After replacing V4, open online and reload once to load the new service worker.
V5 caches the app and complete Taylor PDF for subsequent offline use.

VIDEOS
Large videos are intentionally excluded. Add these case-sensitive filenames:
videos/Calcium.mp4
videos/Alkalinity.mp4
videos/PH.mp4
videos/Bromine.mp4
Videos are not precached for offline use.

DATA
Data stays in this browser's localStorage on the same origin. Keep the same
GitHub Pages hostname/browser to retain V4 data. Browser clearing or changing
devices does not transfer records. Export CSV regularly.
V4 keys pools, sid, chemHistory, dailyChemLog and weeklyChemLog are retained.
The first V5 load saves a raw chemV5Backup snapshot before record migration.
V4 records are linked by name and volume only when exactly one pool matches.
Ambiguous/unmatched records remain visible in History > All pools as legacy.
New records have stable pool IDs and a historical name/volume snapshot.
Renaming a pool keeps its links; deleting a pool keeps records accessible and
exportable from History > All pools. An explicit Clear History action deletes
records in the chosen scope after confirmation. Standard templates are protected.
The app does not sync simultaneous edits across browser tabs; use one tab.

CHEMISTRY
V4 Taylor lookup arrays and densities are retained in chemistry.js.
CH minimum 200 ppm; TA 80-120; pH 7.2-7.8; bromine 3-5, aiming for 4.
TA increase single-dose limit: 1 tablespoon per 100 gallons, converted to
weight with the V4 density 0.626 lb/cup (= 0.626 oz/tbsp).
TA decrease uses HALF the calculated correction, then caps at 16 oz.
pH correction uses HALF the V4 Taylor demand-table dose.
ADD NOW includes all reductions and caps. Display precision is rounded down
to 0.001 oz (and approximate volume to 0.001 unit) to avoid exceeding a cap.
Do not add an unmeasurably small dose without a suitable precision scale.
RUN JETS 15 MINUTES -> WAIT 30 MINUTES -> RETEST before another adjustment.
Fresh Fill gates Calcium -> TA -> pH -> Bromine. Changing an earlier step out
of range clears later readings so stale results cannot unlock a later step.

RELEASE LIMITATION
Bromine calculations retain V4's assumed SpaGuard 60% / HTH 62% strengths.
They REQUIRE exact product-label and production validation before field use.
The provided Taylor troubleshooting PDF is included unchanged; the app also
transcribes its full troubleshooting text. Its DPD section describes chlorine
test colors, including orange for bromine. Follow the exact kit instructions
for reagent quantities, sample size and dilution calculations.
Follow chemical labels; never mix chemicals. Weight preferred; volume approximate.

See VALIDATION.txt for validation coverage and representative RISE examples.
