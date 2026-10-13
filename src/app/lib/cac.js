const INDEX_FIELDS = ["general", "materials", "labour_force"];

const INDEX_NAMES = {
  general: "General",
  materials: "Materiales",
  labour_force: "Mano de obra",
};

function isValidPositiveNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) && number > 0;
}

function isAnomalous(previous, current, next) {
  if (
    !isValidPositiveNumber(previous) ||
    !isValidPositiveNumber(current) ||
    !isValidPositiveNumber(next)
  ) {
    return false;
  }

  const prev = Number(previous);
  const value = Number(current);
  const nextValue = Number(next);

  const ratioWithPrevious = value / prev;
  const ratioWithNext = value / nextValue;

  // Valor actual más del doble que ambos vecinos
  if (ratioWithPrevious > 2 && ratioWithNext > 2) {
    return true;
  }

  // Valor actual menor a la mitad de ambos vecinos
  if (ratioWithPrevious < 0.5 && ratioWithNext < 0.5) {
    return true;
  }

  return false;
}

export async function getCACHistorico() {
  const res = await fetch("https://prestamos.ikiwi.net.ar/api/cacs", {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error("Error al obtener CAC");
  }

  const data = await res.json();

  // Ordenamos cronológicamente antes de analizar.
  data.sort((a, b) => new Date(a.period) - new Date(b.period));

  const anomalies = [];

  const cleanedData = data.map((item, index) => {
    const previous = data[index - 1];
    const next = data[index + 1];

    const cleanedItem = {
      ...item,
    };

    for (const field of INDEX_FIELDS) {
      const anomalous = isAnomalous(
        previous?.[field],
        item[field],
        next?.[field],
      );

      if (!anomalous) {
        continue;
      }

      anomalies.push({
        period: item.period,
        field,
        fieldName: INDEX_NAMES[field],
        value: item[field],
        previousValue: previous[field],
        nextValue: next[field],
      });

      // No intentamos corregirlo.
      // null hace que Recharts deje un hueco.
      cleanedItem[field] = null;
    }

    return cleanedItem;
  });

  return {
    data: cleanedData,
    anomalies,
  };
}

// src/lib/cac.js

// export async function getCACHistorico() {
//   const res = await fetch("https://prestamos.ikiwi.net.ar/api/cacs", {
//     next: { revalidate: 3600 },
//   });

//   if (!res.ok) {
//     throw new Error("Error al obtener CAC");
//   }

//   const data = await res.json();

//   // Sanitizado automático + corrección de casos puntuales
//   const cleanData = data.map((item) => {
//     let general = item.general;
//     let materials = item.materials;
//     let labour_force = item.labour_force;

//     // Corrección automática si a un número le faltó la coma (p. ej. es 100 veces más grande)
//     if (general > 100000) general /= 100;
//     if (materials > 100000) materials /= 100;
//     if (labour_force > 100000) labour_force /= 100;

//     // Si hay algún período en particular con valores erróneos en la API (ejemplo Junio)
//     if (item.period === "2024-06" || item.period === "2024-06-01") {
//       // Ajustas a los valores reales si el parser de arriba no alcanza
//       general = 1234.56; // Pon los valores correctos aquí
//     }

//     return {
//       ...item,
//       general,
//       materials,
//       labour_force,
//     };
//   });

//   cleanData.sort((a, b) => new Date(a.period) - new Date(b.period));

//   return cleanData;
// }
