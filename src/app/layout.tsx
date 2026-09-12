import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { EditProvider } from "@/contexts/EditContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CartProvider } from "@/contexts/CartContext";
import { ModalProvider } from "@/contexts/ModalContext";
import { ToastProvider } from "@/components/Toast";
import { EditToolbar } from "@/components/editable/EditToolbar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConsentProvider } from "@/contexts/ConsentContext";
import { CookieBanner } from "@/components/consent/CookieBanner";
import "./globals.css";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Merakí — Beauty With Soul",
  description:
    "Book beauty treatments and Pilates classes, shop products, and take online courses — all from one Merakí account.",
  keywords: ["beauty", "booking", "salon", "wellness", "appointments", "shop"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-inter)]">
        {/* WCAG 2.4.1 — first tab stop on every page jumps past the navigation. */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ErrorBoundary name="root">
          <AuthProvider>
            <EditProvider>
              <ThemeProvider>
                <CartProvider>
                  <ConsentProvider>
                    <ErrorBoundary name="app">{children}</ErrorBoundary>
                    {/* Owner-only floating visual editor toolbar. Wrapped in its
                        own Toast/Modal providers so the customization drawer
                        works on public pages too (dashboard routes nest their
                        own providers, which take precedence there). */}
                    <ToastProvider>
                      <ModalProvider>
                        <EditToolbar />
                      </ModalProvider>
                    </ToastProvider>
                    <CookieBanner />
                  </ConsentProvider>
                </CartProvider>
              </ThemeProvider>
            </EditProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
