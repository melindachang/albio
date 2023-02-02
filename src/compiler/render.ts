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
    this.ast = b`
    import { $$invalidate, $$element, $$setData, $$text, $$checkDirtyDeps } from '/assets/albio_internal.js';
    
    let {${Object.keys(this.fragment.props).join(',')}} = ${util.inspect(
      Object.fromEntries(Object.entries(this.fragment.props).map(([k, v]) => [k, destringify(v)])),
    )}

    let $$dirty = []
    ${this.fragment.residuals}
        
    ${this.fragment.render_fragment(this.blocks)}
    ${this.blocks.map((block) => block.render())};
    export const app = create_fragment();

    `;
    return this.ast;
  }

  astToString(): string {
    return print(this.ast as any as Node).code;
  }
}
