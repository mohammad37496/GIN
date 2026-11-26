import type { Metadata } from "next";

export type LessonMetadataLocale = "fa" | "en";

export function hasUsableLessonTranslation(title?: string | null, content?: string | null) {
  const normalizedTitle = title?.trim();
  return Boolean(normalizedTitle && !/^translation pending$/i.test(normalizedTitle) && content?.trim());
}

export function buildLessonMetadata(input: {
  locale: LessonMetadataLocale;
  slug: string;
  lessonId: number;
  title: string | null | undefined;
  summary?: string | null;
  isPreview: boolean;
  hasTranslation?: boolean;
  hasCounterpartTranslation?: boolean;
}): Metadata {
  if (!Number.isSafeInteger(input.lessonId) || input.lessonId < 1) {
    return {
      title: input.locale === "en" ? "Lesson | GIN Learning Library" : "درس | کتابخانه آموزشی GIN",
      robots: { index: false, follow: false },
    };
  }
  const faPath = `/fa/courses/${encodeURIComponent(input.slug)}/lessons/${input.lessonId}`;
  const enPath = `/en/courses/${encodeURIComponent(input.slug)}/lessons/${input.lessonId}`;
  const translatedTitle = input.title?.trim();
  const hasUsableTitle = Boolean(translatedTitle && !/^translation pending$/i.test(translatedTitle));
  const title = hasUsableTitle
    ? translatedTitle!
    : input.locale === "en" ? "Lesson | GIN Learning Library" : "درس | کتابخانه آموزشی GIN";
  const description = input.summary?.trim() || undefined;
  const indexable = input.isPreview && hasUsableTitle && input.hasTranslation === true;
  const hasReciprocalLanguages = indexable && input.hasCounterpartTranslation === true;
  const url = input.locale === "en" ? enPath : faPath;

  return {
    title,
    ...(description ? { description } : {}),
    robots: { index: indexable, follow: true },
    alternates: {
      canonical: url,
      ...(hasReciprocalLanguages ? { languages: { fa: faPath, en: enPath } } : {}),
    },
    openGraph: {
      title,
      ...(description ? { description } : {}),
      url,
      siteName: "Global Information Network",
      type: "article",
      images: [{ url: "/gin/gin-social-card.png", width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, ...(description ? { description } : {}), images: ["/gin/gin-social-card.png"] },
  };
}
