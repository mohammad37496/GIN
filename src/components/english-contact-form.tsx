"use client";

import Link from "next/link";
import Script from "next/script";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { contactCountryOptions, isContactCountryCode } from "@/lib/contact-countries";
import { mapGooglePlaceToAddress, type GooglePlace } from "@/lib/google-address";

type GoogleMapsListener = { remove: () => void };
type GoogleAutocomplete = { addListener: (event: string, callback: () => void) => GoogleMapsListener; getPlace: () => GooglePlace };
type GoogleMapsWindow = Window & { google?: { maps?: { places?: { Autocomplete: new (input: HTMLInputElement, options: { types: string[]; fields: string[] }) => GoogleAutocomplete } } } };

const languages = [
  ["English", "English"], ["French", "French"], ["German", "German"], ["Spanish", "Spanish"], ["Persian", "Persian"],
  ["Hungarian", "Hungarian"], ["Polish", "Polish"], ["Dutch", "Dutch"], ["Albanian", "Albanian"], ["Bulgarian", "Bulgarian"],
  ["Croatian", "Croatian"], ["Czech", "Czech"], ["Danish", "Danish"], ["Finnish", "Finnish"], ["Greek", "Greek"],
  ["Italian", "Italian"], ["Norwegian", "Norwegian"], ["Portuguese", "Portuguese"], ["Romanian", "Romanian"],
  ["Russian", "Russian"], ["Serbian", "Serbian"], ["Slovakian", "Slovakian"], ["Slovenian", "Slovenian"],
  ["Swedish", "Swedish"], ["Turkish", "Turkish"], ["Ukrainian", "Ukrainian"], ["Afrikaans", "Afrikaans"], ["Arabic", "Arabic"],
  ["Hindi", "Hindi"], ["Japanese", "Japanese"], ["Korean", "Korean"], ["Mandarin", "Mandarin"], ["Thai", "Thai"],
  ["Indonesian", "Indonesian"], ["Tagalog", "Tagalog"],
];

const initialForm = {
  firstName: "", lastName: "", email: "", confirmEmail: "", phone: "", addressLine1: "", addressLine2: "",
  city: "", stateRegion: "", postalCode: "", country: "", preferredLanguage: "English", secondaryLanguage: "",
  preferredContactMethods: [] as string[], telegramHandle: "", whatsappNumber: "",
  subject: "", message: "", smsConsent: false, legalConsent: false, item_6__fluent_sf: "",
};

type ContactFormState = typeof initialForm;

