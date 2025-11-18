'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import Header from '@/components/Header'
import SyncedEndpoints from '@/components/SyncedEndpoints'
import { graphqlQuery, GET_RELEASE } from '@/lib/graphql'
import { GetReleaseResponse, Release } from '@/lib/types'
import {
  countVulnerabilitiesBySeverity,
  getRelativeTime,
  estimatePullCount,
} from '@/lib/dataTransform'

export default function ReleaseVersionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchQuery, setSearchQuery] = useState('')
  const [release, setRelease] = useState<Release | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEndpointsModalOpen, setIsEndpointsModalOpen] = useState(false)

  const releaseVersion = params.name as string
  const version = searchParams.get('version') || 'latest'

  const handleSearch = () => router.push('/')

  const [vulnerabilities, setVulnerabilities] = useState<Release['vulnerabilities']>([])
  const [packages, setPackages] = useState<Array<{ name: string; version: string; purl?: string }>>([])

  // Filter state
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>(['critical', 'high', 'medium', 'low', 'clean'])
  const [packageFilter, setPackageFilter] = useState<string>('')
  const [searchCVE, setSearchCVE] = useState('')

  useEffect(() => {
    const fetchRelease = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await graphqlQuery<GetReleaseResponse>(GET_RELEASE, { name: releaseVersion, version })
        const releaseData = response.release
        setRelease(releaseData)

        setVulnerabilities(releaseData.vulnerabilities)

        // Parse packages from SBOM
        let pkgData: Array<{ name: string; version: string; purl?: string }> = []
        try {
          if (releaseData.sbom?.content) {
            const sbomData = JSON.parse(releaseData.sbom.content)
            const components = sbomData.components || []
            pkgData = components
              .filter((c: any) => c.type !== 'file' && c.type !== 'application')
              .map((c: any) => {
                let identifier = c.purl
                if (!identifier && c['bom-ref']) {
                  identifier = c['bom-ref']
                }

                // Strip version from PURL if present
                if (identifier) {
                  if (identifier.includes('/') && !identifier.startsWith('pkg:')) {
                    identifier = identifier.split('/').pop() || identifier
                  }
                  identifier = identifier.replace(/@[^@]*$/, '')
                }

                return {
                  name: identifier || c.name,
                  version: c.version || 'unknown',
                  purl: identifier || c.name
                }
              })
          }
        } catch (e) {
          console.error('Failed to parse SBOM:', e)
        }
        setPackages(pkgData)
      } catch (err) {
        console.error('Error fetching release:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch release data')
      } finally {
        setLoading(false)
      }
    }

    if (releaseVersion) fetchRelease()
  }, [releaseVersion, version])

  if (loading) return (
    <div className="min-h-screen bg-white">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />
      <div className="mx-auto py-12 flex justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading release details...</p>
        </div>
      </div>
    </div>
  )

  if (error || !release) return (
    <div className="min-h-screen bg-white">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />
      <div className="mx-auto py-12">
        <h1 className="text-2xl font-bold">Release not found</h1>
        <p className="mt-2 text-gray-600">{error || 'The requested release could not be found.'}</p>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:text-blue-700">← Back to search</button>
      </div>
    </div>
  )

  const vulnCounts = countVulnerabilitiesBySeverity(vulnerabilities)
  const isOfficial = release.project_type === 'docker'
  const pulls = estimatePullCount(vulnerabilities.length, isOfficial)
  const publisher = isOfficial ? 'Docker Official Image' : 'Community'

  const mostRecentVulnDate = vulnerabilities.length > 0
    ? vulnerabilities.reduce((latest, v) => new Date(v.modified) > latest ? new Date(v.modified) : latest, new Date(0))
    : new Date()

  const updated = getRelativeTime(mostRecentVulnDate.toISOString())
  const openssfScore = release.openssf_score || 'N/A'
  const syncedEndpoints = release.synced_endpoints?.length || 0

  const uniquePackages = packages.filter((pkg, index, self) =>
    index === self.findIndex((p) => p.name === pkg.name && p.version === pkg.version)
  )

  const vulnByPackage = vulnerabilities.reduce((acc, v) => {
    if (!acc[v.package]) acc[v.package] = []
    acc[v.package].push(v)
    return acc
  }, {} as Record<string, typeof vulnerabilities>)

  // Merge packages + vulnerabilities, CLEAN rows always added
  const allPackageNames = Array.from(new Set([...uniquePackages.map(p => p.name), ...vulnerabilities.map(v => v.package)]))

  const combinedData = allPackageNames.flatMap(pkgName => {
    const pkg = uniquePackages.find(p => p.name === pkgName)
    const vulns = vulnByPackage[pkgName] || []

    // Filter by free text package search
    if (packageFilter && !pkgName.toLowerCase().includes(packageFilter.toLowerCase())) return []

    const filteredVulns = vulns
      .filter(v => selectedSeverities.includes(v.severity_rating?.toLowerCase() || 'unknown'))
      .filter(v => !searchCVE || v.cve_id.includes(searchCVE))

    if (filteredVulns.length > 0) {
      return filteredVulns.map(v => ({
        cve_id: v.cve_id,
        severity: v.severity_rating?.toLowerCase() || 'unknown',
        score: v.severity_score || 0,
        package: pkgName,
        version: v.affected_version || pkg?.version || 'unknown',
        fixed_in: v.fixed_in?.join(', ') || '—'
      }))
    }

    // CLEAN row (only if no vulns exist for that package)
    if (selectedSeverities.includes('clean')) {
      return [{
        cve_id: '—',
        severity: 'clean',
        score: 0,
        package: pkgName,
        version: pkg?.version || 'unknown',
        fixed_in: '—'
      }]
    }

    return []
  })

  // Default sort: by score descending, then package name
  combinedData.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.package.localeCompare(b.package)
  })

  const stripVersionFromPurl = (purl: string | undefined, packageName: string): string => {
    if (!purl) return packageName
    if (purl.includes('/') && !purl.startsWith('pkg:')) {
      return purl.split('/').pop() || purl
    }
    return purl.replace(/@[^@]*$/, '')
  }

  const downloadSBOM = () => {
    if (!release.sbom?.content) return
    const blob = new Blob([release.sbom.content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${release.name}-${release.version}-sbom.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />
      <SyncedEndpoints isOpen={isEndpointsModalOpen} onClose={() => setIsEndpointsModalOpen(false)} releaseName={release.name} releaseVersion={release.version} />

      <div className="px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                {(selectedSeverities.length < 5 || packageFilter) && (
                  <button
                    onClick={() => {
                      setSelectedSeverities(['critical', 'high', 'medium', 'low', 'clean'])
                      setPackageFilter('')
                      setSearchCVE('')
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Filter by Severity</h4>
                <div className="space-y-2">
                  {['critical', 'high', 'medium', 'low', 'clean'].map(level => (
                    <label key={level} className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedSeverities.includes(level)}
                        onChange={() => {
                          setSelectedSeverities(prev =>
                            prev.includes(level) ? prev.filter(s => s !== level) : [...prev, level]
                          )
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Filter by Package</h4>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search package name..."
                  value={packageFilter}
                  onChange={e => setPackageFilter(e.target.value)}
                />
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Search CVE ID</h4>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchCVE}
                  onChange={e => setSearchCVE(e.target.value)}
                  placeholder="Filter by CVE ID..."
                />
              </div>

              {release.sbom?.content && (
                <button
                  onClick={downloadSBOM}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Download SBOM
                </button>
              )}
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 space-y-6">
            {/* Summary Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Vulnerabilities</p>
                <div className="flex justify-center gap-1 mt-1 flex-wrap">
                  {vulnCounts.critical > 0 && <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">{vulnCounts.critical} C</span>}
                  {vulnCounts.high > 0 && <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">{vulnCounts.high} H</span>}
                  {vulnCounts.medium > 0 && <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">{vulnCounts.medium} M</span>}
                  {vulnCounts.low > 0 && <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">{vulnCounts.low} L</span>}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">OpenSSF Score</p>
                <p className="font-bold text-lg">{openssfScore}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Synced Endpoints</p>
                <p className="font-bold text-lg">{syncedEndpoints}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Packages</p>
                <p className="font-bold text-lg">{packages.length}</p>
              </div>
            </div>

            {/* Combined Table */}
            {combinedData.length > 0 && (
              <div className="overflow-auto max-h-[600px] border rounded-lg">
                <table className="w-full table-auto min-w-[700px]">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2 text-left border-b">CVE ID</th>
                      <th className="px-4 py-2 text-left border-b">Severity</th>
                      <th className="px-4 py-2 text-left border-b">Score</th>
                      <th className="px-4 py-2 text-left border-b">Package</th>
                      <th className="px-4 py-2 text-left border-b">Version</th>
                      <th className="px-4 py-2 text-left border-b">Fixed In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinedData.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{row.cve_id}</td>
                        <td className="px-4 py-2">
                          {row.severity === 'clean' ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              CLEAN
                            </span>
                          ) : (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              row.severity === 'critical'
                                ? 'bg-red-100 text-red-800'
                                : row.severity === 'high'
                                ? 'bg-orange-100 text-orange-800'
                                : row.severity === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {row.severity.toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">{row.score}</td>
                        <td className="px-4 py-2">{row.package}</td>
                        <td className="px-4 py-2">{row.version}</td>
                        <td className="px-4 py-2">{row.fixed_in}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  )
}
