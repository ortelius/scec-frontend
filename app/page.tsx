'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import SearchResults from '@/components/SearchResults'

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = () => {
    // Search functionality handled by SearchResults component
  }

  return (
    <div className="min-h-screen bg-white">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />
      <SearchResults query={searchQuery} />
    </div>
  )
}
