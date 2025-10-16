'use client'
import { HEADER_NAV_ITEMS } from '@/config/frontend'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/forms'

const HeaderNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="relative flex flex-row items-stretch justify-between border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center p-4 border-l border-gray-200 dark:border-gray-700 dark:bg-blue-950 bg-blue-200 dark:text-white text-blue-950">
        <div className="text-2xl font-bold">BskyBackup</div>
      </div>

      {/* Nav: hidden on lg and below unless menu is open */}
      <nav
        className={`${
          isMenuOpen ? 'block' : 'hidden'
        } absolute top-full right-0 xl:block`}
      >
        <ul className="list-none dark:border-gray-800 border-1 flex flex-col px-10 py-5 xl:flex-row xl:gap-4 xl:m-0 xl:p-0 bg-[var(--background)]">
          {HEADER_NAV_ITEMS.map((item) => (
            <li key={item.href} className="xl:inline-block p-4">
              <Link
                href={item.href}
                className="p-4 text-gray-700 dark:text-gray-200 hover:text-blue-600 active:text-blue-900 dark:active:text-blue-200 dark:hover:text-blue-400 transition-colors"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {/* Hamburger button for mobile */}
      <Button
        className="flex xl:hidden items-center px-4"
        aria-label="Toggle navigation menu"
        color="primary"
        variant="icon"
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        <Menu className="w-6 h-6" />
      </Button>
    </div>
  )
}

export default HeaderNav
