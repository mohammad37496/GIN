import assert from "node:assert/strict";
import test from "node:test";
import { contactSubmissionSchema } from "./contact-submission";

const validContact = {
  firstName: "Alex",
  lastName: "Morgan",
  email: "ALEX@example.com",
  confirmEmail: "alex@example.com",
  phone: "+1 708 669 9544",
  addressLine1: "100 Main Street",
  addressLine2: "Suite 4",
  city: "Chicago",
  stateRegion: "Illinois",
  postalCode: "60601",
  country: "US",
  preferredLanguage: "English",
  secondaryLanguage: "",
  preferredContactMethods: ["Email"],
  telegramHandle: "",
  whatsappNumber: "",
  subject: "Membership information",
  message: "Please send me more information about the membership process.",
  smsConsent: false,
  legalConsent: true,
  item_6__fluent_sf: "",
};

test("contact submission normalizes email and accepts optional contact channels", () => {
  const parsed = contactSubmissionSchema.safeParse(validContact);
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.email, "alex@example.com");
    assert.equal(parsed.data.secondaryLanguage, "");
  }
});

test("contact submission rejects mismatched confirmation email", () => {
  const parsed = contactSubmissionSchema.safeParse({ ...validContact, confirmEmail: "other@example.com" });
  assert.equal(parsed.success, false);
});

test("contact submission requires acceptance of the privacy policy and terms", () => {
  assert.equal(contactSubmissionSchema.safeParse({ ...validContact, legalConsent: false }).success, false);
  assert.equal(contactSubmissionSchema.safeParse({ ...validContact, legalConsent: true }).success, true);
});

test("contact submission accepts only a country code from the exact reference select", () => {
  assert.equal(contactSubmissionSchema.safeParse({ ...validContact, country: "US" }).success, true);
  assert.equal(contactSubmissionSchema.safeParse({ ...validContact, country: "XX" }).success, false);
});

test("preferred contact channels are optional and selected messaging channels require their address", () => {
  assert.equal(contactSubmissionSchema.safeParse({ ...validContact, preferredContactMethods: [] }).success, true);
  assert.equal(contactSubmissionSchema.safeParse({ ...validContact, preferredContactMethods: ["Email", "Telephone Call"] }).success, true);
  assert.equal(contactSubmissionSchema.safeParse({ ...validContact, preferredContactMethods: ["Telegram"] }).success, false);
  assert.equal(contactSubmissionSchema.safeParse({ ...validContact, preferredContactMethods: ["WhatsApp"] }).success, false);
  assert.equal(contactSubmissionSchema.safeParse({ ...validContact, preferredContactMethods: ["Telegram"], telegramHandle: "@alex" }).success, true);
  assert.equal(contactSubmissionSchema.safeParse({ ...validContact, preferredContactMethods: ["WhatsApp"], whatsappNumber: "+1 555 0100" }).success, true);
  assert.equal(contactSubmissionSchema.safeParse({ ...validContact, preferredContactMethods: ["Email", "Email"] }).success, false);
});

test("contact honeypot accepts bot markers for silent rejection by the route", () => {
  const parsed = contactSubmissionSchema.safeParse({ ...validContact, item_6__fluent_sf: "https://spam.example" });
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.item_6__fluent_sf, "https://spam.example");
});

test("contact language selection accepts the reference options and requires a preferred language", () => {
  assert.equal(contactSubmissionSchema.safeParse({ ...validContact, preferredLanguage: "Mandarin" }).success, true);
  assert.equal(contactSubmissionSchema.safeParse({ ...validContact, preferredLanguage: "Tagalog" }).success, true);
  assert.equal(contactSubmissionSchema.safeParse({ ...validContact, preferredLanguage: "" }).success, false);
});
