import RoomScene from "./RoomScene";
import { getAvatarTexture } from "../utils/avatarTexture";

export default class MultiplayerRoomScene extends RoomScene {
  constructor(playerName, getNetworkState) {
    super(playerName);

    this.getNetworkState = getNetworkState;

    this.remotePlayers = new Map();
    this.appliedPlayers = null;
    this.currentSocketId = "";

    this.lastSentAt = 0;
    this.lastSentPosition = null;
    this.lastDirection = "down";
    this.synced = false;
  }

  create() {
    super.create();

    this.player.setVisible(false);
    this.playerLabel.setVisible(false);

    this.onMapReady?.();
  }

  syncPlayers(network) {
    const players = Array.isArray(network.players)
      ? network.players
      : [];

    const self = players.find(
      (player) => player.socketId === network.selfSocketId
    );

    if (
      !self ||
      !Number.isFinite(self.x) ||
      !Number.isFinite(self.y)
    ) {
      return false;
    }

    // Reset local position only when the socket connection changes.
    if (this.currentSocketId !== network.selfSocketId) {
      this.currentSocketId = network.selfSocketId;

      this.player.body.reset(self.x, self.y);

      this.lastSentPosition = null;
      this.lastSentAt = 0;
    }

    const selfTexture = getAvatarTexture(this, self.avatar);

    if (this.player.texture.key !== selfTexture) {
      this.player.setTexture(selfTexture);

      // All presets use the existing 30 × 34 sprite dimensions.
      this.player.body.setSize(20, 23);
      this.player.body.setOffset(5, 9);
    }

    this.playerLabel.setText(self.name || "You");

    const activeIds = new Set();

    for (const player of players) {
      if (
        !player.socketId ||
        player.socketId === network.selfSocketId ||
        !Number.isFinite(player.x) ||
        !Number.isFinite(player.y)
      ) {
        continue;
      }

      activeIds.add(player.socketId);

      let remote = this.remotePlayers.get(player.socketId);

      if (!remote) {
        const sprite = this.add
          .sprite(
            player.x,
            player.y,
            getAvatarTexture(this, player.avatar)
          )
          .setDepth(9);

        const label = this.add
          .text(
            player.x,
            player.y - 31,
            player.name || "Student",
            {
              fontFamily: "Arial",
              fontSize: "13px",
              color: "#ffffff",
              backgroundColor: "#34465c",
              padding: {
                left: 8,
                right: 8,
                top: 5,
                bottom: 5,
              },
            }
          )
          .setOrigin(0.5)
          .setDepth(11);

        remote = {
          sprite,
          label,
          targetX: player.x,
          targetY: player.y,
        };

        this.remotePlayers.set(player.socketId, remote);
      }

      const remoteTexture = getAvatarTexture(this, player.avatar);

      if (remote.sprite.texture.key !== remoteTexture) {
        remote.sprite.setTexture(remoteTexture);
      }

      remote.targetX = player.x;
      remote.targetY = player.y;
      remote.label.setText(player.name || "Student");
    }

    for (const [socketId, remote] of this.remotePlayers) {
      if (!activeIds.has(socketId)) {
        remote.sprite.destroy();
        remote.label.destroy();

        this.remotePlayers.delete(socketId);
      }
    }

    return true;
  }

