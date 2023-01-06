import { parse } from 'acorn';
import { Program, Node, VariableDeclaration, Identifier } from 'estree';

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
  const residualNodes: Node[] = [];

  program.body.forEach((node) => {
    if (node.type === 'ExportNamedDeclaration') {
      (node.declaration as VariableDeclaration).declarations.forEach((declarator) => {
        props.push((declarator.id as Identifier).name);
      });
    } else {
      residualNodes.push(node);
    }
  });
  return { props, residualNodes };
};
