import { scheduleUpdate } from './schedule';

export function $$invalidate(
  dirty: number[],
  toDirty: number[],
  ret: any,
  update: (...args: any) => void,
): any {
  toDirty.forEach((i) => {
    if (dirty[(i / 31) | 0] === -1) {
      scheduleUpdate(() => {
        return update(dirty);
      });
      dirty.fill(0);
    }
    dirty[(i / 31) | 0] |= 1 << i % 31;
  });

  return ret;
}
