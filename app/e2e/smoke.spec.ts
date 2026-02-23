import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("renders title and navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Superteam Academy/);
    await expect(page.locator("nav")).toBeVisible();
  });

  test("has explore courses link", async ({ page }) => {
    await page.goto("/");
    const coursesLink = page.locator('a[href="/courses"]').first();
    await expect(coursesLink).toBeVisible();
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
    await expect(page.getByText(/sign in/i)).toBeVisible();
  });
});

test.describe("Settings page", () => {
  test("redirects unauthenticated users", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText(/sign in/i)).toBeVisible();
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
    await expect(page.getByText(/offline/i)).toBeVisible();
  });
});
