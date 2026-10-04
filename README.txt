Water Chemistry Assistant PWA V5.3.1

DEPLOY
Extract this ZIP and commit its contents at the root of the Water-Chemistry-App
repository. index.html must be at that root. Enable GitHub Pages for the branch
and root folder. All app paths are relative and support /Water-Chemistry-App/.
Use HTTPS or localhost; opening index.html as a file is not a supported PWA setup.
After replacing the previous version, open online and reload once to load the new service worker.
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
records in the chosen scope after confirmation. Standard templates require the owner password to edit or delete.
The app does not sync simultaneous edits across browser tabs; use one tab.

CHEMISTRY
V4 Taylor lookup arrays and densities are retained in chemistry.js.
CH minimum 200 ppm; TA 80-120; pH 7.2-7.8; bromine 3-5, aiming for 4.
TA increase and decrease: cap the calculated change at 30 ppm per treatment
for every pool volume. Increase toward 90 ppm; decrease toward 110 ppm.
For high TA, first halve the full correction, then limit the resulting change
to 30 ppm. ADD NOW is the resulting weight, not an additional half dose.
The 30 ppm cap replaces the earlier 1 tbsp/100 GAL increase and 1 lb/dose
decrease caps. It is an operator-selected ceiling, not a validated safe dose.
For TA decrease, require a current pH and suppress acid amounts at pH <=7.2.
This guard does not predict final pH or prove dose safety. Product-label dosing
and equipment limits still apply. THRIVE manual: no more than 1 lb decreaser
per day. Only recorded shock additions are tracked; cumulative chemical limits are not enforced.
TA weight conversion retains V4/Taylor coefficients: sodium bicarbonate 100%,
dry acid 93.2%. The exact manufacturer formulation must be checked; the
30 ppm prediction is approximate and is not a product-specific validation.
pH correction uses HALF the V4 Taylor demand-table dose.
ADD NOW includes all reductions and caps. Display precision is rounded down
to 0.001 oz (and approximate volume to 0.001 unit) to avoid exceeding a cap.
Do not add an unmeasurably small dose without a suitable precision scale.
Preferred sequence: RUN JETS 15 MINUTES -> WAIT ANOTHER 30 MINUTES.
Keep normal circulation running. Observe any longer label-required interval
before retesting or adding more. HTH Pool Care Alkalinity Up specifies 6-8 hours.
For TA adjustments, retest both TA and pH. The 45-minute sequence is not a
universal authorization to redose.
Fresh Fill gates Calcium -> TA -> pH -> Initial Shock & Bromine Startup. Changing an earlier step out
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

POOLS AND TEMPLATE MANAGEMENT
All pool selectors and management lists sort by name, case-insensitively,
with natural numeric ordering (200, 300, 350, 750, 1200, etc.).
Go to Home > Manage pools & custom volumes > Unlock Templates.
Enter the fixed password supplied by the owner. Edit Template changes the
name and gallon volume while retaining the template ID. Delete Template asks
for confirmation and preserves records. Custom pools are independent copies
and are not modified when a standard template changes. Records retain their
original name and volume, including after a template is renamed or deleted.
Use Lock Templates when finished. Reloading the page also locks templates.
Template overrides/deletions use localStorage key standardPoolsV52; an empty
array means all standard templates were deleted and does not restore defaults.
If no pools remain, add a custom pool to resume tests and logs.

PASSWORD AND STORAGE SCOPE
The fixed password is stored as a salted PBKDF2-SHA256 verifier (210,000
iterations), not as plaintext. The app has no server-side authentication.
This password protects the normal editing interface only; someone able to
modify browser storage or JavaScript can bypass it. Use a dedicated password.
Template edits and deletions apply only to the current browser/device/origin;
they do not modify the GitHub repository or sync to other users. Browser data
clearing removes local edits and logs. Keep CSV backups. No password needs to
be created on first use. To change the fixed password, build a new verifier
and redeploy; do not place plaintext credentials in the app or this README.

V5.3 SHOCK WORKFLOWS
Home > Weekly / As-needed Shock, or Weekly Logs > shock calculator.
Fresh Fill leads to Initial Shock after Calcium, TA and pH pass their gates.
Weekly maintenance offers MPS, calcium hypochlorite, dichlor or liquid sodium
hypochlorite. Fresh Fill offers only the three chlorinated types.
Lithium shock is not offered. Choose one compatible product per treatment.
Enter its exact label amount, unit, treated gallons, timing and re-entry
conditions. Save Product Setup to reuse it. Initial and weekly profiles are
separate because their treatment rates may differ. Profiles stay in this browser.
The calculator scales label amount x pool gallons / label gallons. No universal
brand-average shock dose is assumed. Solid products use weight; liquid products
use liquid volume. No generic spoon-volume conversion or half-dose rule applies.
Changing product type clears the previous amount to prevent accidental reuse.
Record only an actual addition; it is linked to the selected pool in History and
included in history CSV export. Recording a dose is not permission to reopen.

Fresh Fill uses compatible chlorinated shock for initial sanitation while the
bromine feeder establishes its residual. Maintain and test the chlorine residual
according to the product label during this transition. A bromide starter is not
mandatory in this workflow; use one if the system instructions require it.
MPS alone does not sanitize fresh water. Older MPS startup profiles are blocked.
Final bromine checks confirm established-system startup completion; they do not
assess interim chlorine sanitation. Follow kit guidance for mixed sanitizers.
After recording initial shock, Fresh Fill requests bromine 3-5 ppm (aim 4),
pH 7.2-7.8, and confirmation that label wait/re-entry conditions are met.
The app retains RUN JETS 15 MINUTES -> WAIT ANOTHER 30 MINUTES -> RETEST.
Keep normal circulation running; longer label requirements take precedence.
Chemistry Reference includes manufacturer examples and linked research sources.
The 30 ppm TA ceiling is an operating choice, not a universal industry maximum.
Existing V4 TA/pH/bromine formulations are not validated for every manufacturer.

UPGRADING
Upload these extracted files to the repository root, replacing matching files,
including index.html. Keep the existing videos folder and its MP4 files.
Do not upload the ZIP itself. Reload the published app online after deployment.
The release retains the existing pool, history and template-password storage.
