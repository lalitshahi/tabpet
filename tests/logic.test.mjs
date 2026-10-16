import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PETS, EGGS } from '../src/pets.js';
import {
  DAY, moodFor, personaFor, snapshot, ghostTabs, duplicateTabs, isProtected, roll, canRehatch,
  stageFor, xpFor, eggsEarned, recordSample, tidyDayKeys, weekSummary, searchBelly, addToBelly,
  normalizeUrl, formatMemory, BELLY_MAX,
} from '../src/logic.js';

const NOW = new Date('2026-10-17T12:00:00').getTime();
const tab = (o = {}) => ({ id: Math.random(), windowId: 1, pinned: false, audible: false, active: false, groupId: -1, lastAccessed: NOW, url: 'https://example.com/a', ...o });

test('roster: 24 pets, 8 per egg, no creepy-crawlies', () => {
  assert.equal(PETS.length, 24);
  for (const egg of Object.keys(EGGS)) assert.equal(PETS.filter((p) => p.egg === egg).length, 8);
  const banned = /lizard|snake|spider|bug|insect|gecko|roach|worm|rat\b/i;
  for (const p of PETS) assert.ok(!banned.test(p.species), p.species);
  assert.equal(new Set(PETS.map((p) => p.id)).size, PETS.length);
});

test('every egg has at least one common, rare and legendary', () => {
  for (const egg of Object.keys(EGGS)) for (const r of ['common', 'rare', 'legendary'])
    assert.ok(PETS.some((p) => p.egg === egg && p.rarity === r), `${egg} ${r}`);
});

test('roll respects the egg and the rarity tiers', () => {
  const seq = (...v) => { let i = 0; return () => v[i++ % v.length]; };
  const rarity = (r) => PETS.find((p) => p.id === r.petId).rarity;
  assert.equal(rarity(roll('mythic', seq(0.01, 0, 0.9))), 'legendary');
  assert.equal(rarity(roll('cozy', seq(0.2, 0, 0.9))), 'rare');
  assert.equal(rarity(roll('spooky', seq(0.9, 0.99, 0.9))), 'common');
  assert.equal(roll('cozy', seq(0.9, 0, 0.001)).shiny, true);
  for (let i = 0; i < 200; i++) { const { petId } = roll('spooky'); assert.equal(PETS.find((p) => p.id === petId).egg, 'spooky'); }
});

test('re-hatch: once, within a day', () => {
  assert.equal(canRehatch({ hatchedAt: NOW, rehatched: false }, NOW + 1000), true);
  assert.equal(canRehatch({ hatchedAt: NOW, rehatched: true }, NOW + 1000), false);
  assert.equal(canRehatch({ hatchedAt: NOW, rehatched: false }, NOW + DAY + 1), false);
});

test('protected tabs are never eaten', () => {
  const old = NOW - 30 * DAY;
  const tabs = [
    tab({ lastAccessed: old }),
    tab({ lastAccessed: old, pinned: true }),
    tab({ lastAccessed: old, audible: true }),
    tab({ lastAccessed: old, groupId: 4 }),
    tab({ lastAccessed: old, active: true }),
    tab({ lastAccessed: old, url: 'chrome://settings' }),
    tab({ lastAccessed: NOW - DAY }),
  ];
  assert.equal(ghostTabs(tabs, NOW, 7 * DAY).length, 1);
  assert.equal(isProtected(tab({ url: undefined })), false);
});

test('duplicates keep the active or most recent copy', () => {
  const a = tab({ url: 'https://x.com/p#top', lastAccessed: NOW - 5 * DAY });
  const b = tab({ url: 'https://x.com/p', lastAccessed: NOW - DAY });
  const c = tab({ url: 'https://x.com/p/', lastAccessed: NOW - 9 * DAY, active: true });
  const d = tab({ url: 'https://y.com' });
  const out = duplicateTabs([a, b, c, d]);
  assert.deepEqual(out.sort((x, y) => x.lastAccessed - y.lastAccessed), [a, b]);
  assert.equal(normalizeUrl('https://x.com/p/#h'), 'https://x.com/p');
});

