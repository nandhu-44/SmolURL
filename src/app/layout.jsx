import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Smol URL",
  description: "Advanced URL shortening service with customization and analytics",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/link.png" />
      </head>
      <body className={`antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
