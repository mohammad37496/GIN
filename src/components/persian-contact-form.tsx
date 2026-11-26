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
  ["English", "انگلیسی"], ["French", "فرانسوی"], ["German", "آلمانی"], ["Spanish", "اسپانیایی"], ["Persian", "فارسی"],
  ["Hungarian", "مجاری"], ["Polish", "لهستانی"], ["Dutch", "هلندی"], ["Albanian", "آلبانیایی"], ["Bulgarian", "بلغاری"],
  ["Croatian", "کرواتی"], ["Czech", "چکی"], ["Danish", "دانمارکی"], ["Finnish", "فنلاندی"], ["Greek", "یونانی"],
  ["Italian", "ایتالیایی"], ["Norwegian", "نروژی"], ["Portuguese", "پرتغالی"], ["Romanian", "رومانیایی"],
  ["Russian", "روسی"], ["Serbian", "صربی"], ["Slovakian", "اسلواکی"], ["Slovenian", "اسلوونیایی"],
  ["Swedish", "سوئدی"], ["Turkish", "ترکی"], ["Ukrainian", "اوکراینی"], ["Afrikaans", "آفریکانس"], ["Arabic", "عربی"],
  ["Hindi", "هندی"], ["Japanese", "ژاپنی"], ["Korean", "کره‌ای"], ["Mandarin", "چینی ماندارین"], ["Thai", "تایلندی"],
  ["Indonesian", "اندونزیایی"], ["Tagalog", "تاگالوگ"],
] as const;

const initialForm = {
  firstName: "", lastName: "", email: "", confirmEmail: "", phone: "", addressLine1: "", addressLine2: "",
  city: "", stateRegion: "", postalCode: "", country: "", preferredLanguage: "English", secondaryLanguage: "",
  preferredContactMethods: [] as string[], telegramHandle: "", whatsappNumber: "",
  subject: "", message: "", smsConsent: false, legalConsent: false, item_6__fluent_sf: "",
};

type ContactFormState = typeof initialForm;

