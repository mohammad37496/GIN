import { permanentRedirect } from "next/navigation";

export default function LegacyEnglishPrivacyPolicyRedirect(): never {
  permanentRedirect("/en/privacy-policy-2");
}
