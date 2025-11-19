'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

import FilterSidebar from '@/components/FilterSidebar'
import {
  graphqlQuery,
  GET_AFFECTED_RELEASES,
  GET_SYNCED_ENDPOINTS,
  GET_VULNERABILITIES,
} from '@/lib/graphql'
import {
  GetAffectedReleasesResponse,
  GetSyncedEndpointsResponse,
  GetVulnerabilitiesResponse,
  ImageData,
  SyncedEndpoint,
  Mitigation,
} from '@/lib/types'
import { transformAffectedReleasesToImageData, getRelativeTime } from '@/lib/dataTransform'

interface SearchResultsProps {
  query: string
}

// Mock data for Mitigations
const mockMitigations: Mitigation[] = [
  {
    cve_id: 'GHSA-f82v-jwr5-mffw',
    summary: 'Authorization Bypass in Next.js Middleware',
    severity_score: 9.1,
    severity_rating: 'CRITICAL',
    package: 'pkg:npm/next',
    affected_version: '14.2.5',
    full_purl: 'pkg:npm/next@14.2.5',
    fixed_in: ['14.2.25'],
    affected_releases: 12,
    affected_endpoints: 45,
  },
  {
    cve_id: 'GHSA-gp8f-8m3g-qvj9',
    summary: 'Next.js Cache Poisoning',
    severity_score: 8.7,
    severity_rating: 'HIGH',
    package: 'pkg:npm/next',
    affected_version: '14.2.5',
    full_purl: 'pkg:npm/next@14.2.5',
    fixed_in: ['14.2.10'],
    affected_releases: 8,
    affected_endpoints: 32,
  },
  {
    cve_id: 'GHSA-7gfc-8cq8-jh5f',
    summary: 'Next.js authorization bypass vulnerability',
    severity_score: 7.5,
    severity_rating: 'HIGH',
    package: 'pkg:npm/next',
    affected_version: '14.2.5',
    full_purl: 'pkg:npm/next@14.2.5',
    fixed_in: ['14.2.15'],
    affected_releases: 15,
    affected_endpoints: 58,
  },
]

