import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "House of Lotus Canada | Indian Coffee, Rooted at Origin",
  description: "Exceptional Indian grower coffees, craft cold brews and botanical elixirs for Canadian homes, cafés, retailers and hospitality partners.",
  metadataBase: new URL("https://houseoflotus.ca"),
  openGraph: { title: "House of Lotus Canada", description: "Remarkable Indian coffee. Rooted at origin.", images: ["/assets/hol-canada-launch.webp"] },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={cn("font-sans", geist.variable)}><body>{children}</body></html>;
}
