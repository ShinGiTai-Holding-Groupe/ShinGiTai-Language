import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const guidePath = new URL("../src/components/hikari-guide.tsx", import.meta.url);
const markPath = new URL("../src/components/shingitai-language-mark.tsx", import.meta.url);
const rootPath = new URL("../src/routes/__root.tsx", import.meta.url);

test("Hikari exposes the complete existing learning loop", async () => {
  const source = await readFile(guidePath, "utf8");

  for (const route of ["/teacher", "/flashcards", "/quizzes", "/tutor"]) {
    assert.match(source, new RegExp(`to: \\"${route}\\"`));
  }

  assert.match(source, /Powered by OdynAI/);
  assert.match(source, /aria-expanded=\{open\}/);
  assert.match(source, /prefers-reduced-motion|hikari-guide\.css/);
});

test("the application shell mounts Hikari once", async () => {
  const source = await readFile(rootPath, "utf8");
  assert.match(source, /import \{ HikariGuide \}/);
  assert.equal((source.match(/<HikariGuide\s*\/>/g) ?? []).length, 1);
  assert.doesNotMatch(source, /lovable-error-reporting/);
});

test("the UI mark is transparent SVG rather than a raster checkerboard", async () => {
  const source = await readFile(markPath, "utf8");
  assert.match(source, /<svg/);
  assert.match(source, /fill="none"/);
  assert.doesNotMatch(source, /<rect[^>]+fill=/);
});
