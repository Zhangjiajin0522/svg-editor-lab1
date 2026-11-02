import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SvgCodec } from '../src/infrastructure/SvgCodec.ts';
import { FileDocumentStore } from '../src/infrastructure/FileDocumentStore.ts';
import { ShapeFactory } from '../src/domain/ShapeFactory.ts';
import { EditorSession } from '../src/application/EditorSession.ts';
import { CommandDispatcher } from '../src/cli/CommandDispatcher.ts';

const codec = new SvgCodec(new ShapeFactory());

test('assignment external SVG imports all seven elements and assigns missing id', () => {
  const result = codec.decode(readFileSync(new URL('../examples/other.svg', import.meta.url), 'utf8'));
  assert.equal(result.document.all().length, 7);
  assert.equal(result.document.getWidth(), 400);
  assert.deepEqual(result.warnings, ['warning: assigned id rect1 to unnamed <rect>']);
  const encoded = codec.encode(result.document);
  assert.equal(codec.encode(codec.decode(encoded).document), encoded);
});

test('auto-id allocation reserves explicit ids appearing later and respects case', () => {
  const result = codec.decode('<svg><g><rect/><rect id="rect1"/><rect/><rect id="Rect1"/></g><g id="g1"/></svg>');
  assert.deepEqual(result.warnings, [
    'warning: assigned id g2 to unnamed <g>',
    'warning: assigned id rect2 to unnamed <rect>',
    'warning: assigned id rect3 to unnamed <rect>',
  ]);
  assert.equal(result.document.all().length, 6);
});

test('XML text entities, CDATA, Unicode and whitespace survive round-trip', () => {
  const xml = '<svg><text id="t" x="2" y="3">  &lt;A&gt; &amp; &quot;中&quot; &apos;文&apos; &#10;&#x1F916;<![CDATA[ <tag> &raw ]]></text></svg>';
  const document = codec.decode(xml).document;
  const text = '  <A> & "中" \'文\' \n🤖 <tag> &raw ';
  assert.equal(document.require('t').getText(), text);
  const encoded = codec.encode(document);
  assert.equal(codec.decode(encoded).document.require('t').getText(), text);
});

test('inherited SVG root styles survive clones, edits and serialization', () => {
  const document = codec.decode('<svg width="100px" height="50px" fill="red" stroke-width="2"><g id="g"><rect id="r" width="3" height="4"/></g></svg>').document;
  assert.equal(document.clone().getRoot().getAttributes().fill, 'red');
  const encoded = codec.encode(document.clone());
  assert.match(encoded, /viewBox="0 0 100 50" fill="red" stroke-width="2"/);
  assert.equal(codec.decode(encoded).document.require('r').getAttributes().fill, undefined);
});

for (const [xml, message] of [
  ['<svg><rect id="same"/><g id="same"/></svg>', /id already exists: same/],
  ['<svg><rect></svg>', /invalid SVG/],
  ['<svg/><svg/>', /one svg root/],
  ['<rect/>', /svg root/],
  ['<svg><path id="p"/></svg>', /unknown shape type: path/],
  ['<svg><rect id="r" transform="rotate(30)"/></svg>', /unknown attribute: transform/],
  ['<svg><rect id="r"><circle id="c"/></rect></svg>', /children not allowed/],
  ['<svg><text id="t"><g id="g"/></text></svg>', /children not allowed/],
  ['<svg><g id="g">not allowed</g></svg>', /unexpected text/],
  ['<svg><text id="t">&bogus;</text></svg>', /invalid XML entity/],
  ['<svg><text id="t">&#0;</text></svg>', /invalid XML character/],
  ['<svg><text id="t">&#x110000;</text></svg>', /invalid XML character/],
  ['<!DOCTYPE svg [<!ENTITY a "injected">]><svg/>', /DOCTYPE/],
  ['<svg xmlns="urn:other"/>', /unsupported SVG namespace/],
  ['<svg width="100" height="100" viewBox="1 1 50 50"/>', /viewBox must match/],
  ['<svg><rect id="r" width="-1"/></svg>', /non-negative/],
  ['<svg><rect id="r" x="NaN"/></svg>', /invalid number/],
  ['<svg><g id="with spaces"/></svg>', /id must be/],
] as const) {
  test(`reject unsupported or malformed input: ${xml.slice(0, 65)}`, () => {
    assert.throws(() => codec.decode(xml), message);
  });
}

test('read/write filesystem errors and malformed reads preserve live document and history', () => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-editor-'));
  try {
    const store = new FileDocumentStore(codec), session = new EditorSession(store, new ShapeFactory());
    const cli = new CommandDispatcher(session);
    assert.equal(cli.dispatch('init').failed, false);
    assert.equal(cli.dispatch('create rect r 1 2 3 4').failed, false);
    const before = codec.encode(session.getDocument());
    const badFile = join(directory, 'bad.svg'); writeFileSync(badFile, '<svg><rect/><rect id="same"/><g id="same"/></svg>');
    const failedRead = cli.dispatch(`read "${badFile}"`);
    assert.equal(failedRead.failed, true);
    assert.equal(failedRead.lines.length, 1); // No partial auto-id warnings escape a failed read.
    assert.equal(codec.encode(session.getDocument()), before);
    assert.match(cli.dispatch(`read "${directory}/missing.svg"`).lines[0]!, /cannot read file/);
    const targetDirectory = join(directory, 'cannot-replace-directory'); mkdirSync(targetDirectory);
    assert.match(cli.dispatch(`save "${targetDirectory}"`).lines[0]!, /cannot write file/);
    assert.equal(codec.encode(session.getDocument()), before);
    assert.equal(readdirSync(directory).some(name => name.endsWith('.tmp')), false);
    assert.equal(cli.dispatch('undo').failed, false);
    assert.equal(session.getDocument().all().length, 0);
    assert.equal(cli.dispatch('redo').failed, false);
    const saved = join(directory, 'file with spaces.svg');
    assert.equal(cli.dispatch(`save "${saved}"`).failed, false);
    assert.equal(readFileSync(saved, 'utf8'), before);
    assert.equal(cli.dispatch(`read "${saved}"`).failed, false);
    assert.equal(cli.dispatch('set r fill red').failed, false);
    assert.equal(cli.dispatch('save').failed, false);
    assert.equal(store.read(saved).document.require('r').getAttributes().fill, 'red');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
