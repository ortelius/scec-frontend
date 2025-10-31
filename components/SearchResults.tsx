'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import FilterSidebar from '@/components/FilterSidebar'
import { graphqlQuery, GET_AFFECTED_RELEASES } from '@/lib/graphql'
import { GetAffectedReleasesResponse, ImageData } from '@/lib/types'
import { transformAffectedReleasesToImageData } from '@/lib/dataTransform'

interface SearchResultsProps {
  query: string
}

export default function SearchResults({ query }: SearchResultsProps) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [filters, setFilters] = useState({
    vulnerabilityScore: [] as string[],
    openssfScore: [] as string[],
    name: '',
  })
  const [results, setResults] = useState<ImageData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)

  const categories = [
    { id: 'image', label: 'Synced Endpoints (Where It\'s Running) ' },
    { id: 'all', label: 'Project Releases (Where to Fix It)' },
    { id: 'plugin', label: 'Vulnerabilities (The Threat)' },
  ]

  // Fetch data from GraphQL endpoint
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch affected releases with MEDIUM severity or higher
        // This will give us releases with vulnerabilities
        const response = await graphqlQuery<GetAffectedReleasesResponse>(
          GET_AFFECTED_RELEASES,
          {
            severity: 'NONE',
            limit: 1000,
          }
        )

        // Transform the data to ImageData format
        const imageData = transformAffectedReleasesToImageData(response.affectedReleases)
        setResults(imageData)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Reset to page 1 when filters or query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [query, filters])

  // Filter results based on search query and filters
  const filteredResults = results.filter(result => {
    // Search query filter
    if (query && !result.name.toLowerCase().includes(query.toLowerCase()) &&
        !result.description.toLowerCase().includes(query.toLowerCase())) {
      return false
    }

    // Name filter
    if (filters.name && !result.name.toLowerCase().includes(filters.name.toLowerCase())) {
      return false
    }

    // Vulnerability Score filters
    if (filters.vulnerabilityScore.length > 0) {
      const hasNoVulnerabilities = result.vulnerabilities.critical === 0 && 
                                   result.vulnerabilities.high === 0 && 
                                   result.vulnerabilities.medium === 0 && 
                                   result.vulnerabilities.low === 0

      const matchesFilter = filters.vulnerabilityScore.some(filter => {
        if (filter === 'clean') return hasNoVulnerabilities
        if (filter === 'critical') return result.vulnerabilities.critical > 0
        if (filter === 'high') return result.vulnerabilities.high > 0
        if (filter === 'medium') return result.vulnerabilities.medium > 0
        if (filter === 'low') return result.vulnerabilities.low > 0
        return false
      })

      if (!matchesFilter) return false
    }

    // OpenSSF Score filters
    if (filters.openssfScore.length > 0) {
      const matchesFilter = filters.openssfScore.some(filter => {
        if (filter === 'high') return result.openssfScore >= 8.0
        if (filter === 'medium') return result.openssfScore >= 6.0 && result.openssfScore < 8.0
        if (filter === 'low') return result.openssfScore < 6.0
        return false
      })

      if (!matchesFilter) return false
    }

    return true
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedResults = filteredResults.slice(startIndex, endIndex)

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 7

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  const handleCardClick = (imageName: string, version: string) => {
    router.push(`/image/${imageName}?version=${encodeURIComponent(version)}`)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <>
        <div className="border-b border-gray-200 bg-white">
          <div className="px-6 py-4">
            <div className="flex items-center gap-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="flex gap-6">
            <FilterSidebar filters={filters} setFilters={setFilters} />
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading releases...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <div className="border-b border-gray-200 bg-white">
          <div className="px-6 py-4">
            <div className="flex items-center gap-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="flex gap-6">
            <FilterSidebar filters={filters} setFilters={setFilters} />
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading data</h3>
                <p className="mt-1 text-sm text-gray-500">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="border-b border-gray-200 bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center gap-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="flex gap-6">
          <FilterSidebar filters={filters} setFilters={setFilters} />

          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {query ? `Search results for "${query}"` : 'Project Releases'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredResults.length.toLocaleString()} results
                  {filteredResults.length > itemsPerPage && (
                    <span className="text-gray-400"> • Showing {startIndex + 1}-{Math.min(endIndex, filteredResults.length)}</span>
                  )}
                </p>
              </div>
              
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <label htmlFor="itemsPerPage" className="text-sm text-gray-600">
                  Per page:
                </label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                  <option value={96}>96</option>
                </select>
              </div>
            </div>

            {filteredResults.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No releases found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedResults.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => handleCardClick(result.name, result.version)}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer bg-white flex flex-col h-full"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-blue-600 hover:underline break-words">
                              {result.name}
                            </h3>
                            <span className="text-sm text-gray-500 font-normal">{result.version}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 mb-2">
                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-medium text-gray-700">Vulnerability Score:</span>
                        {result.vulnerabilities.critical === 0 && 
                         result.vulnerabilities.high === 0 && 
                         result.vulnerabilities.medium === 0 && 
                         result.vulnerabilities.low === 0 ? (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 rounded text-xs">
                            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="font-semibold text-green-800">Clean</span>
                          </div>
                        ) : (
                          <>
                            {result.vulnerabilities.critical > 0 && (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-red-100 rounded text-xs">
                                <div className="w-2 h-2 rounded-full bg-red-600"></div>
                                <span className="font-semibold text-red-800">{result.vulnerabilities.critical} C</span>
                              </div>
                            )}
                            {result.vulnerabilities.high > 0 && (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 rounded text-xs">
                                <div className="w-2 h-2 rounded-full bg-orange-600"></div>
                                <span className="font-semibold text-orange-800">{result.vulnerabilities.high} H</span>
                              </div>
                            )}
                            {result.vulnerabilities.medium > 0 && (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 rounded text-xs">
                                <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                                <span className="font-semibold text-yellow-800">{result.vulnerabilities.medium} M</span>
                              </div>
                            )}
                            {result.vulnerabilities.low > 0 && (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 rounded text-xs">
                                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                <span className="font-semibold text-blue-800">{result.vulnerabilities.low} L</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-600 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <span className="font-medium">{result.dependency_count} deps</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">OpenSSF:</span>
                          <span className={`font-bold ${
                            result.openssfScore >= 8 ? 'text-green-600' :
                            result.openssfScore >= 6 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {result.openssfScore.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mt-2">
                        Updated {result.updated}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-4">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page as number)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
