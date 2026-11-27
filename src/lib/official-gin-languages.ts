import { officialPublicLocales } from "./official-public-locales";

export const officialGinLanguages = Object.entries(officialPublicLocales).map(([code, locale]) => ({
  code,
  label: locale.label,
  href: locale.sourceHomeUrl,
  localPath: locale.homePath,
  paths: { homePath: locale.homePath, aboutPath: locale.aboutPath, contactPath: locale.contactPath },
})) as ReadonlyArray<{ code: string; label: string; href: string; localPath: string; paths: { homePath: string; aboutPath: string; contactPath: string } }>;
