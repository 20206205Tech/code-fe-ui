import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/lib/auth-context';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster as SonnerToaster } from '../components/ui/sonner';
import { Toaster } from '../components/ui/toaster';
import { SettingsProvider } from '../lib/settings-context';
import './globals.css';

const _geist = Geist({ subsets: ['latin'] });
const _geistMono = Geist_Mono({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tư vấn Pháp luật AI',
  description: 'Ứng dụng tư vấn pháp luật bằng AI',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
      try {
        const raw = localStorage.getItem('user_settings');
        const settings = raw ? JSON.parse(raw) : { theme: 'system' };
        const theme = settings.theme || 'system';
        
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');
        
        if (isDark) document.documentElement.classList.add('dark');
      } catch (e) {}
    `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SettingsProvider>
            <AuthProvider>
              {children}
              <Toaster />
              <SonnerToaster richColors position="top-right" />
            </AuthProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