    showPunchHit(hit) {
    const network = this.getNetworkState();

    if (!network?.connected) return;

    const own =
      hit.targetSocketId === network.selfSocketId;

    const target = own
      ? this.player
      : this.remotePlayers.get(hit.targetSocketId)?.sprite;

    const x = target?.x ?? hit.x;
    const y = target?.y ?? hit.y;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ring = this.add
      .circle(x, y, 22, 0xffbf69, 0.25)
      .setStrokeStyle(3, 0xffd18a)
      .setDepth(20);

    const word = this.add
      .text(x, y - 45, "POW!", {
        fontFamily: "Arial",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#fff2cc",
        backgroundColor: "#7a3434",
        padding: {
          left: 6,
          right: 6,
          top: 3,
          bottom: 3,
        },
      })
      .setOrigin(0.5)
      .setDepth(21);

    const items = [ring, word];

    // Only the player receiving the hit sees this banner.
    if (own) {
      const warning = this.add
        .text(480, 70, "HIT! HIT! HIT!", {
          fontFamily: "Arial",
          fontSize: "30px",
          fontStyle: "bold",
          color: "#ffffff",
          backgroundColor: "#9c3448",
          padding: {
            left: 16,
            right: 16,
            top: 10,
            bottom: 10,
          },
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(30);

      items.push(warning);

      if (!reduced) {
        this.cameras.main.shake(100, 0.003);
      }
    }

    if (!reduced) {
      this.tweens.add({
        targets: ring,
        scale: 1.7,
        alpha: 0,
        duration: 350,
      });

      this.tweens.add({
        targets: word,
        y: y - 65,
        duration: 350,
      });
    }

    this.time.delayedCall(500, () => {
      items.forEach((item) => item.destroy());
    });
  }

  clearRemotePlayers() {
    for (const remote of this.remotePlayers.values()) {
      remote.sprite.destroy();
      remote.label.destroy();
    }

    this.remotePlayers.clear();
  }

  update(time, delta) {
    if (!this.player?.body || !this.keys) return;

    const network = this.getNetworkState();

    if (!network?.connected || !network.selfSocketId) {
      this.player.setVelocity(0, 0);
      this.stopVirtualMovement();

      this.player.setVisible(false);
      this.playerLabel.setVisible(false);

      this.currentSocketId = "";
      this.appliedPlayers = null;
      this.synced = false;

      this.clearRemotePlayers();
      return;
    }

    if (
      network.players !== this.appliedPlayers ||
      network.selfSocketId !== this.currentSocketId
    ) {
      this.synced = this.syncPlayers(network);
      this.appliedPlayers = network.players;
    }

    if (!this.synced) {
      this.player.setVelocity(0, 0);
      this.player.setVisible(false);
      this.playerLabel.setVisible(false);
      return;
    }

    this.player.setVisible(true);
    this.playerLabel.setVisible(true);

    const focusedElement = document.activeElement;

    const isTyping =
      focusedElement instanceof HTMLElement &&
      (
        focusedElement.matches("input, textarea, select") ||
        focusedElement.isContentEditable
      );

    const shouldStop =
      document.hidden ||
      !document.hasFocus() ||
      isTyping;

    if (shouldStop) {
      this.stopVirtualMovement();
      this.player.setVelocity(0, 0);
    } else {
      // Existing RoomScene handles keyboard movement and velocity.
      // No per-frame key.reset() here.
      super.update();
    }

    this.playerLabel.setPosition(
      this.player.x,
      this.player.y - 31
    );

    // Smooth movement for other players.
    const safeDelta = Number.isFinite(delta)
      ? Math.max(0, Math.min(delta, 100))
      : 16;

    const blend = 1 - Math.exp(-safeDelta / 70);

    for (const remote of this.remotePlayers.values()) {
      remote.sprite.x +=
        (remote.targetX - remote.sprite.x) * blend;

      remote.sprite.y +=
        (remote.targetY - remote.sprite.y) * blend;

      remote.label.setPosition(
        remote.sprite.x,
        remote.sprite.y - 31
      );
    }

    const velocity = this.player.body.velocity;
    const moving = velocity.lengthSq() > 1;

    if (moving) {
      if (Math.abs(velocity.x) > Math.abs(velocity.y)) {
        this.lastDirection =
          velocity.x < 0 ? "left" : "right";
      } else {
        this.lastDirection =
          velocity.y < 0 ? "up" : "down";
      }
    }

    const position = {
      x: this.player.x,
      y: this.player.y,
      direction: this.lastDirection,
      moving,
    };

    const previous = this.lastSentPosition;

    const changed =
      !previous ||
      Math.abs(position.x - previous.x) > 0.5 ||
      Math.abs(position.y - previous.y) > 0.5 ||
      position.moving !== previous.moving ||
      position.direction !== previous.direction;

    if (
      changed &&
      time - this.lastSentAt >= 60 &&
      typeof network.onMove === "function"
    ) {
      network.onMove(position);

      this.lastSentPosition = position;
      this.lastSentAt = time;
    }
  }
}