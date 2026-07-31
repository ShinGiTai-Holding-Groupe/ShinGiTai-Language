import { readFile, readdir } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";
import process from "node:process";

const root = process.cwd();
const sourceRoot = resolve(root, "src");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const importPattern = /(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;
const forbiddenProviderPattern = /(?:^|\/)(?:openai|anthropic|gemini|ollama|huggingface|providers?)(?:\/|$)|shinrei\/providers/i;

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
    } else if (sourceExtensions.has(extname(entry.name))) {
      files.push(path);
    }
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
  const sourceDirectory = sourceFile.slice(0, sourceFile.lastIndexOf(sep));
  return normalize(relative(sourceRoot, resolve(sourceDirectory, importedPath)));
}

function isPublicDomainEntrypoint(targetPath) {
  return /^domains\/[^/]+\/index(?:\.[^.]+)?$/.test(targetPath);
}

const violations = [];
const files = await collectFiles(sourceRoot);

for (const file of files) {
  const sourceRelative = normalize(relative(sourceRoot, file));
  const sourceDomain = domainName(sourceRelative);
  const content = await readFile(file, "utf8");

  for (const match of content.matchAll(importPattern)) {
    const importedPath = match[1] ?? match[2];
    if (!importedPath) continue;

    if (forbiddenProviderPattern.test(importedPath)) {
      violations.push({
        code: "physical_provider_import",
        file: sourceRelative,
        importedPath,
        message: "Product code must access AI only through the OdynAI runtime boundary.",
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

if (violations.length > 0) {
  console.error("Architecture validation failed:\n");
  for (const violation of violations) {
    console.error(`- [${violation.code}] ${violation.file} -> ${violation.importedPath}`);
    console.error(`  ${violation.message}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Architecture validation passed (${files.length} source files scanned).`);
}
