import { api } from './api.js';
import { setHTML, esc } from './dom.js';
import { load, activePet } from './store.js';
import { petById, drawScene } from './pets.js';
import { searchBelly, ago, stageFor, xpFor } from './logic.js';

const $ = (id) => document.getElementById(id);
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u || ''; } };
const PAGE = 200;

let belly = [];

async function boot() {
  const s = await load('belly', 'pets', 'activeUid');
  belly = s.belly;
  const p = activePet(s);
  if (p) {
    drawScene($('pet').getContext('2d'), { pet: petById(p.petId), shiny: p.shiny, stage: stageFor(xpFor(p)).key, face: 'happy' });
    $('title').textContent = `${p.name}'s belly`;
    document.title = `${p.name}'s belly · Tab Pet`;
  }
  render();
}

function render() {
  const q = $('q').value;
  const hits = searchBelly(belly, q);
  const now = Date.now();
  $('sub').textContent = belly.length
    ? `${belly.length} tab${belly.length === 1 ? '' : 's'} saved. Search and bring anything back.`
    : 'Nothing eaten yet. Eaten tabs show up here.';
  const ra = $('restore-all');
  ra.hidden = !q.trim() || hits.length < 2 || hits.length > 30;
  ra.textContent = `Bring back all ${hits.length}`;
  setHTML($('list'), hits.length
    ? hits.slice(0, PAGE).map((t) => {
        const ico = t.favIconUrl ? `<img src="${esc(t.favIconUrl)}" alt="">` : esc(host(t.url).slice(0, 1).toUpperCase());
        return `<li><span class="ico">${ico}</span><span class="txt"><a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.title)}</a><span>${esc(host(t.url))}</span></span><small>${ago(now - t.ateAt)}</small><button data-uid="${esc(t.uid)}">Bring back</button></li>`;
      }).join('') + (hits.length > PAGE ? `<li class="empty">${hits.length - PAGE} more. Search to narrow down.</li>` : '')
    : `<li class="empty">${belly.length ? 'No eaten tabs match that.' : 'Your pet hasn’t eaten anything yet.'}</li>`);
}

async function restore(uids) {
  await api.runtime.sendMessage({ type: 'restore', uids });
  belly = (await load('belly')).belly;
  render();
}

$('q').addEventListener('input', render);
$('list').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-uid]');
  if (b) restore([b.dataset.uid]);
});
$('restore-all').onclick = () => restore(searchBelly(belly, $('q').value).map((t) => t.uid));
api.storage.onChanged.addListener((c) => { if (c.belly) { belly = c.belly.newValue || []; render(); } });

boot();
