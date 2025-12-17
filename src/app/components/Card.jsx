export default function Card({
  title,
  children,
  center = false,
  noBorder = false,
  titleCenter = true, // por defecto centrado
}) {
  return (
    <div
      style={{
        border: noBorder ? "none" : "1px solid #e5e5e5",
        borderRadius: 8,
        padding: 16,
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
