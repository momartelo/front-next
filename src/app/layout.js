import { Roboto } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata = {
  title: "Dashboard Económico",
  description: "Precios de combustibles y divisas en tiempo real",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${roboto.variable} font-sans antialiased`}>
        <Nav />
        {children}
      </body>
    </html>
  );
}
