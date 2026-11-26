import assert from "node:assert/strict";
import test from "node:test";
import { rejectCrossOriginMutation, sameOriginRequest } from "./request-security";

test("mutation origin checks accept only the configured same origin", () => {
  const previousAppUrl = process.env.APP_URL;
  process.env.APP_URL = "https://gin.example";

  try {
    assert.equal(sameOriginRequest(new Request("https://gin.example/api/profile", {
      method: "PUT",
      headers: { origin: "https://gin.example" },
    })), true);
    assert.equal(sameOriginRequest(new Request("https://gin.example/api/profile", {
      method: "POST",
      headers: { origin: "https://attacker.example" },
    })), false);
    assert.equal(sameOriginRequest(new Request("https://gin.example/api/profile", {
      method: "POST",
      headers: { referer: "https://gin.example/account" },
    })), true);
    assert.equal(sameOriginRequest(new Request("https://gin.example/api/profile", {
      method: "POST",
      headers: { referer: "not a valid URL" },
    })), false);
    assert.equal(sameOriginRequest(new Request("https://gin.example/api/profile", {
      method: "POST",
      headers: { "sec-fetch-site": "same-origin" },
    })), true);
    assert.equal(sameOriginRequest(new Request("https://gin.example/api/profile", {
      method: "POST",
      headers: { "sec-fetch-site": "cross-site" },
    })), false);

    const rejected = rejectCrossOriginMutation(new Request("https://gin.example/api/profile", {
      method: "POST",
      headers: { origin: "https://attacker.example" },
    }));
    assert.equal(rejected?.status, 403);
  } finally {
    if (previousAppUrl === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previousAppUrl;
  }
});
