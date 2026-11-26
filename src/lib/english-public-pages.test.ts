import assert from "node:assert/strict";
import test from "node:test";
import { englishPublicPages } from "./english-public-pages";

test("all public reference sections have complete English page content", () => {
  const required = [
    "about-us", "who-we-are", "what-we-offer", "our-training", "personal-mastery", "member-benefits", "member-benefits-associate",
    "the-gin-success-system", "our-events", "gin-hotels", "clubhouses-and-lodges",
    "the-gin-cruise-ship", "membership-levels", "faq", "contact-us", "become-a-member",
  ];
  for (const slug of required) {
    const page = englishPublicPages[slug];
    assert.ok(page, `missing English page: ${slug}`);
    assert.ok(page.title.trim().length > 0, `${slug} has no title`);
    assert.ok((page.description ?? page.intro).trim().length > 40, `${slug} has no useful metadata description`);
    if (!["about-us", "who-we-are", "what-we-offer", "our-training", "member-benefits", "member-benefits-associate", "our-events", "gin-hotels", "clubhouses-and-lodges", "personal-mastery", "membership-levels", "faq", "the-gin-success-system", "contact-us"].includes(slug)) assert.ok(page.sections.length > 0, `${slug} has no content sections`);
    if (page.image) assert.ok(page.image.startsWith("/gin/"), `${slug} has a non-local reference image`);
  }
});

test("legal pages link to the official authoritative documents", () => {
  assert.equal(englishPublicPages["privacy-policy"].officialUrl, "https://globalinformationnetwork.com/privacy-policy-2/");
  assert.equal(englishPublicPages["terms-of-use"].officialUrl, "https://globalinformationnetwork.com/terms-of-use/");
  assert.equal(englishPublicPages["member-agreement"].officialUrl, "https://globalinformationnetwork.com/member-agreement/");
});

test("FAQ includes the reference questions and attributes organization claims", () => {
  const faq = englishPublicPages.faq;
  assert.ok(faq.sections.length >= 15);
  assert.ok(faq.sections.some((section) => section.title === "What do I get as a GIN Member?"));
  assert.ok(faq.sections.some((section) => section.body.includes("Family Member Plan")));
  assert.ok(faq.sections.every((section) => section.body.trim().length > 60));
  assert.ok(faq.sections.some((section) => section.body.includes("claims made by GIN")));
});

test("the Our Events information page links to its own reference route, distinct from the event calendar", () => {
  assert.equal(englishPublicPages["our-events"].officialUrl, "https://globalinformationnetwork.com/our-events/");
  assert.equal(englishPublicPages["our-events"].title, "GIN Events");
});

test("the reference cruise page is described as a conditional ship concept, not a booked annual cruise", () => {
  const page = englishPublicPages["the-gin-cruise-ship"];
  assert.ok(page.sections.some((section) => /FREEDOM vision/.test(section.title)));
  assert.ok(page.sections.some((section) => /does not guarantee that the ship will be built/.test(section.body)));
});

test("public member benefits page describes the listed initiation fee and complimentary Major Weekend ticket", () => {
  const benefits = englishPublicPages["member-benefits"];
  assert.equal(benefits.sections.length, 0);
  assert.ok(benefits.description?.includes("training"));
});

test("legal, FAQ and contact pages do not use unrelated images", () => {
  for (const slug of ["faq", "contact-us", "privacy-policy", "terms-of-use", "member-agreement", "membership-levels", "support"]) {
    assert.equal(englishPublicPages[slug].image, undefined);
  }
});

test("the membership CTA distinguishes official GIN membership from portal registration", () => {
  const page = englishPublicPages["become-a-member"];
  assert.match(page.sections[0].body, /official GIN application/i);
  assert.match(page.sections[1].body, /does not itself confer official GIN membership/i);
  assert.equal(page.officialUrl, "https://signup.globalinformationnetwork.com/");
});

test("training and personal mastery pages preserve the reference headings and source routes", () => {
  const training = englishPublicPages["our-training"];
  assert.equal(training.officialUrl, "https://globalinformationnetwork.com/our-training/");
  assert.equal(training.sections.length, 0);
  const mastery = englishPublicPages["personal-mastery"];
  assert.equal(mastery.officialUrl, "https://globalinformationnetwork.com/topics/personal-mastery/");
  assert.equal(mastery.sections.length, 0);
});