export default function EnglishContactForm() {
  const [form, setForm] = useState<ContactFormState>(initialForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [addressFieldsLocked, setAddressFieldsLocked] = useState(Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY));
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteListenerRef = useRef<GoogleMapsListener | null>(null);

  const initAddressAutocomplete = useCallback(() => {
    const autocompleteConstructor = (window as GoogleMapsWindow).google?.maps?.places?.Autocomplete;
    if (!autocompleteConstructor || !addressInputRef.current) {
      setAddressFieldsLocked(false);
      return;
    }
    const autocomplete = new autocompleteConstructor(addressInputRef.current, { types: ["address"], fields: ["address_components", "formatted_address"] });
    autocompleteListenerRef.current?.remove();
    autocompleteListenerRef.current = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const mapped = mapGooglePlaceToAddress(place);
      const country = isContactCountryCode(mapped.countryCode) ? mapped.countryCode : "";
      setForm((current) => ({
        ...current,
        addressLine1: mapped.addressLine1,
        addressLine2: mapped.addressLine2,
        city: mapped.city,
        stateRegion: mapped.stateRegion,
        postalCode: mapped.postalCode,
        country,
      }));
      setAddressFieldsLocked(Boolean(mapped.addressLine1 && mapped.city && mapped.stateRegion && mapped.postalCode && country));
    });
    setAddressFieldsLocked(true);
  }, []);

  useEffect(() => () => autocompleteListenerRef.current?.remove(), []);

  function update<K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateContactMethod(method: string, checked: boolean) {
    update("preferredContactMethods", checked ? [...form.preferredContactMethods, method] : form.preferredContactMethods.filter((value) => value !== method));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your message could not be saved. Please check the required fields.");
      setNotice(data.notice || "Your message has been recorded.");
      setForm(initialForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your message could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="gin-en-contact-form gin-en-auth">
    <h2>Contact Us ENG</h2>
    <p>Complete the form and the portal support team will review your message. For direct assistance from GIN, call +1 708-669-9544 during weekday business hours (8:00 AM–5:00 PM Central).</p>
    <form onSubmit={submit}>
      {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && <Script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`} strategy="afterInteractive" onReady={initAddressAutocomplete} onError={() => setAddressFieldsLocked(false)} />}
      <div className="gin-en-form-grid">
        <label>First Name<input value={form.firstName} onChange={(event) => update("firstName", event.target.value)} required maxLength={80} autoComplete="given-name" /></label>
        <label>Last Name<input value={form.lastName} onChange={(event) => update("lastName", event.target.value)} required maxLength={80} autoComplete="family-name" /></label>
        <label>Email<input type="email" placeholder="you@domain.com" value={form.email} onChange={(event) => update("email", event.target.value)} required maxLength={254} autoComplete="email" /></label>
        <label>Confirm Your Email<input type="email" placeholder="Email Address" value={form.confirmEmail} onChange={(event) => update("confirmEmail", event.target.value)} required maxLength={254} autoComplete="email" /></label>
        <label>Phone Number<input type="tel" placeholder="Mobile Number" value={form.phone} onChange={(event) => update("phone", event.target.value)} required maxLength={40} autoComplete="tel" /></label>
      </div>
      <fieldset className="gin-en-fieldset gin-en-address-fieldset"><legend>Mailing Address</legend><div className="gin-en-form-grid">
        <label>Address Line 1<input ref={addressInputRef} placeholder="Address Line 1" value={form.addressLine1} onChange={(event) => update("addressLine1", event.target.value)} required maxLength={180} autoComplete="address-line1" /></label>
        <label>Address Line 2<input placeholder="Address Line 2" value={form.addressLine2} onChange={(event) => update("addressLine2", event.target.value)} maxLength={180} autoComplete="address-line2" /></label>
        <label>City<input className={addressFieldsLocked ? "gin-en-address-locked" : undefined} readOnly={addressFieldsLocked} placeholder="City" value={form.city} onChange={(event) => update("city", event.target.value)} required maxLength={100} autoComplete="address-level2" /></label>
        <label>State<input className={addressFieldsLocked ? "gin-en-address-locked" : undefined} readOnly={addressFieldsLocked} placeholder="State" value={form.stateRegion} onChange={(event) => update("stateRegion", event.target.value)} required minLength={2} maxLength={100} autoComplete="address-level1" /></label>
        <label>Zip/Postal Code<input className={addressFieldsLocked ? "gin-en-address-locked" : undefined} readOnly={addressFieldsLocked} placeholder="00000" value={form.postalCode} onChange={(event) => update("postalCode", event.target.value)} required minLength={2} maxLength={24} autoComplete="postal-code" /></label>
      <label>Country<select className={addressFieldsLocked ? "gin-en-address-locked" : undefined} disabled={addressFieldsLocked} value={form.country} onChange={(event) => update("country", event.target.value)} required autoComplete="country-name"><option value="">Select Country</option>{contactCountryOptions.map((country) => <option value={country.value} key={country.value}>{country.label}</option>)}</select></label>
      </div>{!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && <p className="gin-en-form-disclaimer">Address autocomplete is not configured; please enter your city, state, postal code and country manually.</p>}</fieldset>
      <div className="gin-en-form-grid"><label>Preferred Language<select value={form.preferredLanguage} onChange={(event) => update("preferredLanguage", event.target.value)} required><option value="">– Select –</option>{languages.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label>Secondary Language (Optional)<select value={form.secondaryLanguage} onChange={(event) => update("secondaryLanguage", event.target.value)}><option value="">– Select –</option>{languages.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>

      <fieldset className="gin-en-fieldset"><legend>Would you prefer communicate via a telephone call or email?</legend>
        <label className="gin-en-checkbox-label"><input type="checkbox" checked={form.preferredContactMethods.includes("Email")} onChange={(event) => updateContactMethod("Email", event.target.checked)} /> Email</label>
        <label className="gin-en-checkbox-label"><input type="checkbox" checked={form.preferredContactMethods.includes("Telephone Call")} onChange={(event) => updateContactMethod("Telephone Call", event.target.checked)} /> Telephone Call</label>
        <label className="gin-en-checkbox-label"><input type="checkbox" checked={form.preferredContactMethods.includes("Telegram")} onChange={(event) => updateContactMethod("Telegram", event.target.checked)} /> Telegram</label>
        <label className="gin-en-checkbox-label"><input type="checkbox" checked={form.preferredContactMethods.includes("WhatsApp")} onChange={(event) => updateContactMethod("WhatsApp", event.target.checked)} /> WhatsApp</label>
      </fieldset>
      {form.preferredContactMethods.includes("Telegram") && <label>Enter Your Telegram Username<input placeholder="@username" value={form.telegramHandle} onChange={(event) => update("telegramHandle", event.target.value)} required maxLength={120} /></label>}
      {form.preferredContactMethods.includes("WhatsApp") && <label>Enter Your WhatsApp Number<input type="tel" placeholder="+1 3054323349" value={form.whatsappNumber} onChange={(event) => update("whatsappNumber", event.target.value)} required maxLength={40} /></label>}

      <label>Subject<input placeholder="Type your subject" value={form.subject} onChange={(event) => update("subject", event.target.value)} required minLength={3} maxLength={180} /></label>
      <label>Message<textarea value={form.message} onChange={(event) => update("message", event.target.value)} required minLength={10} maxLength={10000} rows={6} /></label>
      <label className="gin-en-honeypot" aria-hidden="true">Updates<input name="item_6__fluent_sf" value={form.item_6__fluent_sf} onChange={(event) => update("item_6__fluent_sf", event.target.value)} tabIndex={-1} autoComplete="off" /></label>
 <label className="gin-en-checkbox-label gin-en-sms-consent"><input type="checkbox" checked={form.smsConsent} onChange={(event) => update("smsConsent", event.target.checked)} /> I consent to receive SMS from the Global Information Network. Reply STOP to opt-out; Reply HELP for assistance; Message and data rates apply; Messaging frequency may vary. For more information visit the <Link href="/en/privacy-policy-2">Privacy Policy</Link> and <Link href="/en/terms-of-use">Terms of Service</Link>.</label>
 <label className="gin-en-checkbox-label gin-en-legal-consent"><input type="checkbox" checked={form.legalConsent} onChange={(event) => update("legalConsent", event.target.checked)} required /> I have read and agree to the <Link href="/en/privacy-policy-2">Privacy Policy</Link> and <Link href="/en/terms-of-use">Terms of Service</Link>.</label>
      <p className="gin-en-form-disclaimer">This portal records your SMS consent preference with your request. Automated SMS delivery is not currently connected to this portal.</p>
      {error && <p className="gin-en-form-error" role="alert">{error}</p>}
      {notice && <p className="gin-en-form-success" role="status">{notice}</p>}
      <button className="gin-en-button" disabled={busy}>{busy ? "Submitting…" : "Submit Form"}</button>
    </form>
  </section>;
}
