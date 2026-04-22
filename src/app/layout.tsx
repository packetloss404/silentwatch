import type { Metadata, Viewport } from 'next';
import './globals.scss';

export const metadata: Metadata = {
  title: 'SilentWatch — Defensive Situational Awareness',
  description:
    'Operator-grade defensive privacy and situational-awareness platform for lawful, consent-based environmental monitoring.',
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
