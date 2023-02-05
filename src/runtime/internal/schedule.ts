let update_scheduled = false;
const resolved_promise = Promise.resolve();
const workQueue: (() => void)[] = [];

export function scheduleUpdate(update: () => void): void {
  if (!update_scheduled) {
    update_scheduled = true;
    workQueue.push(update);
    resolved_promise.then(flush);
  }
}

export function flush(): void {
  while (workQueue.length) {
    const work = workQueue.shift();
    if (work) work();
  }
  update_scheduled = false;
}