test('snapshot and personality', () => {
  const ghosts = Array.from({ length: 30 }, () => tab({ lastAccessed: NOW - 10 * DAY, url: undefined }));
  const fresh = Array.from({ length: 20 }, () => tab({ url: undefined }));
  const s = snapshot([...ghosts, ...fresh], NOW, 7 * DAY);
  assert.deepEqual(s, { tabs: 50, windows: 1, ghosts: 30, ghostShare: 0.6, dups: 0, oldestDays: 10 });
  assert.equal(personaFor(s).key, 'ghost');
  assert.equal(personaFor({ ...s, tabs: 6 }).key, 'minimalist');
  assert.equal(personaFor({ ...s, tabs: 120 }).key, 'hoarder');
  assert.equal(personaFor({ tabs: 30, ghostShare: 0.1, dups: 0, windows: 6 }).key, 'goblin');
  assert.equal(personaFor({ tabs: 30, ghostShare: 0.1, dups: 0, windows: 1 }).key, 'researcher');
});

test('mood bands', () => {
  assert.equal(moodFor(3).key, 'thriving');
  assert.equal(moodFor(20).key, 'content');
  assert.equal(moodFor(21).key, 'tired');
  assert.equal(moodFor(70).key, 'grumpy');
  assert.equal(moodFor(300).key, 'buried');
});

test('growth stages and eggs', () => {
  assert.equal(stageFor(0).key, 'baby');
  assert.equal(stageFor(149).key, 'baby');
  assert.equal(stageFor(150).key, 'teen');
  assert.equal(stageFor(500).key, 'grown');
  assert.equal(stageFor(500).next, null);
  assert.equal(xpFor({ eaten: 40, tidyDays: 2 }), 90);
  assert.equal(eggsEarned({ eaten: 250, tidyDays: 15 }), 4);
});

test('tidy days come from finished days only', () => {
  let days = {};
  const d1 = new Date('2026-10-15T10:00:00'), d2 = new Date('2026-10-16T10:00:00'), d3 = new Date('2026-10-17T10:00:00');
  days = recordSample(days, d1, 10); days = recordSample(days, d1, 20);
  days = recordSample(days, d2, 60);
  days = recordSample(days, d3, 2);
  assert.deepEqual(tidyDayKeys(days, 20, '2026-10-17'), ['2026-10-15']);
  days = recordSample(days, new Date('2027-01-01T10:00:00'), 5);
  assert.ok(!('2026-10-15' in days), 'old days pruned');
});

test('week summary and memory format', () => {
  const log = [
    { t: NOW - DAY, n: 10, mb: 800, kind: 'ghosts' },
    { t: NOW - 2 * DAY, n: 3, mb: 100, kind: 'dups' },
    { t: NOW - 3 * DAY, n: 5, mb: 0, kind: 'auto' },
    { t: NOW - 9 * DAY, n: 99, mb: 9999, kind: 'ghosts' },
  ];
  assert.deepEqual(weekSummary(log, NOW), { eaten: 18, mb: 900, ghosts: 15, dups: 3 });
  assert.equal(formatMemory(900), '900 MB');
  assert.equal(formatMemory(1946), '1.9 GB');
});

test('belly search and cap', () => {
  const belly = [{ title: 'Stripe webhooks docs', url: 'https://stripe.com/docs' }, { title: 'Ryokan in Kyoto', url: 'https://hotels.example/kyoto' }];
  assert.equal(searchBelly(belly, 'kyoto').length, 1);
  assert.equal(searchBelly(belly, 'stripe docs').length, 1);
  assert.equal(searchBelly(belly, '  ').length, 2);
  assert.equal(searchBelly(belly, 'stripe kyoto').length, 0);
  const big = addToBelly(Array.from({ length: BELLY_MAX }, (_, i) => ({ i })), [{ i: 'new' }]);
  assert.equal(big.length, BELLY_MAX);
  assert.equal(big[0].i, 'new');
});
