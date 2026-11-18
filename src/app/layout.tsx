import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "smolurl", template: "%s · smolurl" },
  description: "Short links with names you choose, click stats, QR codes and an API.",
  authors: [{ name: "Nandhu Krishnan A" }],
  icons: { icon: { url: "/api/icon", type: "image/svg+xml" } },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f6f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1216" },
  ],
};

// Runs before first paint so the saved theme never flashes. Modes: "light" | "dark" | "system" (default).
// The choice is read from the `theme` cookie (also used by the server), falling back to localStorage.
const themeScript = `(function(){var t=null;try{var m=document.cookie.match(/(?:^|; )theme=(light|dark)/);t=m?m[1]:null}catch(e){}if(!t){try{t=localStorage.getItem('theme')}catch(e){}}var d=t==='dark';if(!t||(t!=='light'&&t!=='dark')){try{d=matchMedia('(prefers-color-scheme: dark)').matches}catch(e){}}var c=document.documentElement.classList;c.toggle('dark',d);c.toggle('light',t==='light')})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
