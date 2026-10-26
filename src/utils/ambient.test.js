import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAmbient, cleanSlots, SCENE_IDS } from './ambient.js';

test('off means nothing is drawn', () => {
  assert.equal(resolveAmbient({ showBanner: false }, 'aurora'), null);
  assert.equal(resolveAmbient(undefined, 'aurora'), null);
});

test('random and unknown values fall back to the per-load scene', () => {
  assert.deepEqual(resolveAmbient({ showBanner: true }, 'tide'), { kind: 'scene', id: 'tide' });
  assert.deepEqual(resolveAmbient({ showBanner: true, activeBackground: 'scene:nope' }, 'dusk'), { kind: 'scene', id: 'dusk' });
});

test('a chosen built-in scene wins', () => {
  for (const id of SCENE_IDS) {
    assert.deepEqual(resolveAmbient({ showBanner: true, activeBackground: `scene:${id}` }, 'aurora'), { kind: 'scene', id });
  }
});

test('a saved link is used, an empty or retired one falls back', () => {
  const customBackgrounds = [
    { id: 'slot1', name: 'Mine', url: 'https://example.com/loop.gif' },
    { id: 'slot2', name: 'Pixel Cat', url: 'https://media.giphy.com/media/VPlgUzkP5yPba/giphy.gif' },
    { id: 'slot3', name: '', url: '' },
  ];
  const s = { showBanner: true, customBackgrounds };
  assert.deepEqual(resolveAmbient({ ...s, activeBackground: 'slot1' }, 'aurora'), { kind: 'image', url: 'https://example.com/loop.gif' });
  assert.deepEqual(resolveAmbient({ ...s, activeBackground: 'slot2' }, 'aurora'), { kind: 'scene', id: 'aurora' });
  assert.deepEqual(resolveAmbient({ ...s, activeBackground: 'slot3' }, 'aurora'), { kind: 'scene', id: 'aurora' });
});

test('cleanSlots clears retired preset links and their names, keeps the rest', () => {
  const out = cleanSlots([
    { id: 'slot1', name: 'Cozy Cafe', url: 'https://media.giphy.com/media/XIqCQx02E1U9W/giphy.gif' },
    { id: 'slot2', name: 'Beach', url: 'https://media.giphy.com/media/43F752JzgNn44/giphy.gif' },
    { id: 'slot3', name: 'Mine', url: 'https://example.com/a.gif' },
  ]);
  assert.deepEqual(out, [
    { id: 'slot1', name: '', url: '' },
    { id: 'slot2', name: 'Beach', url: '' },
    { id: 'slot3', name: 'Mine', url: 'https://example.com/a.gif' },
  ]);
  assert.equal(cleanSlots(undefined).length, 3);
});
