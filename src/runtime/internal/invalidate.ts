import { scheduleUpdate } from './schedule';

export function $$invalidate(dirty: string[], names: string, ret: any, update: () => void): any {
  let dependencies: Set<string> = new Set();
  const toDirty = names.split(',');
  toDirty.forEach((name) => dependencies.add(name));
  [...dependencies].forEach((dependency) => dirty.push(dependency));
  scheduleUpdate(update);

  return ret;
}
