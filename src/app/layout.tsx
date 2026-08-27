import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoodmeetsboy.xyz';
const description =
  '4,444 Boys. One Hood. Real Financial Utility. Genesis mint on Robinhood Chain — join the waitlist and claim your Hood Pass.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'HoodMeetsBoy — 4,444 Boys. One Hood. Real Financial Utility.',
    template: '%s · HoodMeetsBoy',
  },
  description,
  applicationName: 'HoodMeetsBoy',
  keywords: ['HoodMeetsBoy', 'NFT', 'Robinhood Chain', 'ERC-6551', 'NFTFi', 'Hood Pass'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'HoodMeetsBoy',
    title: 'HoodMeetsBoy — 4,444 Boys. One Hood. Real Financial Utility.',
    description,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'HoodMeetsBoy' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HoodMeetsBoy — 4,444 Boys. One Hood. Real Financial Utility.',
    description,
    images: ['/og.png'],
  },
  appleWebApp: { capable: true, title: 'HoodMeetsBoy', statusBarStyle: 'black-translucent' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0b0d11',
  colorScheme: 'dark',
  // The app design pads itself with env(safe-area-inset-*), which only reports
  // real values once the page is allowed under the notch.
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Loaded exactly as the designs declare them, so type renders identically. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Outfit:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
