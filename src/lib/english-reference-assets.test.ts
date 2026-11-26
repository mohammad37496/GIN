import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("reference pages use the captured event embeds and local source imagery", async () => {
  const source = await readFile(new URL("../components/english-reference-pages.tsx", import.meta.url), "utf8");
  for (const id of [
    "9d916f6f-12a5-4580-a11e-b0681c5f14bb",
    "3d3338c0-56f8-4db2-b400-e6492cecf320",
    "79e130ef-1ef9-40b4-b19f-5850aebfeced",
  ]) assert.ok(source.includes(id), `missing official event embed ${id}`);
  for (const asset of [
    "about-adventure.webp", "about-friendships.webp", "who-wealth.webp", "who-happiness.webp", "who-health.webp",
    "what-enlightenment.jpg", "our-training.webp", "associate-level-graphic.jpeg", "associate-benefits.webp",
    "associate-why-upgrade.webp", "associate-testimonial-gabor.jpg", "associate-testimonial-maurice.webp",
    "associate-testimonial-andrew.webp", "events-networking.webp", "events-training-ballroom.jpg",
    "clubhouse-2024.webp", "clubhouse-castle.jpg", "clubhouse-manor.jpg", "clubhouse-paris.webp", "gin-ship-freedom.webp",
  ]) await access(new URL(`../../public/gin/reference-pages/${asset}`, import.meta.url));
  for (const asset of ["oldsystem-4.webp", "levels-footer.png", "gin-family-reunion.jpg", "paris-intercontinental.webp"]) {
    await access(new URL(`../../public/gin/${asset}`, import.meta.url));
  }
});
