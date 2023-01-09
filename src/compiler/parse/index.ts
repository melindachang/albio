import { extractFragment, parseFile } from './body.js';
import { parseCode, extractScripts } from './script.js';
import { parseHtml } from './tags.js';

export default function parse(source: string) {
  const fragment = extractFragment(parseFile(source));
  const { props, reactives, residuals } = extractScripts(parseCode(fragment.script));
  const { nodes, listeners } = parseHtml(fragment.tags);

  return { nodes, listeners, props, reactives, residuals };
}
