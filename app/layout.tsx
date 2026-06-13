import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Toaster from '@/components/Toaster';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: {
    default: "recrutefreelance.com — Les meilleurs freelances d'Afrique francophone",
    template: '%s — recrutefreelance.com',
  },
  description:
    "La marketplace qui connecte les entreprises européennes aux freelances d'Afrique francophone, payés directement sur Mobile Money.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={montserrat.className}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <Suspense fallback={null}>
          <Toaster />
        </Suspense>
      </body>
    </html>
  );
}
