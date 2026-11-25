import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, toHex, contrast, grade, suggest, toOklch, fromOklch } from './lib.js';

test('parse accepts hex, short hex, rgb() and hsl()', () => {
  assert.deepEqual(parse('#ff8000'), [255, 128, 0]);
  assert.deepEqual(parse('f80'), [255, 136, 0]);
  assert.deepEqual(parse('rgb(10, 20, 30)'), [10, 20, 30]);
  assert.deepEqual(parse('hsl(0, 100%, 50%)'), [255, 0, 0]);
  assert.equal(parse('not a color'), null);
});

test('contrast matches WCAG reference values', () => {
  assert.equal(contrast([0, 0, 0], [255, 255, 255]).toFixed(2), '21.00');
  assert.equal(contrast([255, 255, 255], [255, 255, 255]).toFixed(2), '1.00');
  // #767676 on white is the classic 4.54:1
  assert.equal(contrast(parse('#767676'), [255, 255, 255]).toFixed(2), '4.54');
});

test('grade reports AA and AAA for normal and large text', () => {
  const g = grade(4.6);
  assert.equal(g.aaNormal, true);
  assert.equal(g.aaaNormal, false);
  assert.equal(g.aaLarge, true);
  assert.equal(grade(3.2).aaNormal, false);
  assert.equal(grade(3.2).aaLarge, true);
});

test('oklch round-trips', () => {
  const c = [37, 99, 235];
  const back = fromOklch(...toOklch(c));
  for (let i = 0; i < 3; i++) assert.ok(Math.abs(back[i] - c[i]) <= 1);
});

test('suggest returns a passing colour close to the original', () => {
  const fg = parse('#9ca3af'); // grey that fails on white
  const s = suggest(fg, [255, 255, 255], 4.5);
  assert.ok(contrast(s, [255, 255, 255]) >= 4.5);
  assert.ok(contrast(s, [255, 255, 255]) < 5.2, 'should not overshoot much');
});

test('suggest goes lighter on a dark background', () => {
  const s = suggest(parse('#4b5563'), parse('#111827'), 4.5);
  assert.ok(contrast(s, parse('#111827')) >= 4.5);
  assert.ok(toOklch(s)[0] > toOklch(parse('#4b5563'))[0]);
});

test('toHex formats', () => {
  assert.equal(toHex([255, 128, 0]), '#ff8000');
});
