import type { Metadata } from "next";
import { JetBrains_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DevVault | Secure Secrets Manager",
  description:
    "A cyberpunk-themed secure secrets manager for developers. Store, manage, and share encrypted credentials with zero-knowledge architecture.",
  keywords: ["secrets manager", "encryption", "developer tools", "security", "credentials"],
  authors: [{ name: "DevVault" }],
  themeColor: "#0A0A0F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${jetbrainsMono.variable} ${ibmPlexSans.variable} font-sans antialiased bg-cyber-dark text-slate-50 min-h-screen`}
      >
        <main className="relative">{children}</main>
      </body>
    </html>
  );
}
