export interface GarbageQueue {
  pending: number;
}

export function createGarbageQueue(): GarbageQueue {
  return { pending: 0 };
}

export function receiveGarbage(q: GarbageQueue, lines: number): GarbageQueue {
  return { pending: q.pending + lines };
}

/**
 * Cancel: outgoing attack cancels incoming pending first.
 * Returns { remaining: lines to send to opponent, newQueue: updated local queue }
 */
export function cancelAndSend(
  localQueue: GarbageQueue,
  outgoing: number
): { remaining: number; newQueue: GarbageQueue } {
  const cancel = Math.min(localQueue.pending, outgoing);
  const remaining = outgoing - cancel;
  return {
    remaining,
    newQueue: { pending: localQueue.pending - cancel },
  };
}

/**
 * Materialize: called when a piece locks with no line clear.
 * Returns number of garbage lines to add to board (drains the queue).
 */
export function materialize(q: GarbageQueue): { lines: number; newQueue: GarbageQueue } {
  return { lines: q.pending, newQueue: { pending: 0 } };
}
