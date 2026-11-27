import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";
import * as ts from "typescript";
import { isApiInfrastructureError, withApiErrorBoundary } from "./api-error-boundary";

function routeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? routeFiles(path) : entry.isFile() && entry.name === "route.ts" ? [path] : [];
  });
}

test("API boundary converts database and session configuration failures to 503 but rethrows application errors", async () => {
  const databaseFailure = withApiErrorBoundary(async (): Promise<Response> => {
    throw new Error("DATABASE_URL is not configured");
  });
  const databaseResponse = await databaseFailure();
  assert.equal(databaseResponse.status, 503);
  assert.equal(isApiInfrastructureError(new Error("DATABASE_URL is not configured")), true);

  const sessionFailure = withApiErrorBoundary(async (): Promise<Response> => {
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  });
  const sessionResponse = await sessionFailure();
  assert.equal(sessionResponse.status, 503);
  assert.equal(isApiInfrastructureError(new Error("SESSION_SECRET must contain at least 32 characters")), true);

  const applicationFailure = withApiErrorBoundary(async (): Promise<Response> => { throw new Error("Unexpected application failure"); });
  await assert.rejects(() => applicationFailure(), /Unexpected application failure/);
  assert.equal(isApiInfrastructureError(new Error("Unexpected application failure")), false);
});

test("every API route that reads a session directly or through requireAdmin is wrapped by the shared infrastructure error boundary", () => {
  const root = join(process.cwd(), "src", "app", "api");
  const files = routeFiles(root);
  const protectedRoutes = files.filter((path) => {
    const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    let protectedRoute = false;
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ["getSession", "requireAdmin"].includes(node.expression.text)) protectedRoute = true;
      ts.forEachChild(node, visit);
    };
    visit(source);
    return protectedRoute;
  });
  assert.ok(protectedRoutes.length >= 50, `expected broad protected API coverage, found ${protectedRoutes.length}`);
  let protectedMethods = 0;
  for (const path of protectedRoutes) {
    const sourceText = readFileSync(path, "utf8");
    const source = ts.createSourceFile(path, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const boundaryImports = new Set<string>();
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || !statement.moduleSpecifier.text.endsWith("api-error-boundary")) continue;
      const bindings = statement.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        for (const element of bindings.elements) {
          if ((element.propertyName?.text ?? element.name.text) === "withApiErrorBoundary") boundaryImports.add(element.name.text);
        }
      }
    }
    const wrappedLocals = new Set<string>();
    const exportedMethods = new Map<string, string>();
    const httpMethods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]);
    for (const statement of source.statements) {
      if (ts.isVariableStatement(statement)) {
        const exported = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;
        for (const declaration of statement.declarationList.declarations) {
          if (!ts.isIdentifier(declaration.name)) continue;
          const localName = declaration.name.text;
          const initializer = declaration.initializer;
          if (initializer && ts.isCallExpression(initializer) && ts.isIdentifier(initializer.expression) && boundaryImports.has(initializer.expression.text)) wrappedLocals.add(localName);
          if (exported && httpMethods.has(localName)) exportedMethods.set(localName, localName);
        }
      } else if (ts.isFunctionDeclaration(statement) && statement.name && httpMethods.has(statement.name.text)) {
        const exported = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;
        if (exported) exportedMethods.set(statement.name.text, statement.name.text);
      } else if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          const exportedName = element.name.text;
          const localName = element.propertyName?.text ?? element.name.text;
          if (httpMethods.has(exportedName)) exportedMethods.set(exportedName, localName);
        }
      }
    }
    assert.ok(exportedMethods.size > 0, `${relative(root, path)} must export at least one HTTP handler`);
    for (const [method, localName] of exportedMethods) {
      protectedMethods += 1;
      assert.ok(wrappedLocals.has(localName), `${relative(root, path)} ${method} must export a handler wrapped by withApiErrorBoundary`);
    }
  }
  assert.ok(protectedMethods >= 80, `expected broad protected HTTP method coverage, found ${protectedMethods}`);
});
