import { HEADER_NAV_ITEMS } from "@/config/frontend";
import Link from "next/link";

const HeaderNav = () => (
  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700">
    <nav>
      <ul className="flex gap-4 list-none m-0 p-0 block">
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
    <div className="flex items-center px-4 border-l border-gray-200 dark:border-gray-700 dark:bg-blue-950 bg-blue-200 dark:text-white text-blue-950">
      <span className="text-sm font-bold mr-8">
        Local backup, drafts &amp; scheduling for Bluesky.
      </span>
      <h1 className="text-2xl font-bold">BskyBackup</h1>
    </div>
  </div>
);

export default HeaderNav;
