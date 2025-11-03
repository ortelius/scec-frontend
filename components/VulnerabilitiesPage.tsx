'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { Mitigation } from '@/lib/types'
import { graphqlQuery, GET_VULNERABILITIES } from '@/lib/graphql'

interface GetVulnerabilitiesResponse {
  vulnerabilities: Mitigation[]
}

export default function VulnerabilitiesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [vulnerabilities, setVulnerabilities] = useState<Mitigation[]>([])
  const [filteredVulnerabilities, setFilteredVulnerabilities] = useState<Mitigation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [severityFilter, setSeverityFilter] = useState<string[]>([])

  const handleSearch = () => {
    router.push('/')
  }

  useEffect(() => {
    const fetchVulnerabilities = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await graphqlQuery<GetVulnerabilitiesResponse>(
          GET_VULNERABILITIES,
          { limit: 1000 }
        )

        setVulnerabilities(response.vulnerabilities)
        setFilteredVulnerabilities(response.vulnerabilities)
      } catch (err) {
        console.error('Error fetching vulnerabilities:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch vulnerabilities')
      } finally {
        setLoading(false)
      }
    }

    fetchVulnerabilities()
  }, [])

  useEffect(() => {
    let filtered = vulnerabilities

    // Apply severity filter
    if (severityFilter.length > 0) {
      filtered = filtered.filter(vuln => 
        severityFilter.some(f => vuln.severity_rating.toLowerCase() === f.toLowerCase())
      )
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(vuln =>
        vuln.cve_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vuln.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vuln.package.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredVulnerabilities(filtered)
  }, [severityFilter, searchQuery, vulnerabilities])

  const toggleSeverityFilter = (severity: string) => {
    setSeverityFilter(prev =>
      prev.includes(severity)
        ? prev.filter(s => s !== severity)
        : [...prev, severity]
    )
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading vulnerabilities...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />
        <div className="container mx-auto px-6 py-12">
          <h1 className="text-2xl font-bold">Error loading vulnerabilities</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />

      <div className="container mx-auto px-6 py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Vulnerabilities</h1>
          <p className="text-gray-600 mt-2">Security threats across your infrastructure</p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Severity</h3>
          <div className="flex flex-wrap gap-2">
            {['critical', 'high', 'medium', 'low'].map((severity) => (
              <button
                key={severity}
                onClick={() => toggleSeverityFilter(severity)}
                className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                  severityFilter.includes(severity)
                    ? getSeverityColor(severity)
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </button>
            ))}
            {severityFilter.length > 0 && (
              <button
                onClick={() => setSeverityFilter([])}
                className="px-3 py-1.5 rounded text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing {filteredVulnerabilities.length} of {vulnerabilities.length} vulnerabilities
          </p>
        </div>

        {/* Vulnerability cards */}
        {filteredVulnerabilities.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No vulnerabilities found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVulnerabilities.map((vuln) => (
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
                  <div>
                    <span className="font-medium">Package:</span>{' '}
                    <span className="break-all">{vuln.package}</span>
                  </div>
                  {vuln.fixed_in && vuln.fixed_in.length > 0 && (
                    <div>
                      <span className="font-medium">Fixed in:</span>{' '}
                      <span className="text-green-700 font-semibold">
                        {vuln.fixed_in.join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="font-medium">{vuln.affected_releases} release{vuln.affected_releases !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <span className="font-medium">{vuln.affected_endpoints} endpoint{vuln.affected_endpoints !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
