import { scheduleUpdate } from './schedule';

export function $$invalidate(dirty: Set<string>, names: string, ret: any, update: () => void): any {
  const toDirty = names.split(',');
  toDirty.forEach((name) => dirty.add(name));
  scheduleUpdate(update);
  return ret;
}