export default function PersianContactForm() {
  const [form, setForm] = useState<ContactFormState>(initialForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [addressFieldsLocked, setAddressFieldsLocked] = useState(Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY));
  const [localizedCountryLabels, setLocalizedCountryLabels] = useState<Record<string, string>>({});
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
      const mapped = mapGooglePlaceToAddress(autocomplete.getPlace());
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
  useEffect(() => {
    try {
      const names = new Intl.DisplayNames(["fa"], { type: "region" });
      setLocalizedCountryLabels(Object.fromEntries(contactCountryOptions.map((country) => {
        const localized = names.of(country.value);
        return [country.value, localized && localized !== country.value ? localized : country.label];
      })));
    } catch {
      setLocalizedCountryLabels({});
    }
  }, []);

  function update<K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateContactMethod(method: string, checked: boolean) {
    update("preferredContactMethods", checked ? [...form.preferredContactMethods, method] : form.preferredContactMethods.filter((value) => value !== method));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.email.trim().toLowerCase() !== form.confirmEmail.trim().toLowerCase()) {
      setError("نشانی‌های ایمیل یکسان نیستند.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await response.json();
      if (!response.ok) throw new Error("ثبت پیام انجام نشد. لطفاً اطلاعات و فیلدهای الزامی را بررسی کنید.");
      setNotice("درخواست شما با موفقیت در پورتال آموزشی ثبت شد.");
      setForm(initialForm);
    } catch (cause) {
      setError(cause instanceof Error && cause.message.startsWith("ثبت پیام") ? cause.message : "ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="support-form-panel persian-contact-form" aria-labelledby="persian-contact-form-title">
    <h2 id="persian-contact-form-title">فرم تماس پورتال آموزشی GIN</h2>
    <p>این فرم درخواست شما را در پایگاه داده همین پورتال آموزشی ثبت می‌کند و جایگزین سامانه تماس رسمی GIN نیست. برای تماس مستقیم با GIN، در روزهای کاری هفته از ساعت ۸ صبح تا ۵ عصر به وقت مرکزی آمریکا با شماره ‎+1 708-669-9544 تماس بگیرید.</p>
    <form onSubmit={submit} onInvalidCapture={(event) => { const field = event.target as HTMLInputElement; if (field.validity.valueMissing) field.setCustomValidity("تکمیل این فیلد الزامی است."); else if (field.validity.typeMismatch) field.setCustomValidity("نشانی ایمیل معتبر وارد کنید."); else if (field.validity.tooShort) field.setCustomValidity("لطفاً اطلاعات را کامل‌تر وارد کنید."); else if (field.validity.tooLong) field.setCustomValidity("مقدار واردشده بیش از حد مجاز است."); }} onInputCapture={(event) => (event.target as HTMLInputElement).setCustomValidity("")} aria-label="فرم تماس پورتال آموزشی GIN">
      {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && <Script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`} strategy="afterInteractive" onReady={initAddressAutocomplete} onError={() => setAddressFieldsLocked(false)} />}
      <div className="contact-form-grid">
        <label>نام<input name="firstName" value={form.firstName} onChange={(event) => update("firstName", event.target.value)} required maxLength={80} autoComplete="given-name" /></label>
        <label>نام خانوادگی<input name="lastName" value={form.lastName} onChange={(event) => update("lastName", event.target.value)} required maxLength={80} autoComplete="family-name" /></label>
        <label>ایمیل<input name="email" type="email" placeholder="you@domain.com" value={form.email} onChange={(event) => update("email", event.target.value)} required maxLength={254} autoComplete="email" /></label>
        <label>تکرار ایمیل<input name="confirmEmail" type="email" placeholder="نشانی ایمیل را دوباره وارد کنید" value={form.confirmEmail} onChange={(event) => update("confirmEmail", event.target.value)} required maxLength={254} autoComplete="email" /></label>
        <label>شماره تلفن<input name="phone" type="tel" placeholder="شماره همراه یا تلفن" value={form.phone} onChange={(event) => update("phone", event.target.value)} required minLength={7} maxLength={40} autoComplete="tel" /></label>
      </div>

      <fieldset className="contact-form-fieldset"><legend>نشانی پستی</legend><div className="contact-form-grid">
        <label>نشانی اصلی<input name="addressLine1" ref={addressInputRef} placeholder="نشانی اصلی" value={form.addressLine1} onChange={(event) => update("addressLine1", event.target.value)} required minLength={2} maxLength={180} autoComplete="address-line1" /></label>
        <label>نشانی تکمیلی (اختیاری)<input name="addressLine2" placeholder="واحد، طبقه و موارد مشابه" value={form.addressLine2} onChange={(event) => update("addressLine2", event.target.value)} maxLength={180} autoComplete="address-line2" /></label>
        <label>شهر<input name="city" className={addressFieldsLocked ? "contact-address-locked" : undefined} readOnly={addressFieldsLocked} placeholder="شهر" value={form.city} onChange={(event) => update("city", event.target.value)} required minLength={2} maxLength={100} autoComplete="address-level2" /></label>
        <label>استان یا منطقه<input name="stateRegion" className={addressFieldsLocked ? "contact-address-locked" : undefined} readOnly={addressFieldsLocked} placeholder="استان یا منطقه" value={form.stateRegion} onChange={(event) => update("stateRegion", event.target.value)} required minLength={2} maxLength={100} autoComplete="address-level1" /></label>
        <label>کد پستی<input name="postalCode" className={addressFieldsLocked ? "contact-address-locked" : undefined} readOnly={addressFieldsLocked} placeholder="کد پستی" value={form.postalCode} onChange={(event) => update("postalCode", event.target.value)} required minLength={2} maxLength={24} autoComplete="postal-code" /></label>
        <label>کشور<select name="country" className={addressFieldsLocked ? "contact-address-locked" : undefined} disabled={addressFieldsLocked} value={form.country} onChange={(event) => update("country", event.target.value)} required autoComplete="country-name"><option value="">انتخاب کشور</option>{contactCountryOptions.map((country) => <option value={country.value} key={country.value}>{localizedCountryLabels[country.value] ?? country.label}</option>)}</select></label>
      </div>{!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && <p className="contact-form-disclaimer">تکمیل خودکار نشانی در این محیط پیکربندی نشده است؛ لطفاً شهر، استان، کد پستی و کشور را به‌صورت دستی وارد کنید.</p>}</fieldset>

      <div className="contact-form-grid"><label>زبان ترجیحی<select name="preferredLanguage" value={form.preferredLanguage} onChange={(event) => update("preferredLanguage", event.target.value)} required><option value="">انتخاب زبان</option>{languages.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label>زبان دوم (اختیاری)<select name="secondaryLanguage" value={form.secondaryLanguage} onChange={(event) => update("secondaryLanguage", event.target.value)}><option value="">انتخاب زبان</option>{languages.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>

      <fieldset className="contact-form-fieldset"><legend>ترجیح می‌دهید از چه روشی با شما تماس گرفته شود؟</legend>
        <label className="contact-form-checkbox"><input type="checkbox" name="preferredContactMethods" value="Email" checked={form.preferredContactMethods.includes("Email")} onChange={(event) => updateContactMethod("Email", event.target.checked)} /> ایمیل</label>
        <label className="contact-form-checkbox"><input type="checkbox" name="preferredContactMethods" value="Telephone Call" checked={form.preferredContactMethods.includes("Telephone Call")} onChange={(event) => updateContactMethod("Telephone Call", event.target.checked)} /> تماس تلفنی</label>
        <label className="contact-form-checkbox"><input type="checkbox" name="preferredContactMethods" value="Telegram" checked={form.preferredContactMethods.includes("Telegram")} onChange={(event) => updateContactMethod("Telegram", event.target.checked)} /> تلگرام</label>
        <label className="contact-form-checkbox"><input type="checkbox" name="preferredContactMethods" value="WhatsApp" checked={form.preferredContactMethods.includes("WhatsApp")} onChange={(event) => updateContactMethod("WhatsApp", event.target.checked)} /> واتس‌اپ</label>
      </fieldset>
      {form.preferredContactMethods.includes("Telegram") && <label>نام کاربری تلگرام<input name="telegramHandle" placeholder="@username" value={form.telegramHandle} onChange={(event) => update("telegramHandle", event.target.value)} required maxLength={120} /></label>}
      {form.preferredContactMethods.includes("WhatsApp") && <label>شماره واتس‌اپ<input name="whatsappNumber" type="tel" placeholder="+1 3054323349" value={form.whatsappNumber} onChange={(event) => update("whatsappNumber", event.target.value)} required maxLength={40} /></label>}

      <label>موضوع<input name="subject" placeholder="موضوع پیام" value={form.subject} onChange={(event) => update("subject", event.target.value)} required minLength={3} maxLength={180} /></label>
      <label>متن پیام<textarea name="message" value={form.message} onChange={(event) => update("message", event.target.value)} required minLength={10} maxLength={10000} rows={6} /></label>
      <label className="contact-form-honeypot" aria-hidden="true">به‌روزرسانی‌ها<input name="item_6__fluent_sf" value={form.item_6__fluent_sf} onChange={(event) => update("item_6__fluent_sf", event.target.value)} tabIndex={-1} autoComplete="off" /></label>
      <label className="contact-form-checkbox contact-form-consent"><input type="checkbox" name="smsConsent" checked={form.smsConsent} onChange={(event) => update("smsConsent", event.target.checked)} /> با دریافت پیامک از شبکه جهانی اطلاعات موافقم. برای لغو، STOP و برای راهنما، HELP را پاسخ دهید. هزینه پیام و داده ممکن است اعمال شود و تعداد پیام‌ها متغیر است. <Link href="/privacy-policy">سیاست حفظ حریم خصوصی</Link></label>
      <label className="contact-form-checkbox contact-form-consent"><input type="checkbox" name="legalConsent" checked={form.legalConsent} onChange={(event) => update("legalConsent", event.target.checked)} required /> <span>سیاست حفظ حریم خصوصی و <Link href="/terms-of-use">شرایط استفاده</Link> را خوانده‌ام و می‌پذیرم.</span></label>
      <p className="contact-form-disclaimer">ترجیح دریافت پیامک همراه درخواست شما ذخیره می‌شود؛ ارسال خودکار پیامک در حال حاضر به این پورتال متصل نیست.</p>
      {error && <p className="contact-form-error" role="alert" aria-live="assertive">{error}</p>}
      {notice && <p className="contact-form-success" role="status" aria-live="polite">{notice}</p>}
      <button className="button" type="submit" disabled={busy}>{busy ? "در حال ارسال…" : "ارسال فرم تماس"}</button>
    </form>
  </section>;
}
