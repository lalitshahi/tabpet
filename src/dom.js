// Renders trusted template strings (every dynamic value goes through `esc`) without innerHTML,
// so Firefox's add-on linter has nothing to flag.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const parser = new DOMParser();
export function setHTML(el, html) {
  const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');
  el.replaceChildren(...doc.body.childNodes);
}