export default function SearchResults({ query }: SearchResultsProps) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [filters, setFilters] = useState({
    vulnerabilityScore: [] as string[],
    openssfScore: [] as string[],
    name: '',
    status: [] as string[],
    environment: [] as string[],
    endpointType: [] as string[],
  })

  // Data states
  const [results, setResults] = useState<ImageData[]>([])
  const [endpointResults, setEndpointResults] = useState<SyncedEndpoint[]>([])
  const [vulnerabilityResults, setVulnerabilityResults] = useState<Mitigation[]>([])
  const [mockMitigationList, setMockMitigationList] = useState<Mitigation[]>([])

  // Loading and Error states - separate per category
  const [loadingStates, setLoadingStates] = useState({
    all: false,
    image: false,
    plugin: false,
    mitigations: false
  })
  const [errorStates, setErrorStates] = useState({
    all: null as string | null,
    image: null as string | null,
    plugin: null as string | null,
    mitigations: null as string | null
  })
  
  // Track which data has been fetched
  const [fetchedData, setFetchedData] = useState({
    all: false,
    image: false,
    plugin: false,
    mitigations: false
  })

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)

  // Mitigations List View states
  const [selectedMitigations, setSelectedMitigations] = useState<Set<string>>(new Set())
  const [showActionMenu, setShowActionMenu] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const categories = [
    { id: 'image', label: "Synced Endpoints (Where It's Running)" },
    { id: 'all', label: 'Project Releases (Where to Fix It)' },
    { id: 'mitigations', label: 'Mitigations (How to Fix It)' },
    { id: 'plugin', label: 'Vulnerabilities (The Threat)' },
  ]

  // Fetch data when tab is selected (on-demand)
  useEffect(() => {
    const fetchDataForCategory = async () => {
      // Skip if already fetched or currently loading
      if (fetchedData[selectedCategory as keyof typeof fetchedData] || 
          loadingStates[selectedCategory as keyof typeof loadingStates]) {
        return
      }

      try {
        setLoadingStates(prev => ({ ...prev, [selectedCategory]: true }))
        setErrorStates(prev => ({ ...prev, [selectedCategory]: null }))

        switch (selectedCategory) {
          case 'all':
            // Fetch Project Releases
            const releasesResponse = await graphqlQuery<GetAffectedReleasesResponse>(
              GET_AFFECTED_RELEASES,
              { severity: 'NONE', limit: 1000 }
            )
            const imageData = transformAffectedReleasesToImageData(releasesResponse.affectedReleases)
            setResults(imageData)
            break

          case 'image':
            // Fetch Synced Endpoints
            const endpointsResponse = await graphqlQuery<GetSyncedEndpointsResponse>(
              GET_SYNCED_ENDPOINTS,
              { limit: 1000 }
            )
            setEndpointResults(endpointsResponse.syncedEndpoints)
            break

          case 'plugin':
            // Fetch Vulnerabilities
            const vulnerabilitiesResponse = await graphqlQuery<GetVulnerabilitiesResponse>(
              GET_VULNERABILITIES, 
              { limit: 1000 }
            )
            setVulnerabilityResults(vulnerabilitiesResponse.vulnerabilities)
            break

          case 'mitigations':
            // Use mock data for mitigations (no GraphQL call needed)
            setMockMitigationList(mockMitigations)
            break
        }

        setFetchedData(prev => ({ ...prev, [selectedCategory]: true }))
      } catch (err) {
        console.error(`Error fetching ${selectedCategory} data:`, err)
        setErrorStates(prev => ({ 
          ...prev, 
          [selectedCategory]: err instanceof Error ? err.message : 'Failed to fetch data'
        }))
      } finally {
        setLoadingStates(prev => ({ ...prev, [selectedCategory]: false }))
      }
    }

    fetchDataForCategory()
  }, [selectedCategory]) // Run when selectedCategory changes

  useEffect(() => {
    setCurrentPage(1)
    setSelectedMitigations(new Set())
    setShowActionMenu(false)
  }, [query, filters, selectedCategory])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowActionMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const toggleMitigation = (cveId: string) => {
    const newSelected = new Set(selectedMitigations)
    if (newSelected.has(cveId)) {
      newSelected.delete(cveId)
    } else {
      newSelected.add(cveId)
    }
    setSelectedMitigations(newSelected)
  }

  const toggleAll = () => {
    const allFilteredMitigations = getFilteredData() as Mitigation[]
    if (selectedMitigations.size === allFilteredMitigations.length) {
      setSelectedMitigations(new Set())
    } else {
      setSelectedMitigations(new Set(allFilteredMitigations.map(m => m.cve_id)))
    }
  }

  const handleAction = (action: string) => {
    setShowActionMenu(false)
    alert(`Successfully created ${selectedMitigations.size} ${action}(s)`)
  }

  const handleTakeAction = () => {
    if (selectedMitigations.size > 0) {
      setShowActionMenu(!showActionMenu)
    }
  }

  const getFilteredData = () => {
    const queryLower = query.toLowerCase()
    const nameLower = filters.name.toLowerCase()

    // Synced Endpoints
    if (selectedCategory === 'image') {
      return endpointResults.filter(endpoint => {
        if (
          query &&
          !endpoint.endpoint_name.toLowerCase().includes(queryLower) &&
          !endpoint.endpoint_url.toLowerCase().includes(queryLower)
        )
          return false
        if (filters.name && !endpoint.endpoint_name.toLowerCase().includes(nameLower)) return false
        if (filters.status && filters.status.length > 0) {
          if (!filters.status.some(s => endpoint.status.toLowerCase() === s.toLowerCase())) return false
        }
        if (filters.environment && filters.environment.length > 0) {
          if (!filters.environment.some(e => endpoint.environment.toLowerCase() === e.toLowerCase())) return false
        }
        if (filters.endpointType && filters.endpointType.length > 0) {
          if (!filters.endpointType.some(t => endpoint.endpoint_type.toLowerCase() === t.toLowerCase())) return false
        }
        if (filters.vulnerabilityScore.length > 0) {
          const hasNoVulnerabilities =
            endpoint.total_vulnerabilities.critical === 0 &&
            endpoint.total_vulnerabilities.high === 0 &&
            endpoint.total_vulnerabilities.medium === 0 &&
            endpoint.total_vulnerabilities.low === 0
          const matchesFilter = filters.vulnerabilityScore.some(filter => {
            if (filter === 'clean') return hasNoVulnerabilities
            if (filter === 'critical') return endpoint.total_vulnerabilities.critical > 0
            if (filter === 'high') return endpoint.total_vulnerabilities.high > 0
            if (filter === 'medium') return endpoint.total_vulnerabilities.medium > 0
            if (filter === 'low') return endpoint.total_vulnerabilities.low > 0
            return false
          })
          if (!matchesFilter) return false
        }
        return true
      })
    }

    // Vulnerabilities
    if (selectedCategory === 'plugin') {
      return vulnerabilityResults.filter(vuln => {
        if (
          query &&
          !vuln.cve_id.toLowerCase().includes(queryLower) &&
          !vuln.summary.toLowerCase().includes(queryLower) &&
          !vuln.package.toLowerCase().includes(queryLower)
        )
          return false
        if (
          filters.name &&
          !vuln.cve_id.toLowerCase().includes(nameLower) &&
          !vuln.summary.toLowerCase().includes(nameLower) &&
          !vuln.package.toLowerCase().includes(nameLower)
        )
          return false
        if (filters.vulnerabilityScore.length > 0) {
          if (filters.vulnerabilityScore.includes('clean') && filters.vulnerabilityScore.length === 1) return false
          const severities = filters.vulnerabilityScore.filter(f => f !== 'clean')
          if (severities.length > 0) {
            if (!severities.some(f => vuln.severity_rating.toLowerCase() === f.toLowerCase())) return false
          }
        }
        return true
      })
    }

    // Mitigations
    if (selectedCategory === 'mitigations') {
      return mockMitigationList.filter(mit => {
        if (
          query &&
          !mit.cve_id.toLowerCase().includes(queryLower) &&
          !mit.summary.toLowerCase().includes(queryLower) &&
          !mit.package.toLowerCase().includes(queryLower)
        )
          return false
        if (
          filters.name &&
          !mit.cve_id.toLowerCase().includes(nameLower) &&
          !mit.summary.toLowerCase().includes(nameLower) &&
          !mit.package.toLowerCase().includes(nameLower)
        )
          return false
        if (filters.vulnerabilityScore.length > 0) {
          if (filters.vulnerabilityScore.includes('clean')) return false
          if (!filters.vulnerabilityScore.some(f => mit.severity_rating.toLowerCase() === f.toLowerCase()))
            return false
        }
        return true
      })
    }

    // Project Releases (default)
    return results.filter(result => {
      if (query && !result.name.toLowerCase().includes(queryLower) && !result.description.toLowerCase().includes(queryLower))
        return false
      if (filters.name && !result.name.toLowerCase().includes(nameLower)) return false
      if (filters.vulnerabilityScore.length > 0) {
        const hasNoVulnerabilities =
          result.vulnerabilities.critical === 0 &&
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
  }

  const filteredData = getFilteredData()
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = filteredData.slice(startIndex, endIndex)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 7
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  const handleCardClick = (item: any) => {
    if (selectedCategory === 'image') {
      const endpoint = item as SyncedEndpoint
      router.push(`/endpoint/${endpoint.endpoint_name}`)
    } else if (selectedCategory === 'all') {
      const release = item as ImageData
      router.push(`/release/${release.name}?version=${encodeURIComponent(release.version)}`)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getSeverityColor = (rating: string) => {
    switch (rating.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryTitle = () => {
    if (selectedCategory === 'image') return 'Synced Endpoints'
    if (selectedCategory === 'all') return 'Project Releases'
    if (selectedCategory === 'plugin') return 'Vulnerabilities'
    if (selectedCategory === 'mitigations') return 'Mitigations'
    return 'Results'
  }

  // Get loading and error states for current category
  const loading = loadingStates[selectedCategory as keyof typeof loadingStates]
  const error = errorStates[selectedCategory as keyof typeof errorStates]

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
            <FilterSidebar filters={filters} setFilters={setFilters} selectedCategory={selectedCategory} />
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading {getCategoryTitle().toLowerCase()}...</p>
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
            <FilterSidebar filters={filters} setFilters={setFilters} selectedCategory={selectedCategory} />
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading data</h3>
                <p className="mt-1 text-sm text-gray-500">{error}</p>
                <button
                  onClick={() => {
                    setFetchedData(prev => ({ ...prev, [selectedCategory]: false }))
                    setSelectedCategory(selectedCategory) // Trigger re-fetch
                  }}
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

  // Rest of the component remains the same (rendering logic)
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
          <FilterSidebar filters={filters} setFilters={setFilters} selectedCategory={selectedCategory} />

          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {query ? `Search results for "${query}"` : getCategoryTitle()}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredData.length.toLocaleString()} results
                  {filteredData.length > itemsPerPage && selectedCategory !== 'mitigations' && (
                    <span className="text-gray-400"> • Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)}</span>
                  )}
                </p>
              </div>

              {selectedCategory !== 'mitigations' && (
                <div className="flex items-center gap-2">
                  <label htmlFor="itemsPerPage" className="text-sm text-gray-600">
                    Per page:
                  </label>
                  <select
                    id="itemsPerPage"
                    value={itemsPerPage}
                    onChange={e => {
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
              )}
            </div>

            {/* Mitigations Action Header */}
            {selectedCategory === 'mitigations' && (
              <div className="mb-4 bg-white border border-gray-200 rounded-lg">
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMitigations.size === filteredData.length && filteredData.length > 0}
                        onChange={toggleAll}
                        disabled={filteredData.length === 0}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Select all ({filteredData.length})
                      </span>
                    </label>
                    {selectedMitigations.size > 0 && (
                      <span className="text-sm text-gray-600">
                        {selectedMitigations.size} selected
                      </span>
                    )}
                  </div>

                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={handleTakeAction}
                      disabled={selectedMitigations.size === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Take Action
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showActionMenu && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10">
                        <button
                          onClick={() => handleAction('AI Auto-remediation')}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          <svg className="w-5 h-5 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          <span className="font-medium text-gray-900">AI Auto-remediation</span>
                        </button>
                        <button
                          onClick={() => handleAction('Jira Issue')}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.001 1.001 0 0 0 23.013 0Z"/></svg>
                          <span className="font-medium text-gray-900">Create Jira Issue</span>
                        </button>
                        <button
                          onClick={() => handleAction('GitHub Issue')}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                          <span className="font-medium text-gray-900">Create GitHub Issue</span>
                        </button>
                        <button
                          onClick={() => handleAction('GitLab Issue')}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          <svg className="w-5 h-5 text-orange-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M23.546 10.93L13.067.452a1.55 1.55 0 0 0-2.188 0L8.708 2.627l2.76 2.76a1.838 1.838 0 0 1 2.325 2.341l2.658 2.66a1.838 1.838 0 0 1 1.924 3.035 1.838 1.838 0 0 1-2.6 0 1.838 1.838 0 0 1-.398-1.993l-2.477-2.477v6.51a1.838 1.838 0 0 1 .49 3.007 1.838 1.838 0 0 1-2.6 0 1.838 1.838 0 0 1 .49-3.007V9.025a1.838 1.838 0 0 1-.996-2.408L7.76 3.965.452 11.27a1.55 1.55 0 0 0 0 2.188l10.48 10.479a1.55 1.55 0 0 0 2.188 0l10.426-10.426a1.55 1.55 0 0 0 0-2.188"/></svg>
                          <span className="font-medium text-gray-900">Create GitLab Issue</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Results Grid/List - keeping just the structure, full implementation remains the same */}
            {filteredData.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Card rendering logic remains exactly the same as original */}
                  {selectedCategory === 'image' &&
                    (paginatedData as SyncedEndpoint[]).map((endpoint, index) => (
                      <div
                        key={index}
                        onClick={() => handleCardClick(endpoint)}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer bg-white flex flex-col h-full"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex flex-col flex-1">
                            <h3 className="text-base font-semibold text-blue-600 hover:underline break-words">
                              {endpoint.endpoint_name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">{endpoint.endpoint_url}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          <span className="text-xs font-medium text-gray-700">Vulnerabilities:</span>
                          {endpoint.total_vulnerabilities.critical === 0 &&
                          endpoint.total_vulnerabilities.high === 0 &&
                          endpoint.total_vulnerabilities.medium === 0 &&
                          endpoint.total_vulnerabilities.low === 0 ? (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 rounded text-xs">
                              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                              <span className="font-semibold text-green-800">Clean</span>
                            </div>
                          ) : (
                            <>
                              {endpoint.total_vulnerabilities.critical > 0 && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-red-100 rounded text-xs"><div className="w-2 h-2 rounded-full bg-red-600"></div><span className="font-semibold text-red-800">{endpoint.total_vulnerabilities.critical} C</span></div>
                              )}
                              {endpoint.total_vulnerabilities.high > 0 && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 rounded text-xs"><div className="w-2 h-2 rounded-full bg-orange-600"></div><span className="font-semibold text-orange-800">{endpoint.total_vulnerabilities.high} H</span></div>
                              )}
                              {endpoint.total_vulnerabilities.medium > 0 && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 rounded text-xs"><div className="w-2 h-2 rounded-full bg-yellow-600"></div><span className="font-semibold text-yellow-800">{endpoint.total_vulnerabilities.medium} M</span></div>
                              )}
                              {endpoint.total_vulnerabilities.low > 0 && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 rounded text-xs"><div className="w-2 h-2 rounded-full bg-blue-600"></div><span className="font-semibold text-blue-800">{endpoint.total_vulnerabilities.low} L</span></div>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600 pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            <span className="font-medium">{endpoint.release_count} releases</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${ endpoint.status.toLowerCase() === 'active' ? 'bg-green-100 text-green-800' : endpoint.status.toLowerCase() === 'inactive' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800' }`}>
                              {endpoint.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">Synced {getRelativeTime(endpoint.last_sync)}</div>
                      </div>
                    ))}

                  {/* Other category renderings remain exactly the same... */}
                  {selectedCategory === 'plugin' &&
                    (paginatedData as Mitigation[]).map(vuln => (
                      <div
                        key={`${vuln.cve_id}-${vuln.package}`}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-400 hover:shadow-md transition-all bg-white"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-base font-semibold text-blue-600">{vuln.cve_id}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-bold border ${getSeverityColor(vuln.severity_rating)}`}>
                            {vuln.severity_rating.toUpperCase()} {vuln.severity_score.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">{vuln.summary}</p>
                        <div className="space-y-2 text-xs text-gray-600 mb-3">
                          <div><span className="font-medium">Package:</span> <span className="break-all">{vuln.package}</span></div>
                          {vuln.fixed_in && vuln.fixed_in.length > 0 && (
                            <div><span className="font-medium">Fixed in:</span> <span className="text-green-700 font-semibold">{vuln.fixed_in.join(', ')}</span></div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            <span className="font-medium">{vuln.affected_releases} release{vuln.affected_releases !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                            <span className="font-medium">{vuln.affected_endpoints} endpoint{vuln.affected_endpoints !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                  {selectedCategory === 'mitigations' &&
                    (paginatedData as Mitigation[]).map(mit => (
                      <div
                        key={`${mit.cve_id}-${mit.package}`}
                        onClick={() => toggleMitigation(mit.cve_id)}
                        className={`border rounded-lg p-4 transition-all bg-white cursor-pointer
                          ${selectedMitigations.has(mit.cve_id) 
                            ? 'bg-blue-50 border-blue-400 shadow-md' 
                            : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedMitigations.has(mit.cve_id)}
                              onChange={(e) => {
                                e.stopPropagation() 
                                toggleMitigation(mit.cve_id)
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <h3 className="text-base font-semibold text-blue-600">{mit.cve_id}</h3>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-bold border ${getSeverityColor(mit.severity_rating)}`}>
                            {mit.severity_rating.toUpperCase()} {mit.severity_score.toFixed(1)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">{mit.summary}</p>
                        <div className="space-y-2 text-xs text-gray-600 mb-3">
                          <div><span className="font-medium">Package:</span> <span className="break-all">{mit.package}</span></div>
                          {mit.fixed_in && mit.fixed_in.length > 0 && (
                            <div><span className="font-medium">Fixed in:</span> <span className="text-green-700 font-semibold">{mit.fixed_in.join(', ')}</span></div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            <span className="font-medium">{mit.affected_releases} release{mit.affected_releases !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                            <span className="font-medium">{mit.affected_endpoints} endpoint{mit.affected_endpoints !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                  {selectedCategory === 'all' &&
                    (paginatedData as ImageData[]).map((result, index) => (
                      <div
                        key={index}
                        onClick={() => handleCardClick(result)}
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
                          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          <span className="text-xs font-medium text-gray-700">Vulnerability Score:</span>
                          {result.vulnerabilities.critical === 0 &&
                          result.vulnerabilities.high === 0 &&
                          result.vulnerabilities.medium === 0 &&
                          result.vulnerabilities.low === 0 ? (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 rounded text-xs">
                              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                              <span className="font-semibold text-green-800">Clean</span>
                            </div>
                          ) : (
                            <>
                              {result.vulnerabilities.critical > 0 && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-red-100 rounded text-xs"><div className="w-2 h-2 rounded-full bg-red-600"></div><span className="font-semibold text-red-800">{result.vulnerabilities.critical} C</span></div>
                              )}
                              {result.vulnerabilities.high > 0 && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 rounded text-xs"><div className="w-2 h-2 rounded-full bg-orange-600"></div><span className="font-semibold text-orange-800">{result.vulnerabilities.high} H</span></div>
                              )}
                              {result.vulnerabilities.medium > 0 && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 rounded text-xs"><div className="w-2 h-2 rounded-full bg-yellow-600"></div><span className="font-semibold text-yellow-800">{result.vulnerabilities.medium} M</span></div>
                              )}
                              {result.vulnerabilities.low > 0 && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 rounded text-xs"><div className="w-2 h-2 rounded-full bg-blue-600"></div><span className="font-semibold text-blue-800">{result.vulnerabilities.low} L</span></div>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600 pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            <span className="font-medium">{result.dependency_count} deps</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">OpenSSF:</span>
                              <span className={`font-bold ${ 
                                result.openssfScore != null 
                                  ? result.openssfScore >= 8 ? 'text-green-600' 
                                    : result.openssfScore >= 6 ? 'text-yellow-600' 
                                    : 'text-red-600'
                                  : 'text-gray-400'
                              }`}>
                                {result.openssfScore != null ? result.openssfScore.toFixed(1) : 'N/A'}
                              </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                            <span className="font-medium">{result.syncedEndpoints || 0} endpoint{result.syncedEndpoints !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">Updated {result.updated}</div>
                      </div>
                    ))}
                </div>

                {/* Pagination */}
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
                      {getPageNumbers().map((page, index) =>
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">...</span>
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
                      )}
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