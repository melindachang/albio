import { scheduleUpdate } from './schedule';

export function $$invalidate(
  dirty: Set<string>,
  names: string,
  ret: any,
  update: (...args: any) => void,
): any {
  const toDirty = names.split(',');
  toDirty.forEach((name) => dirty.add(name));
  scheduleUpdate(() => {
    return update(dirty);
  });
  return ret;
}
