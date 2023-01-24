export function $$setData(text: Text, data: any): void {
  data = '' + data;
  if (text.wholeText !== data) text.data = data;
}

export function $$text(data: any): Text {
  return document.createTextNode(data);
}

export function $$checkDirtyDeps(dirt: string[], deps: string[]): boolean {
  if (dirt.length === 0) return false;
  return dirt.some((key) => deps.indexOf(key) > -1);
}
