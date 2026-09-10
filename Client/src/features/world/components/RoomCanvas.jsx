import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";

import useAuth from "../../../hooks/useAuth";
import MultiplayerRoomScene from "../scenes/MultiplayerRoomScene";
import styles from "../world.module.css";

const directions = [
    { direction: "up", label: "Move up", symbol: "↑" },
    { direction: "left", label: "Move left", symbol: "←" },
    { direction: "down", label: "Move down", symbol: "↓" },
    { direction: "right", label: "Move right", symbol: "→" },
];

export default function RoomCanvas({
    players,
    selfSocketId,
    connected,
    onMove,
    onPunch,
    hitEvents = [],
    punchStatus = "",
}) {
    const { user } = useAuth();

    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const seenHits = useRef(new Set());

    const networkRef = useRef({
        players: [],
        selfSocketId: "",
        connected: false,
        onMove: () => { },
    });

    const [ready, setReady] = useState(false);

    useEffect(() => {
        networkRef.current = {
            players,
            selfSocketId,
            connected,
            onMove,
        };
    }, [players, selfSocketId, connected, onMove]);

    useEffect(() => {
        const host = containerRef.current;
        if (!host) return;

        let cancelled = false;
        let game;
        let observer;

        const bootTimer = window.setTimeout(() => {
            if (cancelled) return;

            const scene = new MultiplayerRoomScene(
                user?.name || "You",
                () => networkRef.current,
                () => document.activeElement === host
            );

            sceneRef.current = scene;

            scene.onMapReady = () => {
                if (!cancelled) setReady(true);
            };

            game = new Phaser.Game({
                type: Phaser.AUTO,
                parent: host,
                width: 960,
                height: 600,
                backgroundColor: "#91ced1",
                pixelArt: true,
                antialias: false,
                input: {
                    mouse: {
                        preventDefaultWheel: false,
                    },
                },

                physics: {
                    default: "arcade",
                    arcade: {
                        gravity: { x: 0, y: 0 },
                        debug: false,
                    },
                },

                scale: {
                    mode: Phaser.Scale.FIT,
                    autoCenter: Phaser.Scale.CENTER_BOTH,
                },

                scene,
            });

            observer = new ResizeObserver(() => {
                if (!cancelled) game.scale.refresh();
            });

            observer.observe(host);
        }, 0);

        function stopControls() {
            sceneRef.current?.stopVirtualMovement();

            if (sceneRef.current?.keys) {
                Object.values(sceneRef.current.keys).forEach(
                    (key) => key.reset()
                );
            }
        }

        window.addEventListener("blur", stopControls);
        document.addEventListener(
            "visibilitychange",
            stopControls
        );

        return () => {
            cancelled = true;
            window.clearTimeout(bootTimer);

            window.removeEventListener("blur", stopControls);
            document.removeEventListener(
                "visibilitychange",
                stopControls
            );

            observer?.disconnect();
            sceneRef.current = null;
            game?.destroy(true);
        };
    }, [user?.name]);

    useEffect(() => {
        if (
            !ready ||
            !connected ||
            !sceneRef.current?.player
        ) {
            return;
        }

        for (const hit of hitEvents) {
            if (seenHits.current.has(hit.id)) continue;

            seenHits.current.add(hit.id);
            sceneRef.current.showPunchHit(hit);
        }

        if (seenHits.current.size > 100) {
            seenHits.current = new Set(
                hitEvents.map((hit) => hit.id)
            );
        }
    }, [hitEvents, ready, connected]);

    function release(direction) {
        sceneRef.current?.setVirtualDirection(
            direction,
            false
        );
    }

    return (
        <section className={styles.world}>
            <header className={styles.header}>
                <div>
                    <span>COASTAL CLUBHOUSE</span>
                    <h2>Interactive campus</h2>
                </div>

                <p role="status">
                    {!ready
                        ? "Loading map…"
                        : connected
                            ? `${players.length} avatars in room`
                            : "Waiting for room connection…"}
                </p>
            </header>

            <div
                ref={containerRef}
                className={styles.game}
                tabIndex={0}
                aria-label="Campus map. Focus here and use WASD or arrow keys."
                onKeyDown={(event) => {
                    if (
                        event.key.toLowerCase() === "f" &&
                        !event.repeat &&
                        event.target === event.currentTarget &&
                        ready &&
                        connected
                    ) {
                        event.preventDefault();
                        onPunch?.();
                    }
                }}
                onPointerDown={() => {
                    containerRef.current?.focus();
                }}
            />

            <p className={styles.help}>
                Click map: WASD / arrows to move, F to punch.
                Tab to leave map.
            </p>

            <button
                type="button"
                disabled={!ready || !connected}
                onClick={() => {
                    containerRef.current?.focus();
                    onPunch?.();
                }}
            >
                👊 Punch (F)
            </button>

            <p role="status">{punchStatus}</p>

            <div
                className={styles.controls}
                aria-label="Movement controls"
            >
                {directions.map(({ direction, label, symbol }) => (
                    <button
                        key={direction}
                        type="button"
                        className={styles[direction]}
                        aria-label={label}
                        disabled={!ready || !connected}
                        onPointerDown={(event) => {
                            event.preventDefault();

                            event.currentTarget.setPointerCapture(
                                event.pointerId
                            );

                            containerRef.current?.focus();

                            sceneRef.current?.setVirtualDirection(
                                direction,
                                true
                            );
                        }}
                        onPointerUp={() => release(direction)}
                        onPointerCancel={() => release(direction)}
                        onLostPointerCapture={() => release(direction)}
                        onKeyDown={(event) => {
                            if (
                                event.key === " " ||
                                event.key === "Enter"
                            ) {
                                event.preventDefault();

                                sceneRef.current?.setVirtualDirection(
                                    direction,
                                    true
                                );
                            }
                        }}
                        onKeyUp={() => release(direction)}
                        onBlur={() => release(direction)}
                        onContextMenu={(event) => {
                            event.preventDefault();
                        }}
                    >
                        {symbol}
                    </button>
                ))}
            </div>
        </section>
    );
}