import Phaser from "phaser";

import {
  COLLIDERS,
  COLORS,
  PLAYER_START,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  ZONES,
  FURNITURE,
  PALMS,
  PIER,
  SHORE_X,
} from "../config/roomMap";

export default class RoomScene extends Phaser.Scene {
  constructor(playerName = "You") {
    super("RoomScene");

    this.playerName = playerName;
    this.player = null;
    this.playerLabel = null;
    this.keys = null;

    this.virtualDirection = {
      up: false,
      down: false,
      left: false,
      right: false,
    };
  }

  create() {
    this.physics.world.setBounds(
      0,
      0,
      WORLD_WIDTH,
      WORLD_HEIGHT
    );

    this.drawFloor();
    this.drawZones();
    this.drawFurniture();

    this.obstacles = this.physics.add.staticGroup();

    COLLIDERS.forEach((item) => {
      const obstacle = this.add.rectangle(
        item.x,
        item.y,
        item.width,
        item.height,
        0x000000,
        0
      );

      this.physics.add.existing(obstacle, true);
      this.obstacles.add(obstacle);
    });

    this.createPlayer();
    this.createKeyboardControls();

    this.physics.add.collider(this.player, this.obstacles);

    this.cameras.main.setBounds(
      0,
      0,
      WORLD_WIDTH,
      WORLD_HEIGHT
    );

    this.cameras.main.roundPixels = true;

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.removeAllListeners();
    });
  }

  drawFloor() {
    this.cameras.main.setBackgroundColor(COLORS.ocean);

    const g = this.add.graphics();

    // Ocean.
    g.fillStyle(COLORS.ocean);
    g.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    g.fillStyle(COLORS.deepWater, 0.35);
    g.fillRect(0, 0, 105, WORLD_HEIGHT);

    // Wave details.
    g.lineStyle(2, COLORS.foam, 0.5);

    for (let y = 22; y < WORLD_HEIGHT; y += 43) {
      for (
        let x = 12 + (y % 3) * 13;
        x < 300;
        x += 90
      ) {
        g.lineBetween(x, y, x + 26, y);
        g.lineBetween(x + 26, y, x + 34, y - 3);
      }
    }

    // Shoreline and beach.
    g.fillStyle(0xbddcd0);
    g.fillRect(SHORE_X - 20, 0, 20, WORLD_HEIGHT);

    g.fillStyle(0xe0e2bd);
    g.fillRect(SHORE_X - 9, 0, 9, WORLD_HEIGHT);

    g.fillStyle(COLORS.floor);
    g.fillRect(
      SHORE_X,
      0,
      WORLD_WIDTH - SHORE_X,
      WORLD_HEIGHT
    );

    g.fillStyle(COLORS.floorLine, 0.55);

    for (let i = 0; i < 95; i += 1) {
      const x = SHORE_X + 15 + (i * 79) % 587;
      const y = 18 + (i * 47) % 566;

      g.fillRect(x, y, 3, 2);
    }

    // Wooden pier.
    g.fillStyle(0x947859, 0.2);
    g.fillRect(
      PIER.x + 4,
      PIER.y + 7,
      PIER.width,
      PIER.height
    );

    g.fillStyle(COLORS.deck);
    g.fillRect(
      PIER.x,
      PIER.y,
      PIER.width,
      PIER.height
    );

    g.lineStyle(2, COLORS.deckLight, 0.7);

    for (
      let x = PIER.x + 5;
      x < PIER.x + PIER.width;
      x += 23
    ) {
      g.lineBetween(
        x,
        PIER.y + 2,
        x,
        PIER.y + PIER.height - 2
      );
    }

    g.fillStyle(0x99734e);

    for (const x of [228, 288]) {
      for (const y of [266, 329]) {
        g.fillRect(x, y, 7, 10);
      }
    }

    this.add.text(248, 296, "COASTAL\nCLUBHOUSE", {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#fff8e9",
      align: "center",
    });

    // Beach parasols.
    for (const y of [122, 422]) {
      g.fillStyle(0x80674f, 0.14);
      g.fillEllipse(391, y + 8, 75, 42);

      g.fillStyle(0xf8eccf);
      g.fillCircle(386, y, 33);

      g.fillStyle(0xe7b191);
      g.fillTriangle(
        386, y,
        353, y,
        386, y - 33
      );
      g.fillTriangle(
        386, y,
        419, y,
        386, y + 33
      );

      g.fillStyle(0xb9916e);
      g.fillCircle(386, y, 4);
    }
  }

  drawZones() {
    const g = this.add.graphics();

    ZONES.forEach((zone) => {
      g.fillStyle(0x927c63, 0.16);
      g.fillRoundedRect(
        zone.x + 4,
        zone.y + 6,
        zone.width,
        zone.height,
        8
      );

      g.fillStyle(COLORS.border);
      g.fillRoundedRect(
        zone.x,
        zone.y,
        zone.width,
        zone.height,
        7
      );

      g.fillStyle(zone.color);
      g.fillRect(
        zone.x + 5,
        zone.y + 5,
        zone.width - 10,
        zone.height - 10
      );

      g.lineStyle(1, 0xe1d6c3, 0.7);

      for (
        let y = zone.y + 48;
        y < zone.y + zone.height - 8;
        y += 24
      ) {
        g.lineBetween(
          zone.x + 7,
          y,
          zone.x + zone.width - 7,
          y
        );
      }

      this.add
        .text(zone.x + 16, zone.y + 12, zone.name, {
          fontFamily: "Arial",
          fontSize: "15px",
          color: "#355356",
          backgroundColor: "#fffaed",
          padding: {
            left: 9,
            right: 9,
            top: 5,
            bottom: 5,
          },
        })
        .setDepth(2);
    });
  }

  drawFurniture() {
    const g = this.add.graphics();

    FURNITURE.forEach(
      ({ type, x, y, width: w, height: h }) => {
        g.fillStyle(0x7d6856, 0.18);
        g.fillRoundedRect(x + 3, y + 5, w, h, 3);

        if (type === "desk" || type === "project") {
          g.fillStyle(COLORS.deskEdge);
          g.fillRoundedRect(x, y, w, h, 3);

          g.fillStyle(COLORS.desk);
          g.fillRect(x + 3, y + 3, w - 6, h - 8);

          if (type === "desk") {
            // Monitor.
            g.fillStyle(0x3a535d);
            g.fillRect(x + 15, y + 7, 43, 25);

            g.fillStyle(COLORS.screen);
            g.fillRect(x + 19, y + 10, 35, 18);

            g.fillStyle(0xdcf4ee);
            g.fillRect(x + 24, y + 14, 20, 2);
            g.fillRect(x + 24, y + 20, 25, 2);

            // Keyboard.
            g.fillStyle(0x899a96);
            g.fillRect(x + 67, y + 18, 30, 12);

            // Chair.
            g.fillStyle(COLORS.chair);
            g.fillRoundedRect(
              x + w / 2 - 13,
              y + 50,
              26,
              23,
              4
            );

            g.fillStyle(0x5f8985);
            g.fillRect(
              x + w / 2 - 13,
              y + 67,
              26,
              6
            );
          } else {
            g.fillStyle(0xfffae9);
            g.fillRect(x + 13, y + 8, 29, 22);

            g.fillStyle(COLORS.book1);
            g.fillRect(x + 57, y + 9, 24, 17);

            g.fillStyle(COLORS.book2);
            g.fillRect(x + 100, y + 11, 26, 18);
          }
        } else if (type === "shelf") {
          g.fillStyle(0x8d7057);
          g.fillRect(x, y, w, h);

          g.fillStyle(COLORS.shelf);
          g.fillRect(x + 3, y + 3, w - 6, h - 6);

          const colors = [
            COLORS.book1,
            COLORS.book2,
            COLORS.book3,
            0xe0c18b,
          ];

          for (
            let i = 0;
            i < Math.floor((w - 12) / 12);
            i += 1
          ) {
            g.fillStyle(colors[i % colors.length]);
            g.fillRect(
              x + 7 + i * 12,
              y + 5,
              8,
              h - 12
            );
          }

          g.fillStyle(0x8d7057);
          g.fillRect(x, y + h - 5, w, 5);
        } else if (type === "sofa") {
          g.fillStyle(0x5f9193);
          g.fillRoundedRect(x, y, w, h, 5);

          g.fillStyle(COLORS.sofa);
          g.fillRoundedRect(
            x + 5,
            y + 4,
            w - 10,
            h - 8,
            4
          );

          g.fillStyle(0xafd1c9);
          g.fillRect(x + 13, y + 6, w - 26, 10);

          g.lineStyle(1, 0x5f9193);
          g.lineBetween(
            x + w / 2,
            y + 7,
            x + w / 2,
            y + h - 5
          );
        } else if (type === "table") {
          g.fillStyle(COLORS.table);
          g.fillEllipse(x + w / 2, y + h / 2, w, h);

          g.fillStyle(0xfaf0d6);
          g.fillRect(x + 20, y + 9, 15, 19);

          g.fillStyle(0x577c79);
          g.fillCircle(x + 44, y + 22, 5);
        } else if (type === "lounger") {
          g.fillStyle(0xbc9674);
          g.fillRoundedRect(x, y, w, h, 4);

          g.fillStyle(0xfff4d9);
          g.fillRect(x + 4, y + 4, w - 8, h - 8);

          g.fillStyle(0xe6b69c);
          g.fillRect(x + 4, y + 7, w - 8, 14);

          g.lineStyle(1, 0xdbcaad);
          g.lineBetween(
            x + 4,
            y + 27,
            x + w - 4,
            y + 27
          );
        }
      }
    );

    PALMS.forEach(({ x, y }) => {
      g.fillStyle(0x9b8862, 0.18);
      g.fillEllipse(x + 8, y + 22, 50, 20);

      g.fillStyle(COLORS.pot);
      g.fillRect(x - 7, y, 14, 28);

      g.fillStyle(COLORS.plant);
      g.fillEllipse(x - 15, y - 10, 49, 15);
      g.fillEllipse(x + 17, y - 6, 49, 15);
      g.fillEllipse(x - 8, y - 22, 19, 40);

      g.fillStyle(0x78ad8f);
      g.fillEllipse(x + 8, y - 23, 19, 40);
      g.fillEllipse(x, y - 8, 30, 22);
    });
  }

  createPlayer() {
    if (!this.textures.exists("campus-player")) {
      const avatar = this.make.graphics({
        x: 0,
        y: 0,
        add: false,
      });

      avatar.fillStyle(0x000000, 0.2);
      avatar.fillEllipse(2, 29, 24, 7);

      avatar.fillStyle(0x354158);
      avatar.fillRect(7, 23, 6, 8);
      avatar.fillRect(16, 23, 6, 8);

      avatar.fillStyle(0x7459cc);
      avatar.fillRect(5, 13, 19, 13);

      avatar.fillStyle(0xd9a17e);
      avatar.fillRect(8, 5, 14, 11);

      avatar.fillStyle(0x2e2b36);
      avatar.fillRect(6, 2, 18, 7);
      avatar.fillRect(5, 6, 5, 7);

      avatar.fillStyle(0x25232b);
      avatar.fillRect(11, 10, 2, 2);
      avatar.fillRect(18, 10, 2, 2);

      avatar.generateTexture("campus-player", 30, 34);
      avatar.destroy();
    }

    this.player = this.physics.add.sprite(
      PLAYER_START.x,
      PLAYER_START.y,
      "campus-player"
    );

    this.player.setDepth(10);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(20, 23);
    this.player.body.setOffset(5, 9);

    this.playerLabel = this.add
      .text(
        PLAYER_START.x,
        PLAYER_START.y - 34,
        this.playerName || "You",
        {
          fontFamily: "Arial",
          fontSize: "13px",
          color: COLORS.labelText,
          backgroundColor: "#242633",
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
  }

  createKeyboardControls() {
    this.keys = this.input.keyboard.addKeys(
      {
        up: Phaser.Input.Keyboard.KeyCodes.UP,
        down: Phaser.Input.Keyboard.KeyCodes.DOWN,
        left: Phaser.Input.Keyboard.KeyCodes.LEFT,
        right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        w: Phaser.Input.Keyboard.KeyCodes.W,
        a: Phaser.Input.Keyboard.KeyCodes.A,
        s: Phaser.Input.Keyboard.KeyCodes.S,
        d: Phaser.Input.Keyboard.KeyCodes.D,
      },
      false
    );

    this.input.keyboard.on("keydown", (event) => {
      const element = document.activeElement;

      const typing =
        element?.matches(
          "input, textarea, select, [contenteditable='true']"
        ) || false;

      const movementKeys = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "w",
        "a",
        "s",
        "d",
        "W",
        "A",
        "S",
        "D",
      ];

      if (!typing && movementKeys.includes(event.key)) {
        event.preventDefault();
      }
    });
  }

  setVirtualDirection(direction, pressed) {
    if (direction in this.virtualDirection) {
      this.virtualDirection[direction] = pressed;
    }
  }

  stopVirtualMovement() {
    Object.keys(this.virtualDirection).forEach((direction) => {
      this.virtualDirection[direction] = false;
    });
  }

  update() {
    if (!this.player?.body || !this.keys) return;

    const element = document.activeElement;

    const typing =
      element?.matches(
        "input, textarea, select, [contenteditable='true']"
      ) || false;

    const velocity = new Phaser.Math.Vector2(0, 0);

    if (!typing) {
      const left =
        this.keys.left.isDown ||
        this.keys.a.isDown ||
        this.virtualDirection.left;

      const right =
        this.keys.right.isDown ||
        this.keys.d.isDown ||
        this.virtualDirection.right;

      const up =
        this.keys.up.isDown ||
        this.keys.w.isDown ||
        this.virtualDirection.up;

      const down =
        this.keys.down.isDown ||
        this.keys.s.isDown ||
        this.virtualDirection.down;

      if (left) velocity.x -= 1;
      if (right) velocity.x += 1;
      if (up) velocity.y -= 1;
      if (down) velocity.y += 1;
    }

    velocity.normalize().scale(165);

    this.player.setVelocity(velocity.x, velocity.y);

    this.playerLabel.setPosition(
      this.player.x,
      this.player.y - 31
    );
  }
}