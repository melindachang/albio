import { HTMLElement, ASTNode, Text } from '@core/interfaces';

export const generateNodeString = (identifiers: string[], node: ASTNode): string => {
  const identifier = identifiers[node.index];
  switch (node.type) {
    case 'Text':
      return `${identifier} = document.createTextNode("${(node as Text).value.replace(/\n/g, '\\n')}")`;
    case 'Binding':
      return `${identifier} = document.createTextNode(${node.name})`;
    default:
      return `${identifier} = document.createElement("${node.name}")`;
  }
};

export const generateAttrString = (identifiers: string[], node: ASTNode): string[] => {
  if (!(node as HTMLElement).attrs) return [];

  const identifier = identifiers[node.index];
  return Object.entries((node as HTMLElement).attrs!).map(
    ([name, value]) => `${identifier}.setAttribute("${name}", "${value}")`,
  );
};
