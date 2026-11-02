import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, basename, dirname } from 'node:path';
import ts from 'typescript';

test('module imports follow the documented dependency direction', () => {
  const root = resolve('src');
  const allowed: Record<string, string[]> = {
    domain: ['domain'], application: ['application', 'domain'],
    infrastructure: ['infrastructure', 'application', 'domain'], cli: ['cli', 'application'],
  };
  const files = readdirSync(root, { recursive: true }).filter(name => name.endsWith('.ts') && !name.endsWith('.d.ts'));
  for (const file of files) {
    const module = file.split('/')[0]!, absolute = join(root, file);
    const source = ts.createSourceFile(file, readFileSync(absolute, 'utf8'), ts.ScriptTarget.Latest, true);
    const imports = source.statements.filter(ts.isImportDeclaration);
    for (const declaration of imports) {
      assert.ok(ts.isStringLiteral(declaration.moduleSpecifier));
      const target = declaration.moduleSpecifier.text;
      if (!target.startsWith('.')) {
        assert.ok(module === 'infrastructure' || file === 'cli/Main.ts', `${file} unexpectedly depends on ${target}`);
        continue;
      }
      const dependency = relative(root, resolve(dirname(absolute), target)).split('/')[0]!;
      const permitted = file === 'cli/Main.ts' ? ['cli', 'application', 'domain', 'infrastructure'] : allowed[module]!;
      assert.ok(permitted.includes(dependency), `${file} -> ${target}`);
      if (module === 'infrastructure' && dependency === 'application') {
        assert.ok(declaration.importClause?.isTypeOnly, 'infrastructure may only depend on application interfaces');
      }
    }
  }
});

test('each production class has its own matching file; no tag switch dispatch', () => {
  const root = resolve('src');
  const files = readdirSync(root, { recursive: true }).filter(name => name.endsWith('.ts') && !name.endsWith('.d.ts'));
  for (const file of files) {
    const source = ts.createSourceFile(file, readFileSync(join(root, file), 'utf8'), ts.ScriptTarget.Latest, true);
    const classes = source.statements.filter(ts.isClassDeclaration);
    assert.ok(classes.length <= 1, file);
    if (classes.length) assert.equal(classes[0]!.name?.text, basename(file, '.ts'), file);
    const switches: ts.Node[] = [];
    const visit = (node: ts.Node): void => { if (ts.isSwitchStatement(node)) switches.push(node); ts.forEachChild(node, visit); };
    visit(source); assert.equal(switches.length, 0, `unexpected switch in ${file}`);
  }
});
