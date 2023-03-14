import { x } from 'code-red';
import { Node, Expression } from 'estree';
import { ASTNode, Binding, Listener, Reference } from '../interfaces';
import { CompilerParams } from '../interfaces';

type BitMask = {
  n: number;
  names: string[];
};

export default abstract class Component {
  all_entities: ASTNode[];
  root_entities: ASTNode[];
  child_entities: ASTNode[];
  bindings: Binding[];
  listeners: Listener[];
  references: Reference[];
  class_references: Reference[];
  identifiers: string[];

  constructor(parsed: CompilerParams) {
    this.all_entities = parsed.nodes;
    this.listeners = parsed.listeners;
    this.references = parsed.references.filter((r) => !r.type);
    this.class_references = parsed.references.filter((r) => r.type === 'class');
    this.identifiers = parsed.nodes.map((node) =>
      [node.type[0], node.index].join(''),
    );
    this.bindings = parsed.nodes.filter(
      (node) => node.type === 'Binding',
    ) as Binding[];
  }

  abstract populate_deps(...args: any): void;
  abstract render_handler_func(...args: any): Node[];
  dirty(names: string[], props: string[]): Expression {
    const get_bitmask = () => {
      const bitmask: BitMask[] = [];
      names.forEach((name) => {
        const val = props.indexOf(name);
        const i = (val / 31) | 0;
        const n = 1 << val % 31;

        if (!bitmask[i]) bitmask[i] = { n: 0, names: [] };

        bitmask[i].n |= n;
        bitmask[i].names.push(name);
      });
      return bitmask;
    };
    const bitmask = get_bitmask();
    return bitmask
      .map((b, i) => ({ b, i }))
      .filter(({ b }) => b)
      .map(({ b, i }) => x`$$dirty[${i}] & ${b.n}`)
      .reduce((left, right) => x`${left} | ${right}`);
  }
}
