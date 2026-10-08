import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "../../lib/utils";
import "../../styles/like-effect.css";

/* ══ Like ═════════════════════════════════════════════════
   A heart and a count. Press it and the heart springs, a disc
   blooms where it was and hollows out into a ring, seven pairs
   of coloured dots burst off the ring, and the count rolls
   up or down like an odometer.
*/

const CONFETTI = ["#f48ea7", "#cc8ef5", "#8ce8c3", "#91d2fa", "#f5a524", "#e5484d", "#9fc7fa"];

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const fmt = (n: number) => n.toLocaleString("en-US");

function Roll({ value, up }: { value: number; up: boolean }) {
    const chars = fmt(value).split("");
    return (
        <span className="lk-count" aria-hidden="true">
            {chars.map((c, i) => {
                const place = chars.length - 1 - i;
                if (c === ",") return <span key={`c${place}`} className="lk-comma">,</span>;
                return (
                    <span key={`p${place}`} className="lk-wheel">
                        <AnimatePresence initial={false} mode="popLayout">
                            <motion.span
                                key={c}
                                className="lk-digit"
                                initial={{ y: up ? "100%" : "-100%", opacity: 0 }}
                                animate={{ y: "0%", opacity: 1 }}
                                exit={{ y: up ? "-100%" : "100%", opacity: 0 }}
                                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1], delay: place * 0.03 }}
                            >
                                {c}
                            </motion.span>
                        </AnimatePresence>
                    </span>
                );
            })}
        </span>
    );
}

export const EFFECTS = ["Bloom", "Firework"] as const;

const jit = (k: number, seed: number) => {
    const x = Math.sin(k * 12.9898 + seed * 78.233) * 43758.5453;
    return x - Math.floor(x);
};

function Burst({ fx, fly, ink }: { fx: string; fly: number; ink: boolean }) {
    const c = (k: number) => (ink ? "var(--lk-on)" : CONFETTI[k % CONFETTI.length]);
    const style = (o: Record<string, string | number>) => o as React.CSSProperties;

    if (fx === "Firework") {
        return (
            <>
                {Array.from({ length: 12 }, (_, k) => {
                    const a = -Math.PI / 2 + (k / 11 - 0.5) * Math.PI * 1.25;
                    const v = 22 + fly * 22 + jit(k, 7) * 10;
                    return (
                        <span key={k} className="lk-fw" style={style({ "--x": `${Math.cos(a) * v}px`, "--d": `${jit(k, 8) * 60}ms` })}>
                            <i style={style({ "--y": `${Math.sin(a) * v}px`, background: c(k) })} />
                        </span>
                    );
                })}
            </>
        );
    }

    return (
        <>
            <span className="lk-bloom" />
            {Array.from({ length: 7 }, (_, k) => (
                <span key={k} className="lk-spoke" style={style({ "--a": `${k * (360 / 7) - 90}deg` })}>
                    <i style={style({ "--c": c(k) })} />
                    <i style={style({ "--c": c(k + 3) })} />
                </span>
            ))}
        </>
    );
}

export interface LikeProps {
    start?: number;
    count?: number;
    liked?: boolean;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onToggle?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    effect?: "Bloom" | "Firework";
    burst?: number;
    color?: "Red" | "Pink" | "Accent" | "Ink" | string;
    size?: number;
    className?: string;
    style?: React.CSSProperties;
    disabled?: boolean;
    showCount?: boolean;
    "aria-label"?: string;
}

export function Like({
    start = 0,
    count,
    liked,
    onClick,
    onToggle,
    effect = "Bloom",
    burst = 55,
    color = "Pink",
    size = 20,
    className = "",
    style,
    disabled = false,
    showCount = true,
    "aria-label": ariaLabel,
}: LikeProps) {
    const isControlled = liked !== undefined;
    const [internalLiked, setInternalLiked] = useState(false);
    const activeLiked = isControlled ? Boolean(liked) : internalLiked;

    const base = Math.max(0, Math.round(start));
    const activeCount = count !== undefined ? count : (base + (activeLiked ? 1 : 0));

    const [beat, setBeat] = useState(0);
    const [directionUp, setDirectionUp] = useState(true);
    const prevLikedRef = useRef(activeLiked);
    const prevCountRef = useRef(activeCount);

    useEffect(() => {
        if (activeLiked && !prevLikedRef.current) {
            setBeat((b) => b + 1);
            setDirectionUp(true);
        } else if (!activeLiked && prevLikedRef.current) {
            setDirectionUp(false);
        }
        prevLikedRef.current = activeLiked;
    }, [activeLiked]);

    useEffect(() => {
        if (activeCount > prevCountRef.current) {
            setDirectionUp(true);
        } else if (activeCount < prevCountRef.current) {
            setDirectionUp(false);
        }
        prevCountRef.current = activeCount;
    }, [activeCount]);

    const fly = clamp(burst, 0, 100) / 100;
    const ink = color === "Ink";
    const fx = (EFFECTS as readonly string[]).includes(effect) ? effect : "Bloom";

    const getColorValue = (c: string) => {
        if (c === "Pink") return "#ec4899";
        if (c === "Accent") return "var(--color-accent, #ff90e8)";
        if (c === "Red") return "#e5484d";
        if (c === "Ink") return "var(--color-foreground, currentColor)";
        return c;
    };

    const getBloomColor = (c: string) => {
        if (c === "Pink") return "#f472b6";
        if (c === "Accent") return "var(--color-accent, #ff90e8)";
        if (c === "Red") return "#cc8ef5";
        return "#cc8ef5";
    };

    const press = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled) return;

        if (!isControlled) {
            const next = !internalLiked;
            setInternalLiked(next);
            if (next) {
                setBeat((b) => b + 1);
            }
        } else {
            if (!activeLiked) {
                setBeat((b) => b + 1);
            }
        }

        if (onClick) onClick(e);
        if (onToggle) onToggle(e);
    };

    const colorValue = getColorValue(color);
    const bloomColor = getBloomColor(color);

    return (
        <button
            type="button"
            className={cn("lk", className)}
            data-liked={activeLiked || undefined}
            data-color={color}
            data-fx={fx}
            aria-pressed={activeLiked}
            aria-label={ariaLabel || `Like. ${fmt(activeCount)} likes`}
            style={{
                "--lk-on": colorValue,
                "--lk-bloom-color": bloomColor,
                "--lk-heart-size": `${size}px`,
                ...style,
            } as React.CSSProperties}
            onClick={press}
            disabled={disabled}
        >
            <span className="lk-heart">
                <span
                    key={activeLiked ? `on${beat}` : "off"}
                    className="lk-glyph"
                    data-liked={activeLiked ? "true" : undefined}
                    data-on={activeLiked && beat > 0 ? "true" : undefined}
                >
                    <Heart
                        size={size}
                        strokeWidth={2.3}
                        fill={activeLiked ? "currentColor" : "none"}
                    />
                </span>
                {activeLiked && fly > 0 && beat > 0 && (
                    <span
                        key={beat}
                        className="lk-burst"
                        style={{ "--fly": fly } as React.CSSProperties}
                        aria-hidden="true"
                    >
                        <Burst fx={fx} fly={fly} ink={ink} />
                    </span>
                )}
            </span>
            {showCount && <Roll value={activeCount} up={directionUp} />}
        </button>
    );
}

export default Like;
