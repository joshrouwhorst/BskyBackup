import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import HeaderNav from '@/components/HeaderNav'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'BskyBackup',
  description: 'A simple app to backup and manage your Bluesky posts locally.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <HeaderNav />
        <div className="container mx-auto px-4 py-6">
          {/* Main content area */}
          {children}
        </div>
      </body>
    </html>
  )
}
