import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

test("contact submission migration is repeatable and enforces its data constraints", async () => {
  const database = new PGlite();
  try {
    await database.exec("CREATE TABLE users (id BIGSERIAL PRIMARY KEY)");
    const migration = await readFile(new URL("../../migrations/0016_contact_submissions.sql", import.meta.url), "utf8");
    await database.exec(migration);
    await database.exec(migration);

    const columns = await database.query<{ column_name: string }>("SELECT column_name FROM information_schema.columns WHERE table_name='contact_submissions'");
    const names = new Set(columns.rows.map((row) => row.column_name));
    for (const name of ["first_name", "email", "preferred_language", "preferred_contact_methods", "sms_consent", "legal_consent", "status", "ip_hash"]) {
      assert.ok(names.has(name), `missing contact_submissions column ${name}`);
    }

    const created = await database.query<{ id: number }>(`INSERT INTO contact_submissions(
      first_name,last_name,email,phone,address_line1,city,state_region,postal_code,country,preferred_language,
      preferred_contact_methods,subject,message,legal_consent
    ) VALUES('Alex','Morgan','alex@example.com','+1 555 0100','100 Main Street','Chicago','Illinois','60601','US','English',ARRAY['Email','Telegram'],'Question','Please send membership details.',TRUE) RETURNING id`);
    assert.equal(created.rows.length, 1);

    await assert.rejects(
      database.query(`INSERT INTO contact_submissions(first_name,last_name,email,phone,address_line1,city,state_region,postal_code,country,preferred_language,preferred_contact_methods,subject,message,status) VALUES('Alex','Morgan','alex@example.com','+1 555 0100','100 Main Street','Chicago','Illinois','60601','US','English',ARRAY['Email'],'Question','Please send membership details.','invalid')`),
      /check constraint/i,
    );
  } finally {
    await database.close();
  }
});
