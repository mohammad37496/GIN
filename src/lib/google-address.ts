export type GoogleAddressComponent = { long_name: string; short_name: string; types: string[] };
export type GooglePlace = { address_components?: GoogleAddressComponent[]; formatted_address?: string; name?: string };

export type MappedGoogleAddress = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateRegion: string;
  postalCode: string;
  countryCode: string;
};

export function mapGooglePlaceToAddress(place: GooglePlace): MappedGoogleAddress {
  const components = place.address_components ?? [];
  const get = (type: string) => components.find((component) => component.types.includes(type))?.long_name ?? "";
  const getShort = (type: string) => components.find((component) => component.types.includes(type))?.short_name ?? "";
  const streetNumber = get("street_number");
  const route = getShort("route");

  return {
    addressLine1: [streetNumber, route].filter(Boolean).join(" ") || place.name || place.formatted_address || "",
    addressLine2: get("administrative_area_level_3") || get("administrative_area_level_4"),
    city: get("locality") || get("postal_town"),
    stateRegion: get("administrative_area_level_1") || get("administrative_area_level_2"),
    postalCode: [get("postal_code"), get("postal_code_suffix")].filter(Boolean).join("-"),
    countryCode: getShort("country"),
  };
}
