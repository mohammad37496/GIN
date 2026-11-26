import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

function contrastAgainstWhite(hex: string) {
  const channels = hex.match(/[\da-f]{2}/gi)?.map((value) => parseInt(value, 16) / 255);
  assert.equal(channels?.length, 3, `Invalid hex color: ${hex}`);
  const [r, g, b] = channels!.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return 1.05 / (luminance + 0.05);
}

test("member-facing refresh icon buttons have meaningful accessible names", () => {
  const controls = [
    ["../components/affiliate-dashboard.tsx", "تازه‌سازی اطلاعات همکاری در فروش"],
    ["../components/member-membership-controls.tsx", "تازه‌سازی سوابق عضویت"],
    ["../components/support-inbox.tsx", "تازه‌سازی درخواست‌های پشتیبانی"],
  ] as const;
  for (const [path, label] of controls) {
    const component = source(path);
    assert.ok(component.includes(`aria-label="${label}"`), `${path} is missing its refresh accessible name`);
    assert.match(component, /<button[^>]*aria-label="[^"]+"[^>]*><RefreshCw\b/);
  }
});

test("assessment admin small text colors meet WCAG AA normal-text contrast on white", () => {
  const css = source("../app/assessment-admin.css");
  const colors = [
    css.match(/\.admin-assessment-card>div:first-child small\{[^}]*color:(#[\da-f]{6})/i)?.[1],
    css.match(/\.admin-question-fields label,\.admin-review-answer label\{[^}]*color:(#[\da-f]{6})/i)?.[1],
    css.match(/\.assessment-question legend small\{[^}]*color:(#[\da-f]{6})/i)?.[1],
  ];
  assert.ok(colors.every(Boolean), "All three audited selectors must retain explicit text colors");
  for (const color of colors) assert.ok(contrastAgainstWhite(color!) >= 4.5, `${color} does not meet 4.5:1 contrast on white`);
});
