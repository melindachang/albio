import acorn from 'acorn';

export const parseScript = (source: string) => {
  const AST = acorn.parse(source, {
    sourceType: 'module',
    ecmaVersion: 12,
    locations: true,
  });

  return walk(AST);
};

export const walk = (AST: any) => {
  const rest: any[] = [];

  AST.body.forEach((declaration: any) => {
    rest.push(declaration);
  });

  return { rest };
};
