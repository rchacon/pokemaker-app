import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { resetProfilesCache } from "../hooks/useProfiles";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  resetProfilesCache();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
