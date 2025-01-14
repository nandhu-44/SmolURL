import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Smol URL",
  description: "Advanced URL shortening service with customization and analytics",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
