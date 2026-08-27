import { parseDocument } from 'htmlparser2';
import type { ChildNode, Element } from 'domhandler';

/**
 * A design template parsed into the smallest tree the renderer needs.
 * Attribute case is preserved so `onClick`, `viewBox` and `preserveAspectRatio`
 * survive the trip to React.
 */
export type DcNode =
  | { kind: 'text'; text: string }
  | { kind: 'el'; tag: string; attrs: Record<string, string>; children: DcNode[] };

function convert(node: ChildNode): DcNode | null {
  if (node.type === 'text') {
    const text = (node as unknown as { data: string }).data;
    return text ? { kind: 'text', text } : null;
  }
  if (node.type === 'tag' || node.type === 'script' || node.type === 'style') {
    const el = node as Element;
    const children: DcNode[] = [];
    for (const child of el.children) {
      const converted = convert(child as ChildNode);
      if (converted) children.push(converted);
    }
    return { kind: 'el', tag: el.name, attrs: { ...el.attribs }, children };
  }
  // comments, directives, CDATA — nothing the design relies on
  return null;
}

const cache = new Map<string, DcNode[]>();

/** Parses once per template string; both server and client hit the same cache. */
export function parseTemplate(html: string): DcNode[] {
  const hit = cache.get(html);
  if (hit) return hit;

  const doc = parseDocument(html, {
    lowerCaseTags: false,
    lowerCaseAttributeNames: false,
    recognizeSelfClosing: true,
  });

  const nodes: DcNode[] = [];
  for (const child of doc.children) {
    const converted = convert(child as ChildNode);
    if (converted) nodes.push(converted);
  }

  cache.set(html, nodes);
  return nodes;
}
