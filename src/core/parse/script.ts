import { Props } from '@core/interfaces';
import { parse } from 'acorn';
import { print, x } from 'code-red';
import { Identifier, Node, Statement, VariableDeclaration, Program } from 'estree';

export function parseCode(source: string) {
  let program = parse(source, {
    sourceType: 'module',
    ecmaVersion: 12,
    locations: true,
  }) as any as Program;

  return program;
}

export function extractScripts(ast: Program) {
  let props: Props = {};
  let reactives: Statement[] = [];
  let residuals: Node[] = [];

  ast.body.forEach((node) => {
    switch (node.type) {
      case 'ExportNamedDeclaration':
        (node.declaration as VariableDeclaration).declarations.forEach((declarator) => {
          props[(declarator.id as Identifier).name] = declarator.init ? print(x`${declarator.init}`).code : undefined;
        });
        break;
      case 'LabeledStatement':
        if (node.label.name === '$') {
          reactives.push(node.body);
        }
        break;
      default:
        residuals.push(node);
    }
  });

  return { props, reactives, residuals };
}
