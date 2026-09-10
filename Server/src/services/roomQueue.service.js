const queues = new Map();

export async function withRoomQueue(roomId, task) {
  const key = String(roomId).toLowerCase();
  const previous = queues.get(key) || Promise.resolve();

  const operation = previous.then(task);
  const settled = operation.then(
    () => undefined,
    () => undefined
  );

  queues.set(key, settled);

  try {
    return await operation;
  } finally {
    if (queues.get(key) === settled) {
      queues.delete(key);
    }
  }
}

export function withMemberQueue(userId, task) {
  return withRoomQueue(`membership:${userId}`, task);
}