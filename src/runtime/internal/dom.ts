export function $$element(node: any): any {
  return document.createElement(node);
}

export function $$setData(text: Text, data: any): void {
  data = '' + data;
  if (text.wholeText !== data) text.data = data;
}

export function $$text(data: any): Text {
  return document.createTextNode(data);
}
