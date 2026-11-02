import test from 'node:test';
import assert from 'node:assert/strict';
import { TestEditor } from './support/TestEditor.ts';
import { Tokenizer } from '../src/cli/Tokenizer.ts';

// Every editing command must be exactly one reversible history unit.
for (const command of [
  'create ellipse e 1 2 3 4 in nested', 'delete nested', 'move scene 20 -30',
  'scale scene 2', 'set a width 20', 'set t text "new content"', 'set nested fill blue',
  'group combined b nested', 'ungroup nested', 'addto nested b', 'front nested', 'back t',
]) {
  test(`one-step undo/redo restores exact tree and order: ${command}`, () => {
    const e = new TestEditor(); e.setup();
    const before = e.snapshot(); e.ok(command); const after = e.snapshot();
    assert.notEqual(before, after);
    e.ok('undo'); assert.equal(e.snapshot(), before);
    e.ok('redo'); assert.equal(e.snapshot(), after);
  });
}

test('tokenizer preserves colors, empty text, quoted paths and escaped quotes', () => {
  const t = new Tokenizer();
  assert.deepEqual(t.tokenize('   # comment'), []);
  assert.deepEqual(t.tokenize('create rect r 1 2 3 4 #fff'), ['create', 'rect', 'r', '1', '2', '3', '4', '#fff']);
  assert.deepEqual(t.tokenize('set t text ""'), ['set', 't', 'text', '']);
  assert.deepEqual(t.tokenize('read "a folder/my file.svg"'), ['read', 'a folder/my file.svg']);
  assert.deepEqual(t.tokenize('set t text "say \\"hi\\""'), ['set', 't', 'text', 'say "hi"']);
  assert.throws(() => t.tokenize('set t text "oops'), /unterminated/);
});

test('help works before initialization, other document operations require a document', () => {
  const e = new TestEditor(); assert.ok(e.ok('help').length > 5);
  for (const command of ['create g g1', 'tree', 'show r', 'save a.svg', 'canvas', 'undo', 'redo', 'move a 1 2']) {
    e.error(command, /no document\. use 'init' or 'read' first/);
  }
  assert.deepEqual(e.ok('# comment'), []); assert.deepEqual(e.ok('  '), []);
});

test('failed edits and parser errors preserve document and redo branch', () => {
  const e = new TestEditor(); e.setup(); e.ok('move a 5 6'); e.ok('undo');
  const before = e.snapshot();
  for (const [command, error] of [
    ['create circle a 0 0 1', /id already exists: a/],
    ['create rect nope 0 0 2 3 in missing', /no such container: missing/],
    ['create g nope in a', /not a container: a/],
    ['group bad scene a', /cannot group a container into its own descendant: scene/],
    ['group bad a a', /duplicate group member/],
    ['addto nested scene', /own descendant/],
    ['addto scene scene', /own descendant/],
    ['ungroup scene', /cannot ungroup top-level container: scene/],
    ['set a id replaced', /unknown attribute: id/],
    ['set nested x 1', /unknown attribute: x/],
    ['set a width -1', /width must be non-negative/],
    ['scale nested 0', /scale factor must be positive/],
    ['scale nested NaN', /invalid number/],
    ['move a Infinity 1', /invalid number/],
    ['delete absent', /no such shape: absent/],
    ['create box box 0 0 1 2 "box"', /unknown shape type: box/],
    ['set t text "broken', /unterminated/],
    ['move a 1 2 extra', /usage:/],
    ['scale a -2', /scale factor must be positive/],
    ['set a stroke-width -1', /stroke-width must be non-negative/],
  ] as const) {
    e.error(command, error); assert.equal(e.snapshot(), before, command);
  }
  e.ok('redo'); assert.equal(e.session.getDocument().require('a').getAttributes().x, '6');
});

