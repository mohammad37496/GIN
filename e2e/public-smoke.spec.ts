import { expect, test } from "@playwright/test";

const publicHomes = [
  { locale: "fa", path: "/" },
  { locale: "en", path: "/en" },
  { locale: "de", path: "/de/home-public" },
  { locale: "fr", path: "/fr/home-public" },
  { locale: "es", path: "/es/home-public-spanish" },
  { locale: "hu", path: "/hu/home-public" },
  { locale: "sq", path: "/sq/home-public" },
  { locale: "pt", path: "/pt/home-public" },
] as const;

const memberHomes = [
  { locale: "en", path: "/member-home" },
  { locale: "de", path: "/de/mitgliederbereich" },
  { locale: "fr", path: "/fr/accueil-des-membres" },
  { locale: "es", path: "/es/bienvenidos" },
  { locale: "hu", path: "/hu/tag-home" },
  { locale: "sq", path: "/sq/shtepia-e-anetarit" },
  { locale: "pt", path: "/pt/pagina-inicial-do-membro" },
] as const;

test.describe("public locale routes", () => {
  for (const route of publicHomes) {
    test(`${route.locale} homepage renders with its own document language`, async ({ page }) => {
      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", route.locale);
      await expect(page.locator("main h1").first()).toBeVisible();
      await expect(page.locator("footer").last()).toBeVisible();
    });
  }

  for (const route of memberHomes) {
    test(`${route.locale} member login route renders a localized, private form`, async ({ page }) => {
      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", route.locale);
      await expect(page.locator('input[name="username"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('input[type="checkbox"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    });
  }
});

test("English desktop header, sidebar and footer expose the reference navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const response = await page.goto("/en", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.locator(".gin-en-primary-bar nav[aria-label='Primary navigation']")).toBeVisible();
  await expect(page.locator(".gin-en-sidebar nav[aria-label='Public pages']")).toBeVisible();
  await expect(page.locator("footer").last()).toContainText("Global Information Network");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /globalinformationnetworkliara\.vercel\.app\/en$/);
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(9);
});

test("English and localized mobile navigation open and reveal their links", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en", { waitUntil: "domcontentloaded" });
  const englishMenu = page.locator(".gin-en-mobile-menu");
  await expect(englishMenu).toBeVisible();
  await englishMenu.locator(":scope > summary").click();
  await expect(englishMenu).toHaveAttribute("open", "");
  await expect(englishMenu.getByRole("link", { name: "Who We Are" })).toBeVisible();

  await page.goto("/de/home-public", { waitUntil: "domcontentloaded" });
  const localizedMenu = page.locator(".gin-official-locale-mobile-menu");
  await expect(localizedMenu).toBeVisible();
  await localizedMenu.locator(":scope > summary").click();
  await expect(localizedMenu).toHaveAttribute("open", "");
  await expect(localizedMenu.locator(".gin-official-locale-mobile-menu-panel")).toBeVisible();
});

test("contact form exposes required fields and conditional Telegram details", async ({ page }) => {
  const response = await page.goto("/en/contact-us", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByLabel("First Name")).toBeVisible();
  await expect(page.locator('input[type="email"][placeholder="you@domain.com"]')).toBeVisible();
  await expect(page.locator("textarea[required]")).toBeVisible();
  await page.getByRole("checkbox", { name: "Telegram", exact: true }).check();
  await expect(page.getByPlaceholder("@username")).toBeVisible();
  await page.getByRole("checkbox", { name: "Telegram", exact: true }).uncheck();
  await expect(page.getByPlaceholder("@username")).toHaveCount(0);
});

test("Persian and English account recovery pages expose localized email and token forms", async ({ page }) => {
  for (const [path, heading, emailLabel] of [
    ["/forgot-password", "بازیابی رمز عبور", "نشانی ایمیل"],
    ["/en/forgot-password", "Reset your password", "Email address"],
  ]) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await expect(page.getByLabel(emailLabel)).toHaveAttribute("type", "email");
  }

  for (const [path, heading] of [
    ["/reset-password", "انتخاب رمز عبور جدید"],
    ["/en/reset-password", "Choose a new password"],
  ]) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await expect(page.locator('input[autocomplete="new-password"]')).toHaveCount(2);
    await expect(page.getByRole("button", { name: /تغییر رمز عبور|Update password/ })).toBeDisabled();
  }
});

test("Persian and English local registration require an email address", async ({ page }) => {
  for (const path of ["/register", "/en/register"]) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    const email = page.locator('input[type="email"][autocomplete="email"]');
    await expect(email).toBeVisible();
    await expect(email).toHaveAttribute("required", "");
  }
});

test("sitemap and robots publish the same canonical site origin", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const sitemapXml = await sitemap.text();
  expect(sitemapXml).toContain("https://globalinformationnetworkliara.vercel.app/");
  expect((sitemapXml.match(/<loc>/g) ?? []).length).toBeGreaterThanOrEqual(175);

  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("https://globalinformationnetworkliara.vercel.app/sitemap.xml");
});

test("unknown public routes return the designed 404 page", async ({ page }) => {
  const response = await page.goto("/__playwright_missing_route__", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(404);
  await expect(page.getByText(/PAGE NOT FOUND/)).toBeVisible();
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  test(`English, localized and login layouts stay within ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const path of ["/en", "/de/home-public", "/member-home", "/forgot-password", "/reset-password", "/en/forgot-password", "/en/reset-password"]) {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), path).toBe(200);
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));
      expect(dimensions.document, `${path} document overflow at ${viewport.width}px`).toBeLessThanOrEqual(dimensions.viewport + 1);
      expect(dimensions.body, `${path} body overflow at ${viewport.width}px`).toBeLessThanOrEqual(dimensions.viewport + 1);
    }
  });
}
