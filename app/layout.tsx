import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import { TopNavExtrasProvider } from "@/context/TopNavExtrasContext";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-syne",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "SahulatPay Admin",
  description: "SahulatPay Administration Panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(syne.variable, dmSans.variable)}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <ReactQueryProvider>
            <TopNavExtrasProvider>
              {children}
            </TopNavExtrasProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
