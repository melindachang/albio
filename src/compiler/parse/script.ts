import { parse } from 'acorn';
import { Program, Node, VariableDeclaration, Identifier, Statement } from 'estree';

export const parseCode = (source: string) => {
  let program = parse(source, {
    sourceType: 'module',
    ecmaVersion: 12,
    locations: true,
  }) as any as Program;

  return program;
};

export const walk = (program: Program) => {
  const props: string[] = [];
  const reactiveStatements: Statement[] = [];
  const residualNodes: Node[] = [];

  program.body.forEach((node) => {
    switch (node.type) {
      case 'ExportNamedDeclaration':
        (node.declaration as VariableDeclaration).declarations.forEach((declarator) => {
          props.push((declarator.id as Identifier).name);
        });
        break;
      case 'LabeledStatement':
        if (node.label.name === '$') {
          reactiveStatements.push(node.body);
        }
        break;
      default:
        residualNodes.push(node);
    }

  });
  return { props, reactiveStatements, residualNodes };
};
