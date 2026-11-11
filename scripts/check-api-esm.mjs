import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const root = process.cwd();
const entry = resolve(root, "api/feedback.ts");
const outDir = resolve(root, ".api-check");

function relativeImports(fileName, source) {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const specifiers = [];
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && !node.isTypeOnly) {
      const clause = "importClause" in node ? node.importClause : undefined;
      if (!clause?.isTypeOnly && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        if (node.moduleSpecifier.text.startsWith(".")) specifiers.push(node.moduleSpecifier.text);
      }
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0]) &&
      node.arguments[0].text.startsWith(".")
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return specifiers;
}

function resolveTs(fromFile, specifier) {
  if (!specifier.endsWith(".js")) {
    throw new Error(
      `${relative(root, fromFile)} imports "${specifier}" without a .js extension. Node ESM cannot resolve it.`,
    );
  }
  const target = resolve(dirname(fromFile), specifier).replace(/\.js$/, ".ts");
  try {
    readFileSync(target);
  } catch {
    throw new Error(`${relative(root, fromFile)} imports "${specifier}", but ${relative(root, target)} is missing.`);
  }
  return target;
}

function outputPath(sourcePath) {
  return join(outDir, relative(root, sourcePath)).replace(/\.ts$/, ".js");
}

const files = new Set();
function walk(file) {
  if (files.has(file)) return;
  files.add(file);
  const source = readFileSync(file, "utf8");
  for (const specifier of relativeImports(file, source)) walk(resolveTs(file, specifier));
}

walk(entry);
rmSync(outDir, { recursive: true, force: true });

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const transpiled = ts.transpileModule(source, {
    fileName: file,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  });
  const destination = outputPath(file);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, transpiled.outputText);
}

const loaded = await import(pathToFileURL(outputPath(entry)).href);
if (typeof loaded.default !== "function") {
  throw new Error("api/feedback.ts must default-export the request handler.");
}

console.log(`Node loaded ${files.size} API modules, including ${relative(root, entry)}.`);
