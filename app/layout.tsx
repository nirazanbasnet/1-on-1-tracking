import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { NavigationProgress } from '@/components/providers/navigation-progress';
import { LinkInterceptor } from '@/components/providers/link-interceptor';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: '1-on-1 Tracking - Engineering Growth Platform',
  description: 'Internal tool for tracking monthly engineering 1-on-1s and growth',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={plusJakartaSans.className} suppressHydrationWarning>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <LinkInterceptor />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
