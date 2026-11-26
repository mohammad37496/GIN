import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import { ginHotelImages } from "./gin-hotels";

test("GIN hotel gallery preserves all 52 reference caption and image pairs", async () => {
  assert.equal(ginHotelImages.length, 52);
  assert.equal(new Set(ginHotelImages.map((hotel) => hotel.basename)).size, 52);
  assert.equal(ginHotelImages.filter((hotel) => hotel.uploadYear === 2022).length, 46);
  assert.equal(ginHotelImages.filter((hotel) => hotel.uploadYear === 2024).length, 6);

  await Promise.all(ginHotelImages.map((hotel) => access(new URL(`../../public/gin/hotels/${hotel.uploadYear === 2024 ? "2024-08" : "2022-04"}/${hotel.basename}`, import.meta.url))));
});
