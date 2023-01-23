import { scheduleUpdate } from './schedule';

export function $$invalidate(dirty: string[], name: string, ret: any, update: () => void): any {
  let dependencies: Set<string> = new Set();
  dependencies.add(name);

  [...dependencies].forEach((d) => (dirty.push(d)));

  scheduleUpdate(update);

  return ret;
}
