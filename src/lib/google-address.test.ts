import assert from "node:assert/strict";
import test from "node:test";
import { mapGooglePlaceToAddress } from "./google-address";

test("Google Places maps address components and the country short_name into the reference form fields", () => {
  const mapped = mapGooglePlaceToAddress({
    name: "100 Main St",
    formatted_address: "100 Main St, Chicago, IL 60601, USA",
    address_components: [
      { long_name: "100", short_name: "100", types: ["street_number"] },
      { long_name: "Main Street", short_name: "Main St", types: ["route"] },
      { long_name: "Chicago", short_name: "Chicago", types: ["locality", "political"] },
      { long_name: "Illinois", short_name: "IL", types: ["administrative_area_level_1", "political"] },
      { long_name: "60601", short_name: "60601", types: ["postal_code"] },
      { long_name: "1234", short_name: "1234", types: ["postal_code_suffix"] },
      { long_name: "United States", short_name: "US", types: ["country", "political"] },
    ],
  });

  assert.deepEqual(mapped, {
    addressLine1: "100 Main St",
    addressLine2: "",
    city: "Chicago",
    stateRegion: "Illinois",
    postalCode: "60601-1234",
    countryCode: "US",
  });
});

test("Google Places uses postal town and administrative area fallbacks without mistaking a county for a city", () => {
  const mapped = mapGooglePlaceToAddress({
    address_components: [
      { long_name: "Oxford", short_name: "Oxford", types: ["postal_town"] },
      { long_name: "Oxfordshire", short_name: "Oxfordshire", types: ["administrative_area_level_2", "political"] },
      { long_name: "United Kingdom", short_name: "GB", types: ["country", "political"] },
    ],
  });

  assert.equal(mapped.city, "Oxford");
  assert.equal(mapped.stateRegion, "Oxfordshire");
  assert.equal(mapped.countryCode, "GB");
});
