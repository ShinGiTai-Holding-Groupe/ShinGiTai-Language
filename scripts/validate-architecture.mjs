import { access, readFile, readdir } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { dirname, extname, relative, resolve, sep } from "node:path";
import process from "node:process";

const root = process.cwd();
const sourceRoot = resolve(root, "src");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const importPattern = /(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;
const forbiddenProviderPattern = /openai-compatible|@ai-sdk\/openai|@ai-sdk\/anthropic|@google\/generative-ai|ollama|huggingface|shinrei\/providers|ai\.gateway\.lovable\.dev|lovable-api-key/i;
const forbiddenUrlPattern = /https?:\/\/(?:ai\.gateway\.lovable\.dev|api\.openai\.com|api\.anthropic\.com)/i;

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(path)));
    else if (sourceExtensions.has(extname(entry.name))) files.push(path);
  }
  return files;
}

function normalize(path) {
  return path.split(sep).join("/");
}

function domainName(relativePath) {
  const match = normalize(relativePath).match(/^domains\/([^/]+)\//);
  return match?.[1] ?? null;
}

function resolveRelativeImport(sourceFile, importedPath) {
  return normalize(relative(sourceRoot, resolve(dirname(sourceFile), importedPath)));
}

function isPublicDomainEntrypoint(targetPath) {
  return /^domains\/[^/]+\/index(?:\.[^.]+)?$/.test(targetPath);
}

async function pathExists(path) {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function candidateEntrypoints(entrypoint) {
  return [
    resolve(root, `${entrypoint}.ts`),
    resolve(root, `${entrypoint}.tsx`),
    resolve(root, entrypoint, "index.ts"),
    resolve(root, entrypoint, "index.tsx"),
  ];
}

const violations = [];
const files = await collectFiles(sourceRoot);

for (const file of files) {
  const sourceRelative = normalize(relative(sourceRoot, file));
  const sourceDomain = domainName(sourceRelative);
  const content = await readFile(file, "utf8");

  if (forbiddenUrlPattern.test(content) || /Lovable-API-Key/i.test(content)) {
    violations.push({
      code: "physical_provider_literal",
      file: sourceRelative,
      importedPath: "literal",
      message: "Physical provider URLs and credentials are forbidden in Language product code.",
    });
  }

  for (const match of content.matchAll(importPattern)) {
    const importedPath = match[1] ?? match[2];
    if (!importedPath) continue;

    if (forbiddenProviderPattern.test(importedPath)) {
      violations.push({
        code: "physical_provider_import",
        file: sourceRelative,
        importedPath,
        message: "Language may access AI only through OdynAiApplicationPort.",
      });
    }

    if (!sourceDomain || !importedPath.startsWith(".")) continue;
    const targetRelative = resolveRelativeImport(file, importedPath);
    const targetDomain = domainName(targetRelative);
    if (!targetDomain || targetDomain === sourceDomain) continue;
    if (!isPublicDomainEntrypoint(targetRelative)) {
      violations.push({
        code: "private_cross_domain_import",
        file: sourceRelative,
        importedPath,
        message: `Cross-domain imports must use src/domains/${targetDomain}/index.ts.`,
      });
    }
  }
}

const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
for (const [sectionName, dependencies] of Object.entries({
  dependencies: packageJson.dependencies ?? {},
  devDependencies: packageJson.devDependencies ?? {},
})) {
  for (const dependencyName of Object.keys(dependencies)) {
    if (forbiddenProviderPattern.test(dependencyName)) {
      violations.push({
        code: "physical_provider_dependency",
        file: "package.json",
        importedPath: dependencyName,
        message: `Forbidden physical provider dependency found in ${sectionName}.`,
      });
    }
  }
}

const moduleCatalog = await readFile(resolve(root, "src/architecture/module-catalog.ts"), "utf8");
const entrypointPattern = /publicEntrypoint:\s*["']([^"']+)["']/g;
for (const match of moduleCatalog.matchAll(entrypointPattern)) {
  const entrypoint = match[1];
  const candidates = candidateEntrypoints(entrypoint);
  const existence = await Promise.all(candidates.map(pathExists));
  if (!existence.some(Boolean)) {
    violations.push({
      code: "missing_module_entrypoint",
      file: "src/architecture/module-catalog.ts",
      importedPath: entrypoint,
      message: "Every declared module entrypoint must exist in the repository.",
    });
  }
}

function assertSeededViolationDetection() {
  const seededImports = ["@ai-sdk/openai-compatible", "https://ai.gateway.lovable.dev/v1", "shinrei/providers/openai"];
  for (const seeded of seededImports) {
    if (!forbiddenProviderPattern.test(seeded) && !forbiddenUrlPattern.test(seeded)) {
      throw new Error(`Architecture validator self-test failed for seeded violation: ${seeded}`);
    }
  }
}
assertSeededViolationDetection();

if (violations.length > 0) {
  console.error("Architecture validation failed:\n");
  for (const violation of violations) {
    console.error(`- [${violation.code}] ${violation.file} -> ${violation.importedPath}`);
    console.error(`  ${violation.message}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Architecture validation passed (${files.length} source files scanned, package and module catalog verified).`);
}
