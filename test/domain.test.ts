import test from 'node:test';
import assert from 'node:assert/strict';
import { SvgDocument } from '../src/domain/SvgDocument.ts';
import { ShapeFactory } from '../src/domain/ShapeFactory.ts';
import { Group } from '../src/domain/Group.ts';

test('six polymorphic shapes clone and scale geometry without scaling paint', () => {
  const factory = new ShapeFactory(), doc = new SvgDocument();
  doc.insert(new Group('g'));
  for (const [tag, args] of [
    ['rect', ['1', '2', '3', '4']], ['circle', ['1', '2', '3']],
    ['ellipse', ['1', '2', '3', '4']], ['line', ['1', '2', '3', '4']],
    ['text', ['1', '2', 'hello world']],
  ] as const) doc.insert(factory.create(tag, tag, args), 'g');
  const copy = doc.clone();
  copy.require('g').move(10, 20);
  copy.require('g').scale(2);
  assert.equal(copy.require('rect').getAttributes().x, '22');
  assert.equal(copy.require('rect').getAttributes().width, '6');
  assert.equal(copy.require('line').getAttributes().x2, '26');
  assert.equal(copy.require('text').getText(), 'hello world');
  assert.equal(doc.require('rect').getAttributes().x, '1');
  assert.throws(() => copy.require('g').scale(0), /scale factor must be positive/);
});

test('group uses document order, ungroup keeps sibling positions, cycles are refused', () => {
  const doc = new SvgDocument(), f = new ShapeFactory();
  doc.insert(new Group('scene'));
  for (const id of ['a', 'b', 'c']) doc.insert(f.create('circle', id, ['0', '0', '1']), 'scene');
  const g = doc.group('pair', ['c', 'a']);
  assert.deepEqual(g.getChildren().map(n => n.getId()), ['a', 'c']);
  assert.deepEqual(doc.requireGroup('scene').getChildren().map(n => n.getId()), ['pair', 'b']);
  assert.throws(() => doc.group('bad', ['scene', 'a']), /own descendant/);
  assert.throws(() => doc.addTo('pair', 'scene'), /own descendant/);
  assert.throws(() => doc.ungroup('scene'), /top-level/);
  doc.ungroup('pair');
  assert.deepEqual(doc.requireGroup('scene').getChildren().map(n => n.getId()), ['a', 'c', 'b']);
});

test('ids and attribute whitelist are enforced', () => {
  const doc = new SvgDocument(), f = new ShapeFactory();
  doc.insert(f.create('rect', 'r1', ['0', '0', '5', '8']));
  assert.throws(() => doc.insert(new Group('r1')), /id already exists: r1/);
  assert.throws(() => doc.require('r1').setAttribute('r', '1'), /unknown attribute: r/);
  assert.throws(() => doc.require('r1').setAttribute('width', '-1'), /non-negative/);
  assert.throws(() => f.create('box', 'b', []), /unknown shape type: box/);
  doc.insert(new Group('R1'));
  assert.equal(doc.all().length, 2);
});
