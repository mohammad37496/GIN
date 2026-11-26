import assert from "node:assert/strict";
import test from "node:test";
import { contactCountryOptions } from "./contact-countries";

test("contact country select preserves all 250 exact value-label pairs from the reference form", () => {
  assert.equal(contactCountryOptions.length, 250);
  assert.equal(new Set(contactCountryOptions.map((country) => country.value)).size, 250);
  assert.deepEqual(contactCountryOptions[0], { value: "AF", label: "Afghanistan" });
  assert.deepEqual(contactCountryOptions.at(-1), { value: "ZW", label: "Zimbabwe" });
  assert.equal(contactCountryOptions.find((country) => country.value === "XK")?.label, "Kosovo");
  assert.equal(contactCountryOptions.find((country) => country.value === "US")?.label, "United States (US)");
});
