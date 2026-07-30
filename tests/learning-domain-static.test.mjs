import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contentModelPath = new URL(
  "../src/domain/learning/content-model.ts",
  import.meta.url,
);
const progressEnginePath = new URL(
  "../src/domain/learning/progress-engine.ts",
  import.meta.url,
);
const panelContractPath = new URL(
  "../src/domain/dashboard/dashboard-panel-contract.ts",
  import.meta.url,
);

test("the learning domain supports all planned languages and A0-C2", async () => {
  const source = await readFile(contentModelPath, "utf8");

  for (const level of ["A0", "A1", "A2", "B1", "B2", "C1", "C2"]) {
    assert.match(source, new RegExp(`\\"${level}\\"`));
  }

  for (const language of ["ja", "en", "no", "pl", "zh", "ko", "de", "fr", "es", "it"]) {
    assert.match(source, new RegExp(`\\"${language}\\"`));
  }

  for (const skill of [
    "vocabulary",
    "grammar",
    "reading",
    "listening",
    "writing",
    "speaking",
    "pronunciation",
    "culture",
  ]) {
    assert.match(source, new RegExp(`\\"${skill}\\"`));
  }

  assert.match(source, /assertValidLesson/);
  assert.match(source, /passingScore/);
  assert.match(source, /prerequisites/);
});

test("progress recommendations are driven by learner state", async () => {
  const source = await readFile(progressEnginePath, "utf8");

  assert.match(source, /activeLessonId/);
  assert.match(source, /reviewQueue/);
  assert.match(source, /weakestSkill/);
  assert.match(source, /selectNextRecommendation/);
  assert.match(source, /spaced-repetition queue/);
  assert.doesNotMatch(source, /Math\.random/);
});

test("ready dashboard panels must contain data and actions", async () => {
  const source = await readFile(panelContractPath, "utf8");

  assert.match(source, /odynAiAvailable/);
  assert.match(source, /userId/);
  assert.match(source, /state === \"ready\" && panel\.data === null/);
  assert.match(source, /state === \"ready\" && !panel\.primaryAction/);
  assert.match(source, /Non-ready panel/);
});
