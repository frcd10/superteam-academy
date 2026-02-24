import { test, expect } from "@playwright/test";

// Auth provider has a 5s safety timeout; CI machines are slow.
const AUTH_TIMEOUT = 15_000;

test.describe("Homepage", () => {
  test("renders title and navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Superteam Academy/);
    await expect(page.locator("nav")).toBeVisible();
  });

  test("has explore courses link", async ({ page }) => {
    await page.goto("/");
    // Use a visible courses link (navbar link is hidden on mobile behind hamburger)
    const coursesLink = page
      .locator('a[href="/courses"]')
      .and(page.locator(":visible"))
      .first();
    await expect(coursesLink).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Courses page", () => {
  test("loads course listing", async ({ page }) => {
    await page.goto("/courses");
    await expect(page).toHaveTitle(/Courses|Superteam Academy/);
  });
});

test.describe("Auth flow", () => {
  test("shows sign-in dialog when accessing protected route", async ({ page }) => {
    await page.goto("/dashboard");
    // ProtectedRoute resolves auth state after mount + Supabase call (up to 5s safety timeout)
    await expect(
      page.getByRole("heading", { name: /sign in/i }),
    ).toBeVisible({ timeout: AUTH_TIMEOUT });
  });
});

test.describe("Settings page", () => {
  test("redirects unauthenticated users", async ({ page }) => {
    await page.goto("/settings");
    await expect(
      page.getByRole("heading", { name: /sign in/i }),
    ).toBeVisible({ timeout: AUTH_TIMEOUT });
  });
});

test.describe("Community page", () => {
  test("loads forum page", async ({ page }) => {
    await page.goto("/community");
    await expect(page).toHaveTitle(/Community|Superteam Academy/);
  });
});

test.describe("PWA", () => {
  test("serves manifest.json", async ({ page }) => {
    const response = await page.goto("/manifest.json");
    expect(response?.status()).toBe(200);
    const body = await response?.json();
    expect(body.name).toBe("Superteam Academy");
  });

  test("serves service worker", async ({ page }) => {
    const response = await page.goto("/sw.js");
    expect(response?.status()).toBe(200);
  });
});

test.describe("Offline page", () => {
  test("renders offline fallback", async ({ page }) => {
    await page.goto("/offline");
    // Page shows "You're online!" when connected or "You're offline" when not
    await expect(
      page.getByRole("heading", { name: /you.re (offline|online)/i }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
