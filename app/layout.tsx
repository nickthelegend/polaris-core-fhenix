import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AppHeader } from "@/components/header"
import { AppFooter } from "@/components/footer"
import { Providers } from "@/components/providers"
import { Suspense } from "react"
import { ErrorBoundary } from "@/components/error-boundary"

export const viewport = {
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  title: "Polaris | Confidential Lending",
  description: "Polaris Protocol: Next-generation confidential lending on Sepolia powered by Fhenix FHE.",
  keywords: "Sepolia, Fhenix, FHE, Confidential Lending, Privacy, DeFi",
  authors: [{ name: "Polaris Team" }],
  creator: "Polaris",
  publisher: "Polaris",
  robots: "index, follow",
  icons: {
    icon: "/logo-image.png",
    apple: "/logo-image.png",
  },
}


export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`font-mono ${GeistSans.variable} ${GeistMono.variable} antialiased min-h-dvh bg-background`}>
        <Suspense fallback={<div>Loading...</div>}>
          <Providers>
            <ErrorBoundary>
              <div className="mx-auto w-full flex flex-col min-h-screen px-4 md:px-8 lg:px-12">
                <AppHeader />
                <main className="pb-24 flex-grow">{children}</main>
                <AppFooter />
              </div>
            </ErrorBoundary>
          </Providers>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
