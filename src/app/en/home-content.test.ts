import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("English homepage keeps the three current reference video embeds and active calls to action", async () => {
  const source = await readFile(new URL("./page.tsx", import.meta.url), "utf8");
  for (const id of [
    "8afabd85-d7a1-43a1-824d-b467272f0951",
    "f9dd38fa-5c2d-43f4-a9ad-888be6ebc0cd",
    "8f898452-4366-4ac7-84da-488acdb7c481",
  ]) assert.ok(source.includes(id), `missing homepage video ${id}`);
  assert.ok(source.includes("https://calendly.com/d/ct4v-zq9-zqw"), "missing Book a Call destination");
  assert.ok(source.includes("January 1, 2027"), "missing current price-change notice");
  assert.ok(source.includes("gin-family-reunion.jpg"), "missing current family reunion image");
});
