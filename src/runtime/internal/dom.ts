export function $$element(node: any): any {
  return document.createElement(node);
}

export function $$setData(text: Text, data: any): void {
  data = '' + data;
  if (text.wholeText !== data) text.data = data;
}

export function $$setAttrData(el: any, attr: string, data: any): void {
  data = '' + data;
  el[attr] = data;
}

export function $$text(data: any): Text {
  return document.createTextNode(data);
}

export function $$detach(node: any) {
  if (node.parentNode) {
    node.parentNode.removeChild(node);
  }
}

export function $$toggle_class(el: any, name: string, toggle: boolean) {
  el.classList[toggle ? "add" : "remove"](name);
}