import { ElementTag, ASTNode, TextTag, Binding } from '@core/interfaces';

export const set_data = (text: Text, data: any) => {
  data = '' + data;
  if (text.wholeText !== data) text.data = data;
};

export const generate_node_str = (identifiers: string[], node: ASTNode): string => {
  const identifier = identifiers[node.index];
  switch (node.type) {
    case 'Text':
      return `${identifier} = text("${(node as TextTag).value.replace(/\n/g, '\\n')}")`;
    case 'Binding':
      return `${identifier}_value = text(${(node as Binding).data})\n${identifier} = text(${identifier}_value)`;
    default:
      return `${identifier} = text("${node.name}")`;
  }
};

export const generate_attr_str = (identifiers: string[], node: ASTNode): string[] => {
  if (!(node as ElementTag).attrs) return [];
  const identifier = identifiers[node.index];
  return Object.entries((node as ElementTag).attrs!).map(([name, value]) => `${identifier}.setAttribute("${name}", "${value}")`);
};

export const text = (data: string) => {
  return document.createTextNode(data);
};
