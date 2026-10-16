import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/fraunces';
import './globals.css';

import { AppProvider } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'Ayomi Tracker — know your cycle',
    template: '%s · Ayomi Tracker',
  },
  description:
    'A warm cycle and hormone-phase tracker that predicts your period, flags irregularities gently, and explains what to expect in every phase.',
};

export const viewport: Viewport = {
  themeColor: '#F8F0E3',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
