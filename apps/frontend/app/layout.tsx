import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit, Geist } from "next/font/google";

import { SiteCookieConsent } from "@/components/site-cookie-consent";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getServices } from "@/lib/content";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sandnessoneterapi.no"),
  title: {
    default: "Sandnes Soneterapi – Soneterapi, øreakupunktur og tankefeltterapi i Sandnes",
    template: "%s | Sandnes Soneterapi",
  },
  description:
    "Soneterapeut Terje Horpestad – 40 års erfaring. Soneterapi, øreakupunktur og tankefeltterapi i Sandnes. Godkjent av NNH.",
  keywords: [
    "soneterapi",
    "Sandnes",
    "øreakupunktur",
    "tankefeltterapi",
    "naturterapi",
    "Terje Horpestad",
    "NNH",
  ],
  openGraph: {
    type: "website",
    locale: "nb_NO",
    siteName: "Sandnes Soneterapi",
    title: "Sandnes Soneterapi – Naturlig helse gjennom berøring",
    description:
      "Godkjent soneterapeut i Sandnes med over 40 års erfaring. Soneterapi, øreakupunktur og tankefeltterapi.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const services = await getServices();
  const serviceNavItems = services.map(({ title, slug }) => ({ title, slug }));

  return (
    <html lang="nb-NO" className={cn(cormorant.variable, outfit.variable, "font-sans", geist.variable)} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col antialiased" suppressHydrationWarning>
        <SiteCookieConsent>
          <SiteHeader services={serviceNavItems} />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </SiteCookieConsent>
      </body>
    </html>
  );
}
