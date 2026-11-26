import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { ginHotelImages } from "./gin-hotels";
import { publicPages } from "./public-pages";

test("GIN hotel gallery preserves all 52 reference caption and image pairs", async () => {
  assert.equal(ginHotelImages.length, 52);
  assert.equal(new Set(ginHotelImages.map((hotel) => hotel.basename)).size, 52);
  assert.equal(ginHotelImages.filter((hotel) => hotel.uploadYear === 2022).length, 46);
  assert.equal(ginHotelImages.filter((hotel) => hotel.uploadYear === 2024).length, 6);

  await Promise.all(ginHotelImages.map((hotel) => access(new URL(`../../public/gin/hotels/${hotel.uploadYear === 2024 ? "2024-08" : "2022-04"}/${hotel.basename}`, import.meta.url))));
});

test("Persian hotel page renders the same 52 official gallery entries and does not imply current booking availability", async () => {
  const component = await readFile(new URL("../components/persian-hotel-gallery.tsx", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(component, /ginHotelImages\.map/);
  assert.match(component, /alt=\{hotel\.caption\}/);
  assert.match(route, /slug === "hotels" && <PersianHotelGallery\/>/);
  assert.match(route, /Link href="\/fa"/);
  assert.match(route, /"\/fa\/contact" : "\/fa\/register"/);
  assert.match(publicPages.hotels.sections[0].body, /۵۲ تصویر/);
  assert.match(publicPages.hotels.sections[1].body, /رزرو/);
});

test("Persian legacy reference pages describe official GIN benefits, the five-part system, and the feasibility-only cruise concept", () => {
  assert.ok(publicPages["member-benefits"].sections.some((section) => /بلیت رایگان/.test(section.body)));
  assert.equal(publicPages["success-system"].sections.length, 5);
  assert.ok(publicPages["success-system"].sections.some((section) => /قدردانی/.test(section.title)));
  assert.match(publicPages.cruise.intro, /مفهوم پیشنهادی/);
  assert.match(publicPages.cruise.sections[2].body, /رزرو یا سرمایه‌گذاری/);
  assert.ok(publicPages.faq.sections.length >= 15);
});
