import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { englishContent, TRANSLATION_PENDING } from "@/lib/bilingual-content";

test("English content never falls back to Persian text", () => {
  assert.equal(englishContent("English title"), "English title");
  assert.equal(englishContent(""), TRANSLATION_PENDING);
  assert.equal(englishContent("   "), TRANSLATION_PENDING);
  assert.equal(englishContent(null), TRANSLATION_PENDING);
  assert.equal(englishContent(undefined), TRANSLATION_PENDING);
});

test("bilingual migration is additive, nullable, preserves legacy content and is repeatable", async () => {
  const database = new PGlite();
  try {
    await database.exec(`CREATE TABLE courses (id BIGSERIAL PRIMARY KEY,title VARCHAR(180) NOT NULL,summary VARCHAR(360) NOT NULL DEFAULT '',description TEXT NOT NULL DEFAULT '');
      CREATE TABLE course_sections (id BIGSERIAL PRIMARY KEY,title VARCHAR(180) NOT NULL,description TEXT NOT NULL DEFAULT '');
      CREATE TABLE lessons (id BIGSERIAL PRIMARY KEY,title VARCHAR(180) NOT NULL,summary VARCHAR(360) NOT NULL DEFAULT '',content TEXT NOT NULL DEFAULT '');
      CREATE TABLE events (id BIGSERIAL PRIMARY KEY,title VARCHAR(180) NOT NULL,summary VARCHAR(360) NOT NULL DEFAULT '',description TEXT NOT NULL DEFAULT '',location VARCHAR(240) NOT NULL DEFAULT '');
      CREATE TABLE course_categories (id BIGSERIAL PRIMARY KEY,name VARCHAR(140) NOT NULL,description TEXT NOT NULL DEFAULT '');
      CREATE TABLE membership_plans (id BIGSERIAL PRIMARY KEY,name VARCHAR(140) NOT NULL,description TEXT NOT NULL DEFAULT '',benefits JSONB NOT NULL DEFAULT '[]'::jsonb);
      INSERT INTO courses(title,summary,description) VALUES('عنوان فارسی','خلاصه فارسی','توضیح فارسی');
      INSERT INTO course_sections(title,description) VALUES('بخش فارسی','توضیح بخش فارسی');
      INSERT INTO lessons(title,summary,content) VALUES('درس فارسی','خلاصه درس فارسی','متن درس فارسی');
      INSERT INTO events(title,summary,description,location) VALUES('رویداد فارسی','خلاصه رویداد','توضیح رویداد','تهران');
      INSERT INTO course_categories(name,description) VALUES('دسته فارسی','توضیح دسته');`);
    await database.exec("INSERT INTO membership_plans(name,description,benefits) VALUES('پلن فارسی','توضیح پلن فارسی','[\"مزیت فارسی\"]'::jsonb)");
    const migration = await readFile(new URL("../../migrations/0018_bilingual_dynamic_content.sql", import.meta.url), "utf8");
    await database.exec(migration);
    await database.exec(migration);
    const courses = await database.query("SELECT title,summary,description,title_en,summary_en,description_en FROM courses");
    assert.deepEqual(courses.rows[0], { title: "عنوان فارسی", summary: "خلاصه فارسی", description: "توضیح فارسی", title_en: null, summary_en: null, description_en: null });
    const legacyRows = await database.query(`SELECT
      (SELECT title||'|'||description FROM course_sections WHERE id=1) AS section,
      (SELECT title||'|'||summary||'|'||content FROM lessons WHERE id=1) AS lesson,
      (SELECT title||'|'||summary||'|'||description||'|'||location FROM events WHERE id=1) AS event,
      (SELECT name||'|'||description FROM course_categories WHERE id=1) AS category`);
    assert.deepEqual(legacyRows.rows[0], {
      section: "بخش فارسی|توضیح بخش فارسی",
      lesson: "درس فارسی|خلاصه درس فارسی|متن درس فارسی",
      event: "رویداد فارسی|خلاصه رویداد|توضیح رویداد|تهران",
      category: "دسته فارسی|توضیح دسته",
    });
    const plans = await database.query("SELECT name,description,benefits,name_en,description_en,benefits_en FROM membership_plans");
    assert.deepEqual(plans.rows[0], { name: "پلن فارسی", description: "توضیح پلن فارسی", benefits: ["مزیت فارسی"], name_en: null, description_en: null, benefits_en: null });
    const columns = await database.query<{ table_name: string; column_name: string; is_nullable: string }>(`SELECT table_name,column_name,is_nullable FROM information_schema.columns WHERE table_name=ANY($1::text[])`, [["courses","course_sections","lessons","events","course_categories","membership_plans"]]);
    const found = new Set(columns.rows.map((row) => `${row.table_name}.${row.column_name}`));
    for (const column of ["courses.title_en","courses.summary_en","courses.description_en","course_sections.title_en","course_sections.description_en","lessons.title_en","lessons.summary_en","lessons.content_en","events.title_en","events.summary_en","events.description_en","events.location_en","course_categories.name_en","course_categories.description_en","membership_plans.name_en","membership_plans.description_en","membership_plans.benefits_en"]) assert.ok(found.has(column), `missing ${column}`);
    assert.ok(columns.rows.filter((row) => row.column_name.endsWith("_en")).every((row) => row.is_nullable === "YES"), "all English translation fields remain nullable");
    await database.query("UPDATE lessons SET title_en='English lesson' WHERE id=1");
    const translated = await database.query("SELECT title,title_en FROM lessons WHERE id=1");
    assert.deepEqual(translated.rows[0], { title: "درس فارسی", title_en: "English lesson" });
  } finally {
    await database.close();
  }
});
