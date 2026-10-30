import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATLAS — Temporal Change Intelligence",
  description:
    "Compare imagery captured at different times. Align scenes, account for lighting, and localize meaningful visual changes with ATLAS.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const queryTheme = new URLSearchParams(window.location.search).get("theme");
                const savedTheme = localStorage.getItem("theme");
                const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                const theme = queryTheme === "light" || queryTheme === "dark" ? queryTheme : (savedTheme || preferredTheme);
                document.documentElement.dataset.theme = theme;
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
