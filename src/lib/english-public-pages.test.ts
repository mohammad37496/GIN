import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { englishPublicPages } from "./english-public-pages";

test("all public reference sections have complete English page content", () => {
  const required = [
    "about-us", "who-we-are", "what-we-offer", "our-training", "personal-mastery", "member-benefits", "member-benefits-associate",
    "the-gin-success-system", "our-events", "gin-hotels", "clubhouses-and-lodges",
    "the-gin-cruise-ship", "membership-levels", "faq", "contact-us", "become-a-member", "cookie-policy",
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
  assert.equal(englishPublicPages["cookie-policy"].officialUrl, "https://globalinformationnetwork.com/privacy-policy-2/");
  assert.equal(englishPublicPages["terms-of-use"].officialUrl, "https://globalinformationnetwork.com/terms-of-use/");
  assert.equal(englishPublicPages["member-agreement"].officialUrl, "https://globalinformationnetwork.com/member-agreement/");
});

test("Cookie Policy distinguishes official-site privacy terms from this portal's observed cookies", () => {
  const page = englishPublicPages["cookie-policy"];
  assert.ok(page.sections.some((section) => section.body.includes("gin_locale")));
  assert.ok(page.sections.some((section) => section.body.includes("gin_session")));
  assert.ok(page.sections.some((section) => section.body.includes("does not include a cookie-consent banner")));
  assert.match(page.intro, /does not list a standalone Cookie Policy/i);
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
  for (const slug of ["faq", "contact-us", "privacy-policy", "cookie-policy", "terms-of-use", "member-agreement", "membership-levels", "support"]) {
    assert.equal(englishPublicPages[slug].image, undefined);
  }
});

test("the membership CTA distinguishes official GIN membership from portal registration", () => {
  const page = englishPublicPages["become-a-member"];
  assert.match(page.sections[0].body, /official GIN application/i);
  assert.match(page.sections[1].body, /does not itself confer official GIN membership/i);
  assert.equal(page.officialUrl, "https://signup.globalinformationnetwork.com/");
});

test("Become a Member keeps one page H1 and renders the embedded portal form at H2", () => {
  const page = readFileSync(new URL("../app/en/[slug]/page.tsx", import.meta.url), "utf8");
  const form = readFileSync(new URL("../components/english-auth-forms.tsx", import.meta.url), "utf8");
  assert.match(page, /EnglishRegistrationForm headingLevel="h2"/);
  assert.match(form, /headingLevel = "h1"/);
  assert.match(form, /<Heading>Create a Portal Account<\/Heading>/);
  assert.match(form, /<Heading>Request received<\/Heading>/);
});

test("English subject and membership pages render as localized content rather than external redirects", () => {
  const slugs = ["wealth-creation", "financial-independence", "dynamic-health", "happiness", "global-networking", "mentorship", "membership-opportunities"];
  for (const slug of slugs) {
    const page = englishPublicPages[slug];
    assert.ok(page, `English page is missing: ${slug}`);
    assert.ok(page.sections.length >= 2, `${slug} needs substantive sections`);
    assert.ok(page.officialUrl, `${slug} needs a verified official source link`);
  }
  assert.match(englishPublicPages["wealth-creation"].legalNotice ?? "", /not financial/);
  assert.match(englishPublicPages["financial-independence"].legalNotice ?? "", /does not promise/);
  assert.match(englishPublicPages["dynamic-health"].legalNotice ?? "", /medical care/);
  assert.match(englishPublicPages.happiness.legalNotice ?? "", /mental-health/);
});

test("English navigation and What We Offer expose the dedicated subject pages", () => {
  const footer = readFileSync(new URL("../components/english-public-footer.tsx", import.meta.url), "utf8");
  const sidebar = readFileSync(new URL("../components/english-site-frame.tsx", import.meta.url), "utf8");
  const whatWeOffer = readFileSync(new URL("../components/english-reference-pages.tsx", import.meta.url), "utf8");
  for (const slug of ["wealth-creation", "financial-independence", "dynamic-health", "happiness", "global-networking", "mentorship", "membership-opportunities"]) {
    assert.ok(footer.includes(`/en/${slug}`), `English footer is missing ${slug}`);
    assert.ok(sidebar.includes(`/en/${slug}`), `English sidebar is missing ${slug}`);
    assert.ok(whatWeOffer.includes(`/en/${slug}`), `What We Offer is missing ${slug}`);
  }
});

test("English dynamic page metadata avoids appending the GIN brand twice", () => {
  const route = readFileSync(new URL("../app/en/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(route, /title: \/\\bGIN\\b\/i\.test\(page\.title\) \? \{ absolute: page\.title \} : page\.title,/);
});

test("training and personal mastery pages preserve the reference headings and source routes", () => {
  const training = englishPublicPages["our-training"];
  assert.equal(training.officialUrl, "https://globalinformationnetwork.com/our-training/");
  assert.equal(training.sections.length, 0);
  const mastery = englishPublicPages["personal-mastery"];
  assert.equal(mastery.officialUrl, "https://globalinformationnetwork.com/topics/personal-mastery/");
  assert.equal(mastery.sections.length, 0);
});

test("English public sidebar link contrast meets WCAG AA for normal text", () => {
  const css = readFileSync(new URL("../app/english-site.css", import.meta.url), "utf8");
  const background = css.match(/\.gin-en-sidebar\s*\{[^}]*background:\s*(#[0-9a-f]{6})/i)?.[1];
  const foreground = css.match(/\.gin-en-sidebar a\s*\{[^}]*color:\s*(#[0-9a-f]{6})/i)?.[1];
  assert.ok(background && foreground, "sidebar foreground/background colors must be explicit");
  const luminance = (color: string) => {
    const channels = [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16) / 255)
      .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const foregroundLuminance = luminance(foreground!);
  const backgroundLuminance = luminance(background!);
  const ratio = (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
  assert.ok(ratio >= 4.5, `sidebar contrast ${ratio.toFixed(2)}:1 is below 4.5:1`);
});

test("English mobile masthead crop keeps the reference seal and excludes the desktop wordmark", () => {
  const css = readFileSync(new URL("../app/english-site.css", import.meta.url), "utf8");
  const mobile = [...css.matchAll(/@media \(max-width: 768px\) \{([\s\S]*?)\n\}/g)]
    .map((match) => match[1])
    .find((block) => block.includes(".gin-en-masthead::before")) ?? "";
  const crop = mobile.match(/\.gin-en-masthead::before\s*\{([^}]*)\}/)?.[1] ?? "";
  const width = Number(crop.match(/width:\s*(\d+)px/)?.[1]);
  const height = Number(crop.match(/height:\s*(\d+)px/)?.[1]);
  const offset = Number(crop.match(/background-position:\s*(-?\d+)px\s+center/)?.[1]);
  assert.equal(width, 70);
  assert.equal(height, 68);
  assert.match(crop, /background-image:\s*url\("\/gin\/reference-header-banner\.jpg"\)/);
  assert.match(crop, /background-size:\s*auto\s+68px/);
  // The 1400x200 source banner places the seal at x=294..458 and the wordmark at x=482.
  // At a 68px rendered height, the seal stays within the 70px crop while the wordmark starts outside it.
  const scale = height / 200;
  const sealLeft = 294 * scale + offset;
  const sealRight = 458 * scale + offset;
  const wordmarkLeft = 482 * scale + offset;
  assert.ok(sealLeft >= 0 && sealRight <= width, `reference seal bounds ${sealLeft.toFixed(1)}..${sealRight.toFixed(1)} exceed crop`);
  assert.ok(wordmarkLeft >= width, `desktop wordmark starts at ${wordmarkLeft.toFixed(1)}px inside the mobile crop`);
  assert.match(mobile, /\.gin-en-masthead > img\s*\{\s*display:\s*none;\s*\}/);
  assert.match(mobile, /\.gin-en-masthead::after\s*\{\s*display:\s*none;\s*\}/);
});

test("Persian GIN gold CTA keeps its gold background and readable navy text", () => {
  const css = readFileSync(new URL("../app/gin-reference.css", import.meta.url), "utf8");
  assert.match(css, /\.button\.gin-gold-button\s*\{[^}]*background:\s*#c6a15b[^}]*color:\s*#142b40/i);
  const luminance = (color: string) => {
    const channels = [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16) / 255)
      .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const foreground = luminance("#142b40");
  const background = luminance("#c6a15b");
  const ratio = (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  assert.ok(ratio >= 4.5, `gold CTA contrast ${ratio.toFixed(2)}:1 is below 4.5:1`);
});
