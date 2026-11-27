import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { officialGinLanguages } from "./official-gin-languages";

test("official GIN language destinations match the seven published website languages", () => {
  assert.deepEqual(officialGinLanguages.map(({ code }) => code), ["en", "de", "fr", "es", "hu", "sq", "pt"]);
  assert.deepEqual(officialGinLanguages.map(({ href }) => href), [
    "https://globalinformationnetwork.com/",
    "https://globalinformationnetwork.com/de/home-public/",
    "https://globalinformationnetwork.com/fr/home-public/",
    "https://globalinformationnetwork.com/es/home-public-spanish/",
    "https://globalinformationnetwork.com/hu/home-public/",
    "https://globalinformationnetwork.com/sq/home-public/",
    "https://globalinformationnetwork.com/pt/home-public/",
  ]);
  assert.deepEqual(officialGinLanguages.map(({ localPath }) => localPath), [
    "/en", "/de/home-public", "/fr/home-public", "/es/home-public-spanish", "/hu/home-public", "/sq/home-public", "/pt/home-public",
  ]);
});

test("portal locales remain distinct from external official website language destinations", () => {
  const switcher = readFileSync(new URL("../components/locale-switcher.tsx", import.meta.url), "utf8");
  assert.match(switcher, /Portal language/);
  assert.match(switcher, /GIN website/);
  assert.match(switcher, /officialGinLanguages\.map/);
  assert.match(switcher, /href=\{referencePageKey \? officialReferencePagePath/);
  assert.match(switcher, /language\.paths\[officialPageKey\]/);
  assert.match(switcher, /remember\("en"\)/);
  assert.match(switcher, /remember\("fa"\)/);
});
