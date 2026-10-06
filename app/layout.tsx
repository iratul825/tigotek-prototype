import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Tigotek — Live Office",
  description:
    "Your team. Your progress. A live view of the work behind your FABRIPASS project.",
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
