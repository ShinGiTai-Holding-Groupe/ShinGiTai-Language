import { access, readFile, readdir } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { dirname, extname, relative, resolve, sep } from "node:path";

const root = process.cwd();
const sourceRoot = resolve(root, "src");
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const importPattern =
  /(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;
const providerDependency =
  /openai-compatible|@ai-sdk\/openai|@ai-sdk\/anthropic|@google\/generative-ai|ollama|huggingface|openai\/|anthropic\/|shinrei/i;
const forbiddenLiteral =
  /ai\.gateway|\/v1\/gateways\/|lovable|LOVABLE_API_KEY|api\.openai\.com|api\.anthropic\.com/i;
const forbiddenComposition =
  /hikari-core\/composition|odynai-hikari\/composition|hikari-composition\/src\/composition|runtimeport|direct\s+shinrei/i;
const physicalField = /readonly\s+(?:provider|physicalModel|model|node|gpu|physicalEndpoint)\s*:/i;
const duplicateIdentity = /HIKARI_IDENTITY|identityId\s*:\s*["']hikari["']/;
const normalize = (value) => value.split(sep).join("/");
async function collect(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await collect(path)));
    else if (extensions.has(extname(entry.name))) result.push(path);
  }
  return result;
}
const domainName = (value) => normalize(value).match(/^domains\/([^/]+)(?:\/|$)/)?.[1] ?? null;
const publicDomain = (value) => /^domains\/[^/]+(?:\/index(?:\.[^.]+)?)?$/.test(value);
async function exists(path) {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

const violations = [];
const files = await collect(sourceRoot);
for (const file of files) {
  const relativeFile = normalize(relative(sourceRoot, file));
  const content = await readFile(file, "utf8");
  const sourceDomain = domainName(relativeFile);
  for (const [pattern, code, message] of [
    [
      forbiddenLiteral,
      "legacy_ai_literal",
      "Legacy gateways and generator-specific AI are forbidden.",
    ],
    [forbiddenComposition, "execution_bypass", "Runtime/composition/Shinrei access is forbidden."],
    [
      duplicateIdentity,
      "duplicate_hikari_identity",
      "Language must not define global Hikari identity.",
    ],
  ])
    if (pattern.test(content)) violations.push({ code, file: relativeFile, message });
  if (/^domains\//.test(relativeFile) && physicalField.test(content))
    violations.push({
      code: "physical_field",
      file: relativeFile,
      message: "Educational domain state cannot contain execution-plane fields.",
    });
  for (const match of content.matchAll(importPattern)) {
    const imported = match[1] ?? match[2];
    if (!imported) continue;
    if (providerDependency.test(imported))
      violations.push({ code: "provider_dependency", file: relativeFile, message: imported });
    if (!sourceDomain || !imported.startsWith(".")) continue;
    const target = normalize(relative(sourceRoot, resolve(dirname(file), imported)));
    const targetDomain = domainName(target);
    if (targetDomain && targetDomain !== sourceDomain && !publicDomain(target))
      violations.push({
        code: "private_cross_domain_import",
        file: relativeFile,
        message: imported,
      });
  }
}
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
for (const dependency of Object.keys({
  ...(packageJson.dependencies ?? {}),
  ...(packageJson.devDependencies ?? {}),
}))
  if (providerDependency.test(dependency))
    violations.push({ code: "provider_sdk", file: "package.json", message: dependency });
for (const file of [".env.example", "package.json"]) {
  const content = await readFile(resolve(root, file), "utf8");
  if (forbiddenLiteral.test(content))
    violations.push({
      code: "legacy_configuration",
      file,
      message: "Legacy AI configuration is forbidden.",
    });
}
const catalog = await readFile(resolve(root, "src/architecture/module-catalog.ts"), "utf8");
for (const match of catalog.matchAll(/publicEntrypoint:\s*["']([^"']+)["']/g)) {
  const entry = match[1];
  const candidates = [resolve(root, `${entry}.ts`), resolve(root, entry, "index.ts")];
  if (!(await Promise.all(candidates.map(exists))).some(Boolean))
    violations.push({
      code: "missing_entrypoint",
      file: "src/architecture/module-catalog.ts",
      message: entry,
    });
}
const statefulContracts = [
  "src/domains/learning-evidence/types.ts",
  "src/domains/assessment/types.ts",
  "src/domains/promotion/types.ts",
  "src/domains/pedagogical-memory/types.ts",
  "src/domains/sync/types.ts",
  "src/domains/accessibility/types.ts",
];
for (const name of statefulContracts) {
  const content = await readFile(resolve(root, name), "utf8");
  if (!/(?:extends\s+TenantContext|tenantPartition\s*:)/.test(content.replace(/readonly\s+/g, "")))
    violations.push({
      code: "tenantless_stateful_contract",
      file: name,
      message: "Stateful public contracts must carry canonical tenant context.",
    });
}
for (const seeded of [
  "@ai-sdk/openai-compatible",
  "https://ai.gateway.example/v1",
  "@shingitai/hikari-core/composition",
  "RuntimePort",
  "readonly provider: string",
  "HIKARI_IDENTITY",
])
  if (
    ![
      providerDependency,
      forbiddenLiteral,
      forbiddenComposition,
      physicalField,
      duplicateIdentity,
    ].some((pattern) => pattern.test(seeded))
  )
    throw new Error(`Validator self-test failed: ${seeded}`);
if (violations.length) {
  console.error(`Architecture validation failed (${violations.length}):`);
  for (const item of violations) console.error(`- [${item.code}] ${item.file}: ${item.message}`);
  process.exit(1);
}
console.log(
  `Architecture validation passed (${files.length} source files, dependencies, tenant contracts, and seeded violations checked).`,
);
