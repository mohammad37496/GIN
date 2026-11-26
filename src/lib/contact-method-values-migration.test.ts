import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

test("contact method value migration normalizes old values and can be applied repeatedly", async () => {
  const database = new PGlite();
  try {
    await database.exec("CREATE TABLE contact_submissions (id BIGSERIAL PRIMARY KEY, preferred_contact_methods TEXT[] NOT NULL DEFAULT '{}' CHECK (preferred_contact_methods <@ ARRAY['email','phone','telephone','telegram','whatsapp']::TEXT[]))");
    await database.exec("INSERT INTO contact_submissions(preferred_contact_methods) VALUES(ARRAY['email','phone','telegram','whatsapp']::TEXT[]),(ARRAY['telephone']::TEXT[])");
    const migration = await readFile(new URL("../../migrations/0017_contact_method_values.sql", import.meta.url), "utf8");
    await database.exec(migration);
    await database.exec(migration);
    const result = await database.query<{ preferred_contact_methods: string[] }>("SELECT preferred_contact_methods FROM contact_submissions ORDER BY id");
    assert.deepEqual(result.rows[0].preferred_contact_methods, ["Email", "Telephone Call", "Telegram", "WhatsApp"]);
    assert.deepEqual(result.rows[1].preferred_contact_methods, ["Telephone Call"]);
    await assert.rejects(database.query("INSERT INTO contact_submissions(preferred_contact_methods) VALUES(ARRAY['email']::TEXT[])"), /check constraint/i);
    await database.query("INSERT INTO contact_submissions(preferred_contact_methods) VALUES(ARRAY['Email','WhatsApp']::TEXT[])");
  } finally {
    await database.close();
  }
});
