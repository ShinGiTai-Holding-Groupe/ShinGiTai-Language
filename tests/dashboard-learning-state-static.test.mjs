import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const catalogPath = new URL("../src/domain/learning/language-catalog.ts", import.meta.url);
const statePath = new URL("../src/domain/dashboard/dashboard-learning-state.ts", import.meta.url);
const focusPath = new URL("../src/components/dashboard/todays-focus-card.tsx", import.meta.url);

test("the language catalog exposes ten complete A0-C2 paths", async () => {
  const source = await readFile(catalogPath, "utf8");

  for (const code of ["ja", "en", "no", "pl", "zh", "ko", "de", "fr", "es", "it"]) {
    assert.match(source, new RegExp(`code: \\"${code}\\"`));
  }

  for (const level of ["A0", "A1", "A2", "B1", "B2", "C1", "C2"]) {
    assert.match(source, new RegExp(`\\"${level}\\"`));
  }

  assert.match(source, /writingSystems/);
  assert.match(source, /getNextLevel/);
});

test("dashboard recommendations cover setup, offline, review, repair and progression", async () => {
  const source = await readFile(statePath, "utf8");

  for (const mode of ["setup", "offline", "review", "repair", "progress"]) {
    assert.match(source, new RegExp(`mode: \\"${mode}\\"`));
  }

  assert.match(source, /reviewDue/);
  assert.match(source, /weakestSkill/);
  assert.match(source, /odynAiAvailable/);
  assert.match(source, /spaced repetition/);
  assert.doesNotMatch(source, /Math\.random/);
});

test("Hikari focus consumes the derived live dashboard state", async () => {
  const source = await readFile(focusPath, "utf8");

  assert.match(source, /deriveDashboardLearningState/);
  assert.match(source, /LANGUAGE_CATALOG/);
  assert.match(source, /reviewDue/);
  assert.match(source, /weakestSkill/);
  assert.match(source, /odynAiAvailable/);
  assert.match(source, /state\.primaryAction\.route/);
  assert.doesNotMatch(source, /ACTIVE_FOCUS_STEPS/);
});
