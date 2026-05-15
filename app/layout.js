import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import ClientLayout from "./components/ClientLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Dropit",
  description: "Dropit - logística inteligente",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dropit",
  },
  icons: {
    apple: "/icons/apple-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          min-h-[100dvh]
          overflow-x-hidden
          bg-gradient-to-br
          from-blue-50/70
          via-white
          to-sky-100/60
          text-slate-900
          antialiased
        `}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}