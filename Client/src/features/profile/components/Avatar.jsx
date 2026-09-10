import { avatarRects } from "../avatarPresets";

export default function Avatar({ avatar, size = 40 }) {
  return (
    <svg
      viewBox="0 0 30 34"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
      }}
    >
      {avatarRects(avatar).map(
        ([x, y, width, height, fill], index) => (
          <rect
            key={index}
            x={x}
            y={y}
            width={width}
            height={height}
            fill={fill}
          />
        )
      )}
    </svg>
  );
}