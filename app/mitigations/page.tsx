'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import MitigationsList from '@/components/mitigations/MitigationsList'
import { Mitigation } from '@/lib/types'

export default function MitigationsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [mitigations, setMitigations] = useState<Mitigation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMitigations, setSelectedMitigations] = useState<Set<string>>(new Set())
  const [showActionMenu, setShowActionMenu] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleSearch = () => {
    router.push('/')
  }

  useEffect(() => {
    console.log('Fetching mitigations...')
    
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

    setMitigations(mockMitigations)
    setLoading(false)
    console.log('Mitigations loaded:', mockMitigations)
  }, [])

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
    if (selectedMitigations.size === mitigations.length) {
      setSelectedMitigations(new Set())
    } else {
      setSelectedMitigations(new Set(mitigations.map(m => m.cve_id)))
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading mitigations...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />

      <div className="container mx-auto px-6 py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Mitigations</h1>
          <p className="text-gray-600 mt-2">Review and remediate security vulnerabilities</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedMitigations.size === mitigations.length && mitigations.length > 0}
                  onChange={toggleAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Select all ({mitigations.length})
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
                    <svg className="w-5 h-5 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="font-medium text-gray-900">AI Auto-remediation</span>
                  </button>

                  <button
                    onClick={() => handleAction('Jira Issue')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.001 1.001 0 0 0 23.013 0Z"/>
                    </svg>
                    <span className="font-medium text-gray-900">Create Jira Issue</span>
                  </button>

                  <button
                    onClick={() => handleAction('GitHub Issue')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span className="font-medium text-gray-900">Create GitHub Issue</span>
                  </button>

                  <button
                    onClick={() => handleAction('GitLab Issue')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <svg className="w-5 h-5 text-orange-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.546 10.93L13.067.452a1.55 1.55 0 0 0-2.188 0L8.708 2.627l2.76 2.76a1.838 1.838 0 0 1 2.325 2.341l2.658 2.66a1.838 1.838 0 0 1 1.924 3.035 1.838 1.838 0 0 1-2.6 0 1.838 1.838 0 0 1-.398-1.993l-2.477-2.477v6.51a1.838 1.838 0 0 1 .49 3.007 1.838 1.838 0 0 1-2.6 0 1.838 1.838 0 0 1 .49-3.007V9.025a1.838 1.838 0 0 1-.996-2.408L7.76 3.965.452 11.27a1.55 1.55 0 0 0 0 2.188l10.48 10.479a1.55 1.55 0 0 0 2.188 0l10.426-10.426a1.55 1.55 0 0 0 0-2.188"/>
                    </svg>
                    <span className="font-medium text-gray-900">Create GitLab Issue</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {mitigations.map((mitigation) => (
              <div
                key={mitigation.cve_id}
                className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                  selectedMitigations.has(mitigation.cve_id) ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedMitigations.has(mitigation.cve_id)}
                    onChange={() => toggleMitigation(mitigation.cve_id)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{mitigation.cve_id}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${
                        mitigation.severity_rating.toLowerCase() === 'critical' ? 'bg-red-100 text-red-800 border-red-200' :
                        mitigation.severity_rating.toLowerCase() === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                        mitigation.severity_rating.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        'bg-blue-100 text-blue-800 border-blue-200'
                      }`}>
                        {mitigation.severity_rating.toUpperCase()} {mitigation.severity_score.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{mitigation.summary}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Package:</span> {mitigation.package}
                      </div>
                      <div>
                        <span className="font-medium">Version:</span> {mitigation.affected_version}
                      </div>
                      {mitigation.fixed_in.length > 0 && (
                        <div>
                          <span className="font-medium">Fixed in:</span>{' '}
                          <span className="text-green-700 font-semibold">
                            {mitigation.fixed_in.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {mitigation.affected_releases} affected release{mitigation.affected_releases !== 1 ? 's' : ''} • {mitigation.affected_endpoints} affected endpoint{mitigation.affected_endpoints !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}