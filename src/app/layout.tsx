import type { Metadata, Viewport } from 'next';
import './globals.scss';

export const metadata: Metadata = {
  title: 'SilentWatch — Property & Perimeter Security',
  description:
    'Site and perimeter security: camera coverage, movement and people counts, vehicle cataloging, and optional Wi-Fi/Bluetooth awareness at the property line.',
  applicationName: 'SilentWatch',
};

export const viewport: Viewport = {
  themeColor: '#07090c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
