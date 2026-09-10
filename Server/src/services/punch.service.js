import { randomUUID } from "node:crypto";

export default function registerPunchEvents({
  io,
  socket,
  roomsPresence,
  assertRoomSession,
  handleError,
}) {
  let nextPunchAt = 0;

  socket.on("player-punch", (payload, ack) => {
    const reply = (data) => {
      if (typeof ack === "function") ack(data);
    };

    try {
      const roomId = payload?.roomId;

      if (typeof roomId !== "string") {
        reply({
          success: false,
          message: "Invalid room.",
        });
        return;
      }

      assertRoomSession(roomId);

      const now = Date.now();

      if (now < nextPunchAt) {
        reply({
          success: false,
          message: "Wait a moment before punching.",
        });
        return;
      }

      nextPunchAt = now + 700;

      const players = roomsPresence.get(roomId);
      const attacker = players?.get(socket.id);

      if (!attacker) return;

      let target = null;
      let nearest = 64;

      for (const candidate of players.values()) {
        // Do not hit yourself or another tab of your account.
        if (candidate.userId === attacker.userId) continue;

        const peer = io.sockets.sockets.get(
          candidate.socketId
        );

        if (
          !peer?.connected ||
          peer.data.activeRoomId !== roomId ||
          !peer.rooms.has(roomId) ||
          (
            peer.tokenExpiresAt &&
            now >= peer.tokenExpiresAt
          )
        ) {
          continue;
        }

        // Use server positions, not coordinates sent with the punch.
        const distance = Math.hypot(
          candidate.x - attacker.x,
          candidate.y - attacker.y
        );

        if (
          Number.isFinite(distance) &&
          distance <= nearest
        ) {
          nearest = distance;
          target = candidate;
        }
      }

      if (!target) {
        reply({
          success: true,
          hit: false,
          message: "Miss! Move closer.",
        });
        return;
      }

      const hit = {
        id: randomUUID(),
        roomId,
        attackerSocketId: socket.id,
        targetSocketId: target.socketId,
        attackerName: attacker.name || "Student",
        targetName: target.name || "Student",
        x: target.x,
        y: target.y,
        createdAt: new Date(now).toISOString(),
      };

      io.to(roomId).emit("player-hit", hit);

      reply({
        success: true,
        hit: true,
      });
    } catch (error) {
      handleError(ack, error);
    }
  });
}