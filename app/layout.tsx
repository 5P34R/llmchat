import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "LLM Chat App - AI Assistant with Code Execution",
  description: "Advanced AI chat application with code execution, beautification, and live preview capabilities",
  keywords: "AI, chat, code execution, HTML preview, CSS preview, JavaScript, programming assistant",
  authors: [{ name: "LLM Chat Team" }],
  openGraph: {
    title: "LLM Chat App",
    description: "Advanced AI chat with code execution and preview",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LLM Chat App",
    description: "Advanced AI chat with code execution and preview",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.a4f.co" />
        <link rel="dns-prefetch" href="https://api.a4f.co" />
      </head>
      <body className="antialiased min-h-screen">
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            storageKey="llm-chat-theme"
          >
            {children}
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}