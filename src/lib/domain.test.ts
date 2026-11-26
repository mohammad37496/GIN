import test from "node:test";
import assert from "node:assert/strict";
import { canEnrollWithoutPayment, canOpenLesson, calculateCommission, getWorkspacePath, gradeChoiceAnswer, isAllowedPaymentTransition, isValidCompletionPosition, safeInternalPath } from "./domain";

test("staff accounts are sent to their role workspace after login", () => {
  assert.equal(getWorkspacePath("admin", ["instructor"]), "/admin");
  assert.equal(getWorkspacePath("user", ["finance"]), "/finance-center");
  assert.equal(getWorkspacePath("user", ["affiliate_manager"]), "/finance-center");
  assert.equal(getWorkspacePath("user", ["support", "instructor"]), "/support-center");
  assert.equal(getWorkspacePath("user", ["event_manager"]), "/events-manager");
  assert.equal(getWorkspacePath("user", ["instructor"]), "/instructor");
  assert.equal(getWorkspacePath("user", []), "/dashboard");
});

test("lesson preview grants only preview access without enrollment", () => {
  assert.equal(canOpenLesson({ isPreview: true, isEnrolled: false }), true);
  assert.equal(canOpenLesson({ isPreview: false, isEnrolled: false }), false);
  assert.equal(canOpenLesson({ isPreview: false, isEnrolled: true }), true);
});

test("non-free courses never use the free enrollment path", () => {
  assert.equal(canEnrollWithoutPayment("free"), true);
  assert.equal(canEnrollWithoutPayment("members"), false);
  assert.equal(canEnrollWithoutPayment("paid"), false);
});

test("internal return paths reject open redirects and control characters", () => {
  assert.equal(safeInternalPath("/courses/a?x=1", "/dashboard"), "/courses/a?x=1");
  for (const path of ["https://evil.example", "//evil.example", "/\\evil.example", "/%0d%0aHeader:x", null]) assert.equal(safeInternalPath(path, "/dashboard"), "/dashboard");
});

test("progress values cannot exceed the lesson duration by more than a small tolerance", () => {
  assert.equal(isValidCompletionPosition({ durationSeconds: 600, watchedSeconds: 600, lastPositionSeconds: 590 }), true);
  assert.equal(isValidCompletionPosition({ durationSeconds: 600, watchedSeconds: 100_000, lastPositionSeconds: 100_000 }), false);
  assert.equal(isValidCompletionPosition({ durationSeconds: 0, watchedSeconds: 31, lastPositionSeconds: 0 }), false);
});

test("choice grading compares multiple-choice selections as sets", () => {
  assert.equal(gradeChoiceAnswer("single_choice", "a", "a"), true);
  assert.equal(gradeChoiceAnswer("true_false", true, false), false);
  assert.equal(gradeChoiceAnswer("multiple_choice", ["a", "b"], ["b", "a", "a"]), true);
  assert.equal(gradeChoiceAnswer("multiple_choice", ["a", "b"], ["a"]), false);
});

test("payment state transitions cannot move backwards from success", () => {
  assert.equal(isAllowedPaymentTransition("created", "pending"), true);
  assert.equal(isAllowedPaymentTransition("pending", "succeeded"), true);
  assert.equal(isAllowedPaymentTransition("succeeded", "failed"), false);
  assert.equal(isAllowedPaymentTransition("refunded", "succeeded"), false);
});

test("commission calculations are deterministic and bounded by the validated rate", () => {
  assert.equal(calculateCommission(100_000, 1250, 500), 13_000);
  assert.equal(calculateCommission(10_000, 10_000, 9_000), 10_000);
  assert.throws(() => calculateCommission(100, 10_001, 0), RangeError);
});
