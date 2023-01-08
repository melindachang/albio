import { DirtMarker } from '@core/interfaces';

export const set_data = (text: Text, data: any): void => {
  data = '' + data;
  if (text.wholeText !== data) text.data = data;
};

export const text = (data: string): Text => {
  return document.createTextNode(data);
};

export const check_dirty_deps = (dirt: DirtMarker, deps: string[]): boolean => {
  if (dirt === null) return false;
  return Object.keys(dirt).some((key) => deps.indexOf(key) > -1);
};
