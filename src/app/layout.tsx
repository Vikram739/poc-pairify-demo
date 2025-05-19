import type {Metadata} from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import './globals.css';
import 'prismjs/themes/prism-okaidia.css'; // Import PrismJS theme for syntax highlighting
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CodeAssist',
  description: 'AI-Powered Code Editor by Firebase Studio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${robotoMono.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
