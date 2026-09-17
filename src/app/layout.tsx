import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { JourneyProvider } from '@/context/JourneyContext';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FinJourney AI — AI Financial Journey Copilot',
  description:
    'AI-powered health insurance claim journey copilot. Navigate your claim process with intelligent guidance, document verification, and real-time tracking.',
  keywords: ['insurance', 'claim', 'AI', 'fintech', 'health insurance', 'Paytm'],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex antialiased">
        <AuthProvider>
          <JourneyProvider>
            {/* Sidebar — fixed left */}
            <Sidebar />

            {/* Main content area — offset by sidebar width */}
            <div className="flex-1 ml-64 flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
          </JourneyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