test('recursive operation overflow after an earlier child changed remains atomic', () => {
  const e = new TestEditor(); e.ok('init'); e.ok('create g g');
  e.ok('create rect a 1 2 3 4 in g'); e.ok('create circle b 1e308 0 1 in g');
  const before = e.snapshot();
  e.error('scale g 2', /invalid number/); assert.equal(e.snapshot(), before);
  e.ok('undo'); assert.equal(e.session.getDocument().find('b'), undefined);
});

test('display commands retain redo, successful new edit clears it', () => {
  const e = new TestEditor(); e.setup(); e.ok('move a 1 2'); e.ok('undo');
  for (const command of ['tree', 'tree nested', 'show a', 'help', 'canvas']) e.ok(command);
  e.ok('redo'); e.ok('undo'); e.ok('set a fill blue');
  e.error('redo', /nothing to redo/);
});

for (const command of ['init', 'read saved.svg', 'save saved.svg', 'canvas 100 200']) {
  test(`successful IO blocks both history directions: ${command}`, () => {
    const e = new TestEditor(); e.setup(); e.ok('save saved.svg'); e.ok('move a 1 2'); e.ok('undo');
    e.ok(command); e.error('undo', /undo not allowed after io command/); e.error('redo', /undo not allowed after io command/);
    e.ok('create g fresh'); e.ok('undo'); e.error('undo', /nothing to undo/); e.ok('redo');
  });
}

test('failed IO keeps state, path and history; save remembers a successful explicit path', () => {
  const e = new TestEditor(); e.setup(); e.ok('save good.svg'); e.ok('move a 1 2');
  const before = e.snapshot(); e.store.failWrites(true);
  e.error('save bad.svg', /cannot write file: bad.svg/);
  e.error('read missing.svg', /cannot read file: missing.svg/);
  e.error('init -1 2', /canvas width must be positive/);
  e.error('canvas 10 -1', /canvas height must be positive/);
  assert.equal(e.snapshot(), before);
  e.ok('undo'); e.store.failWrites(false); e.ok('save');
  assert.equal(e.codec.encode(e.store.read('good.svg').document), e.snapshot());
  assert.throws(() => e.store.read('bad.svg'), /cannot read/);
  e.ok('init'); e.error('save', /no file path/);
});

test('all native create types, decimal/scientific coordinates, nested grouping, and z-order', () => {
  const e = new TestEditor(); e.ok('init 400 300'); e.ok('create g root');
  e.ok('create g left in root'); e.ok('create g right in root');
  e.ok('create rect a .5 -2e1 3 4 #fff in left');
  e.ok('create ellipse b 1 2 3 4 red in right');
  e.ok('create line line 1 2 3 4 black in root');
  e.ok('create text t 1 2 "in" in root');
  e.ok('create text blank 1 2 "" in root');
  e.ok('group pair b a');
  const doc = e.session.getDocument();
  assert.equal(doc.parentOf(doc.require('pair')).getId(), 'root');
  assert.deepEqual(doc.requireGroup('pair').getChildren().map(s => s.getId()), ['a', 'b']);
  assert.equal(doc.require('a').getAttributes().x, '0.5');
  e.ok('front pair');
  assert.equal(e.session.getDocument().requireGroup('root').getChildren().at(-1)!.getId(), 'pair');
  e.ok('back pair');
  assert.equal(e.session.getDocument().requireGroup('root').getChildren()[0]!.getId(), 'pair');
  assert.match(e.ok('tree pair').join('\n'), /rect#a.*x=0\.5 y=-20/);
  assert.match(e.ok('show blank').join('\n'), /text=""/);
});

test('missing and extra arguments are rejected without changing state', () => {
  const e = new TestEditor(); e.setup(); const before = e.snapshot();
  for (const command of ['init 1 2 3', 'canvas 1', 'read', 'save a b', 'create', 'delete', 'move a 1', 'scale a', 'set a fill', 'group g', 'ungroup', 'addto scene', 'front', 'back a b', 'tree a b', 'show', 'undo extra', 'redo extra', 'help extra']) {
    e.error(command, /usage:/); assert.equal(e.snapshot(), before, command);
  }
});
