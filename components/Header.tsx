'use client'

import Link from 'next/link'

interface HeaderProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  handleSearch: () => void
}

export default function Header({ searchQuery, setSearchQuery, handleSearch }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6">
        <div className="flex items-center h-16">
          <Link href="/" className="flex items-center gap-2 cursor-pointer mr-8">
            <svg className="w-10 h-10 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.5 2v2h2v2h2v2h2v2h2v2h-2v2h-2v-2h-2v-2h-2V8h-2V6h2V4h2V2h2zm-2 4v2h2V6h-2zm-2 4v2h2v-2h-2zm-2-4v2h2V6h-2zm-2 0v2h2V6h-2zm-2 0v2h2V6h-2zm0 4v2h2v-2h-2zm2 0v2h2v-2h-2zm2 0v2h2v-2h-2z"/>
            </svg>
          </Link>

          <nav className="flex items-center gap-6 mr-8 text-sm">
            <Link href="#" className="text-gray-700 hover:text-gray-900 font-medium">Products</Link>
            <Link href="#" className="text-gray-700 hover:text-gray-900 font-medium">Developers</Link>
            <Link href="#" className="text-gray-700 hover:text-gray-900 font-medium">Pricing</Link>
          </nav>

          <div className="flex-1 max-w-2xl mx-8">
            <input
              type="text"
              placeholder="Search Ortelius"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="text-sm text-gray-700 hover:text-gray-900 font-medium">Sign in</button>
            <button className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors">
              Sign up
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
