import { b, print } from 'code-red';
import { Node } from 'estree';
import { BlockComponent, Fragment } from './components';
import { destringify } from './utils';
import util from 'util';

export default class Renderer {
  fragment: Fragment;
  blocks: BlockComponent[];
  ast: Node[];

  constructor(fragment: Fragment, blocks: BlockComponent[]) {
    this.fragment = fragment;
    this.blocks = blocks;
    this.ast = [];
  }

  render_instance(): Node[] {
    const base_dirty = [];
    const numProps = Object.keys(this.fragment.props).length;
    for (let i = 0; i < numProps / 31 + (numProps % 1 === 0 ? 0 : 1); i++) base_dirty.push(-1);
    this.ast = b`

    let {${Object.keys(this.fragment.props).join(',')}} = ${util.inspect(
      Object.fromEntries(Object.entries(this.fragment.props).map(([k, v]) => [k, destringify(v)])),
    )}

    let $$dirty = [${base_dirty.join(',')}]
    ${this.fragment.residuals}
        
    
    ${this.fragment.references
      .filter((r) => r.assoc_events)
      .map((r) =>
        this.fragment.render_handler_func(this.fragment.identifiers[r.index], r, r.assoc_events),
      )}

    ${this.blocks.map((block) =>
      block.references
        .filter((r) => r.assoc_events)
        .map((r) =>
          block.render_handler_func(
            block.identifiers[r.index],
            r,
            r.assoc_events,
            this.fragment.props,
          ),
        ),
    )}
    

    ${this.fragment.render_fragment(this.blocks)}
    ${this.blocks.map((block) => block.render(Object.keys(this.fragment.props)))}
    
    
    export const app = create_fragment()
    `;
    return this.ast;
  }

  ast_to_string(): string {
    return print(this.ast as any as Node).code;
  }
}
