'use client'
import { HEADER_NAV_ITEMS } from '@/config/frontend'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/forms'
import { clsx } from 'clsx'

const styles = {
  navBar:
    'relative flex flex-row items-stretch justify-between border-b border-gray-200 dark:border-gray-700',
  logoContainer:
    'flex items-center p-4 border-l border-gray-200 bg-blue-200 text-blue-950 dark:border-gray-700 dark:bg-blue-950 dark:text-white',
  logoText: 'text-2xl font-bold',
  navMenu:
    'absolute top-full right-0 lg:relative lg:top-auto lg:right-auto lg:block',
  navList:
    'list-none h-full border-gray-200 border-1 flex flex-col px-10 py-5 bg-[var(--background)] dark:border-gray-800 lg:border-0 lg:items-center lg:flex-row lg:gap-4 lg:m-0 lg:p-0',
  navItem: 'p-4 lg:inline-block',
  navLink:
    'p-4 rounded text-gray-700 hover:text-blue-600 active:text-blue-900 active:bg-blue-500 transition-colors dark:text-gray-200 dark:hover:text-blue-400 dark:active:text-blue-200',
  hamburgerButton: 'flex items-center px-4 lg:hidden',
}

const HeaderNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className={styles.navBar}>
      <div className={styles.logoContainer}>
        <div className={styles.logoText}>BskyBackup</div>
      </div>

      {/* Nav: hidden on lg and below unless menu is open */}
      <nav className={clsx([isMenuOpen ? 'block' : 'hidden', styles.navMenu])}>
        <ul className={styles.navList}>
          {HEADER_NAV_ITEMS.map((item) => (
            <li key={item.href} className={styles.navItem}>
              <Link href={item.href} className={styles.navLink}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {/* Hamburger button for mobile */}
      <Button
        className={styles.hamburgerButton}
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
