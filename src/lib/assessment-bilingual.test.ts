import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { englishContent, TRANSLATION_PENDING } from "@/lib/bilingual-content";
import { localizedAssessmentApiError } from "@/lib/assessment-messages";

test("assessment translation migration is additive, nullable and repeatable", async () => {
  const database = new PGlite();
  try {
    await database.exec(`CREATE TABLE assessments (id BIGSERIAL PRIMARY KEY,title VARCHAR(180) NOT NULL,description TEXT NOT NULL DEFAULT '');
      CREATE TABLE assessment_questions (id BIGSERIAL PRIMARY KEY,prompt TEXT NOT NULL,options JSONB NOT NULL DEFAULT '[]',explanation TEXT NOT NULL DEFAULT '');
      INSERT INTO assessments(title,description) VALUES('عنوان آزمون فارسی','توضیح آزمون فارسی');
      INSERT INTO assessment_questions(prompt,options,explanation) VALUES('پرسش فارسی','[{"id":"A","label":"گزینه فارسی"}]','توضیح فارسی');`);
    const migration = await readFile(new URL("../../migrations/0019_bilingual_assessments.sql", import.meta.url), "utf8");
    await database.exec(migration);
    await database.exec(migration);
    const assessment = await database.query("SELECT title,description,title_en,description_en FROM assessments");
    assert.deepEqual(assessment.rows[0], { title: "عنوان آزمون فارسی", description: "توضیح آزمون فارسی", title_en: null, description_en: null });
    const question = await database.query("SELECT prompt,options,explanation,prompt_en,explanation_en FROM assessment_questions");
    assert.deepEqual(question.rows[0], { prompt: "پرسش فارسی", options: [{ id: "A", label: "گزینه فارسی" }], explanation: "توضیح فارسی", prompt_en: null, explanation_en: null });
    const columns = await database.query<{ column_name: string; is_nullable: string }>("SELECT column_name,is_nullable FROM information_schema.columns WHERE table_name IN ('assessments','assessment_questions') AND column_name IN ('title_en','description_en','prompt_en','explanation_en')");
    assert.equal(columns.rows.length, 4);
    assert.ok(columns.rows.every((column) => column.is_nullable === "YES"));
    await database.query("UPDATE assessments SET title_en='English title',description_en='English description'");
    await database.query("UPDATE assessment_questions SET prompt_en='English prompt',explanation_en='English explanation',options=jsonb_set(options,'{0,label_en}','\"English option\"')");
    const translated = await database.query("SELECT a.title,a.title_en,q.prompt,q.prompt_en,q.options->0->>'label_en' AS option_en FROM assessments a CROSS JOIN assessment_questions q");
    assert.deepEqual(translated.rows[0], { title: "عنوان آزمون فارسی", title_en: "English title", prompt: "پرسش فارسی", prompt_en: "English prompt", option_en: "English option" });
  } finally { await database.close(); }
});

test("untranslated assessment text renders pending rather than Persian source text", () => {
  assert.equal(englishContent(null), TRANSLATION_PENDING);
  assert.equal(englishContent("  "), TRANSLATION_PENDING);
  assert.equal(englishContent("English question"), "English question");
});

test("English learner assessment errors never expose Persian API messages", () => {
  assert.equal(localizedAssessmentApiError("en", 403, "دسترسی فعال شما به این دوره پایان یافته است.", "Could not save your answers."), "Your active enrollment is required to continue this assessment.");
  assert.equal(localizedAssessmentApiError("en", 503, "ذخیره پاسخ‌های آزمون انجام نشد.", "Could not save your answers."), "Could not save your answers.");
  assert.equal(localizedAssessmentApiError("en", 409, "زمان آزمون به پایان رسیده است.", "Could not save your answers."), "The assessment attempt has expired or is no longer available.");
});

test("Persian learner assessment keeps the server's localized error message", () => {
  assert.equal(localizedAssessmentApiError("fa", 403, "دسترسی فعال شما به این دوره پایان یافته است.", "ذخیره پاسخ انجام نشد."), "دسترسی فعال شما به این دوره پایان یافته است.");
});
