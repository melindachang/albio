let update_scheduled = false;
const workQueue: (() => void)[] = [];
const resolved_promise = Promise.resolve();

export function scheduleUpdate(update: () => void): void {
  workQueue.push(update);
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}

export function flush(): void {
    while (workQueue.length > 0) {
        const work = workQueue.shift();
        if (work) work();
    }
    update_scheduled = false;
}
