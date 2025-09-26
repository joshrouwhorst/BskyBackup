import { HEADER_NAV_ITEMS } from '@/config/frontend'
import Link from 'next/link'

const HeaderNav = () => (
  <nav>
    <ul className="flex gap-4 list-none m-0 p-0 block border-b border-gray-200 dark:border-gray-700">
      {HEADER_NAV_ITEMS.map((item) => (
        <li key={item.href} className="inline-block p-4">
          <Link
            href={item.href}
            className="p-4 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  </nav>
)

export default HeaderNav
