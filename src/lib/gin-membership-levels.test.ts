import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import { ginMembershipLevels } from "./gin-membership-levels";

test("GIN membership levels preserve all 12 source rows, titles and pin images", async () => {
  assert.equal(ginMembershipLevels.length, 12);
  assert.deepEqual(ginMembershipLevels.map((item) => item.level), Array.from({ length: 12 }, (_, index) => index + 1));
  assert.equal(ginMembershipLevels[0].qualifications, "Initiation Fee $1,500; Monthly Dues $150");
  assert.equal(ginMembershipLevels[5].title, "Level 6 / Executive Member");
  assert.equal(ginMembershipLevels[11].title, "Level 12 / Partner");
  assert.ok(ginMembershipLevels.slice(1).every((item) => item.qualifications === "CLASSIFIED" && item.benefits === "CLASSIFIED" && item.cashBonuses === "CLASSIFIED"));
  await Promise.all(ginMembershipLevels.map((item) => access(new URL(`../../public/gin/membership-levels/${item.image}`, import.meta.url))));
});
