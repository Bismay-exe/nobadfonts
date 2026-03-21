
type ProgressiveBlurProps = {
  className?: string;
  backgroundColor?: string;
  position?: "top" | "bottom";
  height?: string;
  blurAmount?: string;
  zIndex?: number;
};

/**
 * ProgressiveBlur component creates a smooth blurring effect at the edges of a container.
 * It uses backdrop-filter and mask-image to create a gradient-like blur.
 */
const ProgressiveBlur = ({
  className = "",
  backgroundColor = "rgb(var(--color-background))",
  position = "top",
  height = "120px",
  blurAmount = "12px",
  zIndex = 40,
}: ProgressiveBlurProps) => {
  const isTop = position === "top";

  return (
    <div
      className={`pointer-events-none fixed left-0 w-full select-none ${className}`}
      style={{
        [isTop ? "top" : "bottom"]: 0,
        height,
        background: isTop
          ? `linear-gradient(to top, transparent 0%, ${backgroundColor} 100%)`
          : `linear-gradient(to bottom, transparent 0%, ${backgroundColor} 100%)`,
        maskImage: isTop
          ? `linear-gradient(to bottom, black 0%, transparent 100%)`
          : `linear-gradient(to top, black 0%, transparent 100%)`,
        WebkitMaskImage: isTop
          ? `linear-gradient(to bottom, black 0%, transparent 100%)`
          : `linear-gradient(to top, black 0%, transparent 100%)`,
        WebkitBackdropFilter: `blur(${blurAmount})`,
        backdropFilter: `blur(${blurAmount})`,
        WebkitUserSelect: "none",
        userSelect: "none",
        zIndex,
      }}
    />
  );
};

export default ProgressiveBlur;
