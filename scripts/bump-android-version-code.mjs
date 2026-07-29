/**
 * Ensure app.json expo.android.versionCode is greater than master.
 * Safe to re-run on release-please PR updates (bumps at most once past master).
 *
 * Usage: node scripts/bump-android-version-code.mjs [masterVersionCode]
 * If masterVersionCode is omitted, reads from env MASTER_VERSION_CODE.
 */
import fs from "node:fs";

const APP_JSON = "app.json";
const masterCode = Number(
  process.argv[2] ?? process.env.MASTER_VERSION_CODE ?? "",
);

if (!Number.isFinite(masterCode)) {
  throw new Error(
    "Pass master versionCode as argv[2] or MASTER_VERSION_CODE env",
  );
}

const app = JSON.parse(fs.readFileSync(APP_JSON, "utf8"));
if (!app.expo?.android) {
  throw new Error("app.json missing expo.android");
}
const current = Number(app.expo.android.versionCode);
if (!Number.isFinite(current)) {
  throw new Error(`Invalid android.versionCode: ${app.expo.android.versionCode}`);
}

if (current > masterCode) {
  console.log(
    `versionCode already bumped (${current} > master ${masterCode}); skip`,
  );
  process.exit(0);
}

app.expo.android.versionCode = masterCode + 1;
fs.writeFileSync(APP_JSON, `${JSON.stringify(app, null, 2)}\n`);
console.log(`versionCode ${current} → ${app.expo.android.versionCode}`);
