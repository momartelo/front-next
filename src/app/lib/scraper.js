import * as cheerio from "cheerio";

export async function getPrecioSakuraById(id) {
  const url = `https://www.sakurasa.com/productos_ver.php?cod=${id}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    const html = await res.text();
    const $ = cheerio.load(html);

    // Buscamos el patrón de precio ($ 1.234,56)
    const precioTexto = $("body")
      .text()
      .match(/\$\s?([0-9.]+,[0-9]{2})/);

    if (precioTexto) {
      // Limpiamos el texto para convertirlo en un número real
      return parseFloat(precioTexto[1].replace(/\./g, "").replace(",", "."));
    }
    return 0;
  } catch (error) {
    console.error(`Error en ID ${id}:`, error);
    return 0;
  }
}

export async function getPrecioRopelato(url) {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0", // importante para evitar bloqueos
      },
    });

    if (!res.ok) {
      throw new Error("Error al cargar la página");
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Selector del precio (precio principal del producto)
    const precioTexto = $(".product-price, .current-price span")
      .first()
      .text()
      .trim();

    if (!precioTexto) return 0;

    // Ej: "$ 23.456,78"
    const precio = precioTexto
      .replace(/\$/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
      .trim();

    return Number(precio) || 0;
  } catch (error) {
    console.error("Error Ropelato:", error);
    return 0;
  }
}
