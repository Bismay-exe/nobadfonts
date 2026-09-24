import {
    forwardRef,
    useMemo,
    useRef,
    useEffect,
    type MutableRefObject,
    type CSSProperties,
    type HTMLAttributes
} from 'react';
import { motion } from 'motion/react';

function useAnimationFrame(callback: () => void) {
    useEffect(() => {
        let frameId: number;
        const loop = () => {
            callback();
            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [callback]);
}

function useMousePositionRef(containerRef: MutableRefObject<HTMLElement | null>) {
    const positionRef = useRef({ x: -9999, y: -9999 });

    useEffect(() => {
        const updatePosition = (x: number, y: number) => {
            if (containerRef?.current) {
                const rect = containerRef.current.getBoundingClientRect();
                positionRef.current = { x: x - rect.left, y: y - rect.top };
            } else {
                positionRef.current = { x, y };
            }
        };

        const handleMouseMove = (ev: MouseEvent) => updatePosition(ev.clientX, ev.clientY);
        const handleTouchMove = (ev: TouchEvent) => {
            const touch = ev.touches[0];
            updatePosition(touch.clientX, touch.clientY);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, [containerRef]);

    return positionRef;
}

interface VariableProximityProps extends HTMLAttributes<HTMLSpanElement> {
    label: string;
    fromFontVariationSettings: string;
    toFontVariationSettings: string;
    containerRef: MutableRefObject<HTMLElement | null>;
    radius?: number;
    falloff?: 'linear' | 'exponential' | 'gaussian';
    className?: string;
    onClick?: () => void;
    style?: CSSProperties;
}

const VariableProximity = forwardRef<HTMLSpanElement, VariableProximityProps>((props, ref) => {
    const {
        label,
        fromFontVariationSettings,
        toFontVariationSettings,
        containerRef,
        radius = 50,
        falloff = 'linear',
        className = '',
        onClick,
        style,
        ...restProps
    } = props;

    const currentFalloffRef = useRef<number[]>([]);
    const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const interpolatedSettingsRef = useRef<string[]>([]);
    const mousePositionRef = useMousePositionRef(containerRef);
    // const lastPositionRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

    const parsedSettings = useMemo(() => {
        const parseSettings = (settingsStr: string) =>
            new Map(
                settingsStr
                    .split(',')
                    .map(s => s.trim())
                    .map(s => {
                        const [name, value] = s.split(' ');
                        return [name.replace(/['"]/g, ''), parseFloat(value)];
                    })
            );

        const fromSettings = parseSettings(fromFontVariationSettings);
        const toSettings = parseSettings(toFontVariationSettings);

        return Array.from(fromSettings.entries()).map(([axis, fromValue]) => ({
            axis,
            fromValue,
            toValue: toSettings.get(axis) ?? fromValue
        }));
    }, [fromFontVariationSettings, toFontVariationSettings]);

    const calculateDistance = (x1: number, y1: number, x2: number, y2: number) =>
        Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

    const calculateFalloff = (distance: number) => {
        const norm = Math.min(Math.max(1 - distance / radius, 0), 1);
        switch (falloff) {
            case 'exponential':
                return norm ** 2;
            case 'gaussian':
                return Math.exp(-((distance / (radius / 2)) ** 2) / 2);
            case 'linear':
            default:
                return norm;
        }
    };

    useAnimationFrame(() => {
        if (!containerRef?.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();

        letterRefs.current.forEach((letterRef, index) => {
            if (!letterRef) return;

            const rect = letterRef.getBoundingClientRect();
            const letterCenterX = rect.left + rect.width / 2 - containerRect.left;
            const letterCenterY = rect.top + rect.height / 2 - containerRect.top;

            const distance = calculateDistance(
                mousePositionRef.current.x,
                mousePositionRef.current.y,
                letterCenterX,
                letterCenterY
            );

            // Calculate target falloff based on distance
            let targetFalloff = 0;
            if (distance < radius) {
                targetFalloff = calculateFalloff(distance);
            }

            // Initialize if undefined
            if (currentFalloffRef.current[index] === undefined) {
                currentFalloffRef.current[index] = 0;
            }

            let currentFalloff = currentFalloffRef.current[index];
            
            // Smoothly lerp current falloff towards target falloff
            // 0.15 is the smoothing factor. Lower = smoother/slower, Higher = faster/snappier
            if (Math.abs(targetFalloff - currentFalloff) > 0.0001) {
                currentFalloff += (targetFalloff - currentFalloff) * 0.15;
            } else {
                currentFalloff = targetFalloff;
            }
            
            currentFalloffRef.current[index] = currentFalloff;

            // Performance optimization: skip updating DOM if it's already resting at 0
            if (currentFalloff === 0 && interpolatedSettingsRef.current[index] === fromFontVariationSettings) {
                return;
            }

            const newSettings = parsedSettings
                .map(({ axis, fromValue, toValue }) => {
                    const interpolatedValue = fromValue + (toValue - fromValue) * currentFalloff;
                    return `"${axis}" ${interpolatedValue}`;
                })
                .join(', ');

            interpolatedSettingsRef.current[index] = newSettings;
            letterRef.style.setProperty('font-variation-settings', newSettings);
        });
    });

    const words = label.split(' ');
    let letterIndex = 0;

    return (
        <span
            ref={ref}
            onClick={onClick}
            style={{
                display: 'inline',
                ...style
            }}
            className={className}
            {...restProps}
        >
            {words.map((word, wordIndex) => (
                <span key={wordIndex} className="inline-block whitespace-nowrap">
                    {word.split('').map(letter => {
                        const currentLetterIndex = letterIndex++;
                        return (
                            <motion.span
                                key={currentLetterIndex}
                                ref={el => {
                                    letterRefs.current[currentLetterIndex] = el;
                                }}
                                style={{
                                    display: 'inline-block',
                                    fontVariationSettings: interpolatedSettingsRef.current[currentLetterIndex]
                                }}
                                aria-hidden="true"
                            >
                                {letter}
                            </motion.span>
                        );
                    })}
                    {wordIndex < words.length - 1 && <span className="inline-block">&nbsp;</span>}
                </span>
            ))}
            <span className="sr-only">{label}</span>
        </span>
    );
});

VariableProximity.displayName = 'VariableProximity';
export default VariableProximity;
