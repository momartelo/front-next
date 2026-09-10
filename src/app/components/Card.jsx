export default function Card({
  title,
  children,
  center = false,
  noBorder = false,
  titleCenter = true,
  padding = "p-4 sm:p-5", // Acepta clases de Tailwind o un string/objeto inline
  style = {},
  className = "",
}) {
  // Normalizador de padding compatible con Tailwind o Inline Styles
  const getPaddingClass = () => {
    if (typeof padding === "string" && padding.includes("p-")) {
      return padding; // Ej: "p-4", "px-3 py-2"
    }
    return "";
  };

  const getPaddingStyle = () => {
    if (typeof padding === "number") return { padding: `${padding}px` };
    if (typeof padding === "object") {
      const { top = 0, right = 0, bottom = 0, left = 0 } = padding;
      return { padding: `${top}px ${right}px ${bottom}px ${left}px` };
    }
    if (typeof padding === "string" && !padding.includes("p-")) {
      return { padding };
    }
    return {};
  };

  return (
    <div
      style={{ ...getPaddingStyle(), ...style }}
      className={`
        bg-white dark:bg-gray-900 
        rounded-2xl h-full 
        transition-all duration-200 
        shadow-sm hover:shadow-md 
        ${noBorder ? "" : "border border-gray-100 dark:border-gray-800/80"} 
        ${getPaddingClass()} 
        ${className}
      `}
    >
      {title && (
        <h3
          className={`
            font-bold text-gray-800 dark:text-gray-100 mb-3 text-base sm:text-lg leading-snug
            ${titleCenter ? "text-center" : "text-left"}
          `}
        >
          {title}
        </h3>
      )}

      <div
        className={`${center ? "h-full text-center flex flex-col items-center justify-center" : "text-left"}`}
      >
        {children}
      </div>
    </div>
  );
}

// export default function Card({
//   title,
//   children,
//   center = false,
//   noBorder = false,
//   titleCenter = true,
//   padding = 16, // default
//   style = {},
// }) {
//   // 🔹 función para normalizar padding
//   const getPadding = () => {
//     if (typeof padding === "number") {
//       return `${padding}px`;
//     }

//     if (typeof padding === "string") {
//       return padding;
//     }

//     if (typeof padding === "object") {
//       const { top = 0, right = 0, bottom = 0, left = 0 } = padding;
//       return `${top}px ${right}px ${bottom}px ${left}px`;
//     }

//     return "16px"; // fallback
//   };

//   return (
//     <div
//       style={{
//         border: noBorder ? "none" : "1px solid #e5e5e5",
//         borderRadius: 8,
//         padding: getPadding(),
//         ...style,
//       }}
//     >
//       <h3
//         style={{
//           textAlign: titleCenter ? "center" : "left",
//           fontWeight: "bold",
//         }}
//       >
//         {title}
//       </h3>

//       <div style={{ textAlign: center ? "center" : "left" }}>{children}</div>
//     </div>
//   );
// }
