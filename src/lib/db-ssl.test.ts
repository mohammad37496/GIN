import assert from "node:assert/strict";
import test from "node:test";
import { getDatabasePoolConfig } from "./db";

test("PostgreSQL sslmode=require keeps server certificate verification enabled", () => {
  const options = getDatabasePoolConfig("postgresql://user:password@db.example:5432/gin?sslmode=require&sslrootcert=%2Fetc%2Fssl%2Fdb-ca.pem");

  assert.match(options.connectionString ?? "", /[?&]sslmode=verify-full(?:&|$)/i);
  assert.match(options.connectionString ?? "", /sslrootcert=%2Fetc%2Fssl%2Fdb-ca\.pem/i);
});

test("PostgreSQL keyword connection strings also keep certificate verification enabled", () => {
  const options = getDatabasePoolConfig("host=db.example dbname=gin user=gin sslmode=require");

  assert.match(options.connectionString ?? "", /(?:^|\s)sslmode=verify-full(?:\s|$)/i);
});

test("quoted PostgreSQL keyword connection strings also keep certificate verification enabled", () => {
  const options = getDatabasePoolConfig("host=db.example dbname=gin user=gin sslmode='require'");

  assert.match(options.connectionString ?? "", /(?:^|\s)sslmode=verify-full(?:\s|$)/i);
});

test("sslmode=verify-full does not receive a permissive SSL override", () => {
  const options = getDatabasePoolConfig("postgresql://user:password@db.example:5432/gin?sslmode=verify-full");

  assert.equal(options.connectionString, "postgresql://user:password@db.example:5432/gin?sslmode=verify-full");
});
