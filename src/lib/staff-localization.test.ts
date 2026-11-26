import assert from "node:assert/strict";
import test from "node:test";
import { localizeStaffText, staffDate, staffNumber } from "@/components/staff-localization";

test("staff labels are translated for English and remain byte-for-byte Persian by default", () => {
  assert.equal(localizeStaffText("کاربران سامانه", "en"), "Users");
  assert.equal(localizeStaffText("در انتظار بررسی", "en"), "Pending review");
  assert.equal(localizeStaffText("کاربران سامانه", "fa"), "کاربران سامانه");
  assert.equal(localizeStaffText("در انتظار بررسی", "fa"), "در انتظار بررسی");
});

test("staff API errors are translated in English while preserving the original Persian response", () => {
  const source = "تأییدکننده درخواست نمی‌تواند خودش پرداخت نهایی را ثبت کند.";
  assert.equal(localizeStaffText(source, "en"), "The person who approved the payout cannot record its final payment.");
  assert.equal(localizeStaffText(source, "fa"), source);
  assert.equal(localizeStaffText("ذخیره ترجمه سؤال انجام نشد.", "en"), "Could not save the question translation.");
  assert.equal(localizeStaffText("دریافت گزارش مالی انجام نشد.", "en"), "Could not load the financial report.");
  assert.equal(localizeStaffText("دریافت قوانین کمیسیون انجام نشد.", "en"), "Could not load commission rules.");
  assert.equal(localizeStaffText("پایان اعتبار قانون باید بعد از شروع باشد.", "en"), "The rule end date must be after its start date.");
});

test("staff dates and numbers use locale-specific formats without changing Persian output", () => {
  const date = "2026-11-26T12:00:00.000Z";
  assert.equal(staffNumber(1234567, "en"), "1,234,567");
  assert.equal(staffNumber(1234567, "fa"), (1234567).toLocaleString("fa-IR"));
  assert.equal(staffDate(date, "en", { dateStyle: "medium" }), new Date(date).toLocaleString("en-US", { dateStyle: "medium" }));
  assert.equal(staffDate(date, "fa", { dateStyle: "medium" }), new Date(date).toLocaleDateString("fa-IR"));
  assert.equal(staffDate(date, "fa"), new Date(date).toLocaleString("fa-IR"));
});
