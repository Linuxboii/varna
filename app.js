import { parse, toHex, contrast, grade, suggest } from './lib.js';
import { $, copy } from './ui.js';

const q = new URLSearchParams(location.hash.slice(1));
const state = { fg: parse(q.get('fg') || '') || parse('#8a94a6'), bg: parse(q.get('bg') || '') || parse('#ffffff') };

function setText() {
  $('#fg').value = toHex(state.fg);
  $('#bg').value = toHex(state.bg);
  $('#fgPick').value = toHex(state.fg);
  $('#bgPick').value = toHex(state.bg);
}

function fixRow(label, rgb, apply) {
  const row = document.createElement('div');
  row.className = 'fix';
  const sw = document.createElement('span');
  sw.className = 'sw';
  sw.style.background = toHex(rgb);
  const text = document.createElement('div');
  text.innerHTML = `<b class="mono"></b><br><span class="muted small"></span>`;
  text.querySelector('b').textContent = toHex(rgb);
  text.querySelector('span').textContent = `${label}, ratio ${contrast(apply === 'fg' ? rgb : state.fg, apply === 'bg' ? rgb : state.bg).toFixed(2)}`;
  const btns = document.createElement('div');
  btns.className = 'row';
  const use = document.createElement('button');
  use.type = 'button';
  use.textContent = 'Use';
  use.onclick = () => { state[apply] = rgb; setText(); render(); };
  const cp = document.createElement('button');
  cp.type = 'button';
  cp.className = 'ghost';
  cp.textContent = 'Copy';
  cp.onclick = () => copy(toHex(rgb), `${toHex(rgb)} copied`);
  btns.append(use, cp);
  row.append(sw, text, btns);
  return row;
}

function render() {
  history.replaceState(null, '', `#fg=${toHex(state.fg).slice(1)}&bg=${toHex(state.bg).slice(1)}`);
  const s = $('#sample');
  s.style.color = toHex(state.fg);
  s.style.background = toHex(state.bg);
  const r = contrast(state.fg, state.bg);
  const g = grade(r);
  $('#ratio').textContent = `${r.toFixed(2)} : 1`;
  const items = [['AA body text', g.aaNormal], ['AAA body text', g.aaaNormal], ['AA large text', g.aaLarge], ['AAA large text', g.aaaLarge], ['Icons and borders', g.ui]];
  $('#checks').replaceChildren(...items.map(([name, ok]) => {
    const d = document.createElement('div');
    d.className = 'check';
    d.innerHTML = '<span></span><b></b>';
    d.firstChild.textContent = name;
    d.lastChild.textContent = ok ? 'Pass' : 'Fail';
    d.lastChild.className = ok ? 'pass' : 'fail';
    return d;
  }));
  const fixes = $('#fixes');
  const rows = [];
  if (!g.aaNormal) {
    rows.push(fixRow('Text colour for AA', suggest(state.fg, state.bg, 4.5), 'fg'));
    rows.push(fixRow('Background for AA', suggest(state.bg, state.fg, 4.5), 'bg'));
  }
  if (!g.aaaNormal) rows.push(fixRow('Text colour for AAA', suggest(state.fg, state.bg, 7), 'fg'));
  if (rows.length) fixes.replaceChildren(...rows);
  else {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'This pair passes every level. Nothing to fix.';
    fixes.replaceChildren(p);
  }
}

function bindText(id) {
  $('#' + id).addEventListener('input', (e) => {
    const c = parse(e.target.value);
    $('#err').textContent = c ? '' : 'Use a hex code like #1f2937, or rgb() or hsl().';
    if (c) { state[id] = c; $('#' + id + 'Pick').value = toHex(c); render(); }
  });
  $('#' + id + 'Pick').addEventListener('input', (e) => { state[id] = parse(e.target.value); $('#' + id).value = e.target.value; $('#err').textContent = ''; render(); });
}
bindText('fg');
bindText('bg');
$('#swap').onclick = () => { [state.fg, state.bg] = [state.bg, state.fg]; setText(); render(); };
$('#share').onclick = () => copy(location.href, 'Link copied');
setText();
render();
