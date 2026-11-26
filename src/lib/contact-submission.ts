import { z } from "zod";
import { isContactCountryCode } from "@/lib/contact-countries";

const language = z.enum(["English", "French", "German", "Spanish", "Persian", "Hungarian", "Polish", "Dutch", "Albanian", "Bulgarian", "Croatian", "Czech", "Danish", "Finnish", "Greek", "Italian", "Norwegian", "Portuguese", "Romanian", "Russian", "Serbian", "Slovakian", "Slovenian", "Swedish", "Turkish", "Ukrainian", "Afrikaans", "Arabic", "Hindi", "Japanese", "Korean", "Mandarin", "Thai", "Indonesian", "Tagalog"]);
const contactMethod = z.enum(["Email", "Telephone Call", "Telegram", "WhatsApp"]);

export const contactSubmissionSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  confirmEmail: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(7).max(40),
  addressLine1: z.string().trim().min(2).max(180),
  addressLine2: z.string().trim().max(180).optional().default(""),
  city: z.string().trim().min(2).max(100),
  stateRegion: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(2).max(24),
  country: z.string().trim().length(2).refine(isContactCountryCode, "Select a valid country"),
  preferredLanguage: language,
  secondaryLanguage: z.union([language, z.literal("")]).optional().default(""),
  preferredContactMethods: z.array(contactMethod).max(4).default([]).refine((methods) => new Set(methods).size === methods.length, "Contact methods must be unique."),
  telegramHandle: z.string().trim().max(120).optional().default(""),
  whatsappNumber: z.string().trim().max(40).optional().default(""),
  subject: z.string().trim().min(3).max(180),
  message: z.string().trim().min(10).max(10000),
  smsConsent: z.boolean().default(false),
  legalConsent: z.literal(true),
  item_6__fluent_sf: z.string().max(200).optional().default(""),
}).superRefine((value, context) => {
  if (value.email !== value.confirmEmail) context.addIssue({ code: "custom", path: ["confirmEmail"], message: "Email addresses do not match." });
  if (value.preferredContactMethods.includes("Telegram") && !value.telegramHandle.trim()) {
    context.addIssue({ code: "custom", path: ["telegramHandle"], message: "Enter your Telegram username when Telegram is selected." });
  }
  if (value.preferredContactMethods.includes("WhatsApp") && !value.whatsappNumber.trim()) {
    context.addIssue({ code: "custom", path: ["whatsappNumber"], message: "Enter your WhatsApp number when WhatsApp is selected." });
  }
});

export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;
