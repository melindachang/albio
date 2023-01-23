export function set_data(text: Text, data: any): void {
  data = '' + data;
  if (text.wholeText !== data) text.data = data;
}

export function text(data: any): Text {
  return document.createTextNode(data);
}

export function check_dirty_deps(dirt: string[], deps: string[]): boolean {
  if (dirt.length === 0) return false;
  return dirt.some((key) => deps.indexOf(key) > -1);
}
