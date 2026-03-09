export default function Card({
  title,
  children,
  center = false,
  noBorder = false,
  titleCenter = true,
  padding = 16, // default
  style = {},
}) {
  // 🔹 función para normalizar padding
  const getPadding = () => {
    if (typeof padding === "number") {
      return `${padding}px`;
    }

    if (typeof padding === "string") {
      return padding;
    }

    if (typeof padding === "object") {
      const { top = 0, right = 0, bottom = 0, left = 0 } = padding;
      return `${top}px ${right}px ${bottom}px ${left}px`;
    }

    return "16px"; // fallback
  };

  return (
    <div
      style={{
        border: noBorder ? "none" : "1px solid #e5e5e5",
        borderRadius: 8,
        padding: getPadding(),
        ...style,
      }}
    >
      <h3
        style={{
          textAlign: titleCenter ? "center" : "left",
          fontWeight: "bold",
        }}
      >
        {title}
      </h3>

      <div style={{ textAlign: center ? "center" : "left" }}>{children}</div>
    </div>
  );
}
