import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("GIN logo variants and social artwork have production dimensions", async () => {
  const [primary, reversed, mark, social, socialPng, appleIcon] = await Promise.all([
    read("public/gin/gin-logo.svg"),
    read("public/gin/gin-logo-light.svg"),
    read("public/gin/gin-mark.svg"),
    read("public/gin/gin-social-card.svg"),
    readFile(fileURLToPath(new URL("../public/gin/gin-social-card.png", import.meta.url))),
    readFile(fileURLToPath(new URL("../public/apple-touch-icon.png", import.meta.url))),
  ]);

  assert.match(primary, /viewBox="0 0 640 144"/);
  assert.match(reversed, /fill="#FFFFFF"/);
  assert.match(primary, /GLOBAL INFORMATION NETWORK/);
  assert.match(reversed, /GLOBAL INFORMATION NETWORK/);
  assert.match(mark, /viewBox="0 0 128 128"/);
  assert.match(social, /viewBox="0 0 1200 630"/);
  assert.match(social, /GLOBAL INFORMATION NETWORK/);
  assert.equal(socialPng.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(socialPng.readUInt32BE(16), 1200);
  assert.equal(socialPng.readUInt32BE(20), 630);
  assert.equal(appleIcon.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(appleIcon.readUInt32BE(16), 180);
  assert.equal(appleIcon.readUInt32BE(20), 180);
});

test("public, authentication, staff, certificate, and fallback surfaces share GIN branding", async () => {
  const paths = [
    "src/components/public-header.tsx",
    "src/components/public-footer.tsx",
    "src/app/login/page.tsx",
    "src/app/register/page.tsx",
    "src/app/admin/page.tsx",
    "src/app/events-manager/page.tsx",
    "src/app/finance-center/page.tsx",
    "src/app/instructor/page.tsx",
    "src/app/support-center/page.tsx",
    "src/app/certificates/[publicId]/page.tsx",
    "src/app/error.tsx",
    "src/app/not-found.tsx",
    "src/components/portal-loading.tsx",
  ];
  const contents = await Promise.all(paths.map(read));
  for (let index = 0; index < paths.length; index += 1) {
    assert.match(contents[index], /GinLogo|StaffHeader|GinMark|PortalLoading/, `${paths[index]} must use a shared GIN brand component`);
  }
  assert.ok(contents[1].includes("Global Information Network"));
  assert.ok(!contents[1].includes("GIN Learning Network"));
  assert.match(contents[1], /variant="light"/);
  assert.match(contents[9], /GinMark/);
  const staffHeader = await read("src/components/staff-header.tsx");
  assert.match(staffHeader, /GinLogo/);
  assert.match(staffHeader, /staff-brand-compact/);
  const brandCss = await read("src/app/brand.css");
  assert.match(brandCss, /@media \(max-width: 580px\)/);
  assert.match(brandCss, /staff-brand-compact \{ display: inline-flex/);
  assert.match(brandCss, /reference-brand \{ max-width: min\(78vw, 300px\)/);
});

test("site metadata publishes the branded social card, Apple icon, and install manifest", async () => {
  const [layout, manifest, icon] = await Promise.all([
    read("src/app/layout.tsx"),
    read("src/app/manifest.ts"),
    read("src/app/icon.svg"),
  ]);
  assert.match(layout, /openGraph:[\s\S]*gin-social-card\.png/);
  assert.match(layout, /summary_large_image/);
  assert.match(layout, /metadataBase/);
  assert.match(layout, /apple-touch-icon\.png/);
  assert.match(manifest, /Global Information Network/);
  assert.match(manifest, /theme_color/);
  assert.match(icon, /viewBox="0 0 128 128"/);
});

test("the retired reference header banner is no longer distributed as a logo", async () => {
  const [header, footer, sources] = await Promise.all([
    read("src/components/public-header.tsx"),
    read("src/components/public-footer.tsx"),
    read("public/gin/SOURCES.md"),
  ]);
  for (const content of [header, footer, sources]) assert.ok(!content.includes("gin-header-banner.jpg"));
});
