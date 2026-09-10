import { DM_Sans } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from 'next-themes'
import ScrollToTop from '@/components/ScrollToTop'
import Aoscompo from '@/utils/aos'
import TawkChat from '@/components/TawkChat'
import { Metadata } from 'next'

const font = DM_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Wertchain | Institutional Fixed-Yield Investment Platform',
    template: '%s | Wertchain',
  },
  description:
    'Wertchain delivers predictable fixed-yield returns through an immutable Master Ledger with double-entry accounting. Capital and profits cryptographically tracked and fully auditable.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={font.className}>
        <ThemeProvider attribute="class" enableSystem={true} defaultTheme="dark">
          <Aoscompo>
            {children}
          </Aoscompo>
          <ScrollToTop />
          <TawkChat />
        </ThemeProvider>
      </body>
    </html>
  )
}
