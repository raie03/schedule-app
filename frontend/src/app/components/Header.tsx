import Link from "next/link";

// components/Header.tsx
export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="font-bold text-xl text-blue-600 dark:text-blue-400"
        >
          Schedule App
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link
                href="/"
                className="hover:text-blue-600 dark:hover:text-blue-400"
              >
                ホーム
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
