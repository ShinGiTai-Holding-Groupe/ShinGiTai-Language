import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const focusPath = new URL("../src/components/dashboard/todays-focus-card.tsx", import.meta.url);
const source = await readFile(focusPath, "utf8");

test("Hikari dashboard focus exposes the complete learning loop", () => {
  assert.match(source, /to: "\/teacher"/);
  assert.match(source, /to: "\/flashcards"/);
  assert.match(source, /to: "\/tutor"/);
  assert.match(source, /to: "\/onboarding"/);
});

test("Hikari focus actions are real router links", () => {
  assert.match(source, /<Link/);
  assert.match(source, /to=\{step\.to\}/);
  assert.doesNotMatch(source, /href="#"/);
  assert.doesNotMatch(source, /onClick=\{\(\) => \{\}\}/);
});

test("dashboard copy identifies Hikari and OdynAI without provider leakage", () => {
  assert.match(source, /Hikari · powered by OdynAI/);
  assert.doesNotMatch(source, /Lovable/i);
  assert.doesNotMatch(source, /api\.openai\.com/i);
});
