export default function Card({ title, children }) {
  return (
    <div
      style={{
        border: "1px solid #e5e5e5",
        borderRadius: 8,
        padding: 16,
      }}
    >
      <h3>{title}</h3>
      {children}
    </div>
  );
}
