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

export default function ImageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchQuery, setSearchQuery] = useState('')
  const [release, setRelease] = useState<Release | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEndpointsModalOpen, setIsEndpointsModalOpen] = useState(false)

  const imageName = params.name as string
  const version = searchParams.get('version') || 'latest'

  const handleSearch = () => router.push('/')

  const [vulnerabilities, setVulnerabilities] = useState<Release['vulnerabilities']>([])
  const [packages, setPackages] = useState<Array<{ name: string; version: string }>>([])

  // Filter state
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>(['critical', 'high', 'medium', 'low'])
  const [selectedPackages, setSelectedPackages] = useState<string[]>([])
  const [searchCVE, setSearchCVE] = useState('')

  useEffect(() => {
    const fetchRelease = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await graphqlQuery<GetReleaseResponse>(GET_RELEASE, { name: imageName, version })
        const releaseData = response.release
        setRelease(releaseData)

        setVulnerabilities(releaseData.vulnerabilities)

        // Parse packages from SBOM
        let pkgData: Array<{ name: string; version: string }> = []
        try {
          if (releaseData.sbom?.content) {
            const sbomData = JSON.parse(releaseData.sbom.content)
            const components = sbomData.components || []
            pkgData = components.map((c: any) => ({ name: c.name, version: c.version || 'unknown' }))
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

    if (imageName) fetchRelease()
  }, [imageName, version])

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

  // Filtered vulnerabilities
  const filteredVulnerabilities = vulnerabilities
    .filter(v => selectedSeverities.includes(v.severity_rating?.toLowerCase() || 'unknown'))
    .filter(v => selectedPackages.length === 0 || selectedPackages.includes(v.package))
    .filter(v => !searchCVE || v.cve_id.includes(searchCVE))
    .sort((a, b) => {
      const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, unknown: 4 }
      const aSeverity = severityOrder[a.severity_rating?.toLowerCase() || 'unknown'] ?? 4
      const bSeverity = severityOrder[b.severity_rating?.toLowerCase() || 'unknown'] ?? 4
      if (aSeverity !== bSeverity) return aSeverity - bSeverity
      return a.cve_id.localeCompare(b.cve_id)
    })

  // Download SBOM
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

      <div className="w-full max-w-[1400px] mx-auto py-6 flex gap-6 px-4">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0 space-y-4 sticky top-24 self-start">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-bold mb-2">Filter by Severity</h3>
            {['critical', 'high', 'medium', 'low'].map(level => (
              <label key={level} className="flex items-center gap-2 text-sm">
                <input type="checkbox"
                  checked={selectedSeverities.includes(level)}
                  onChange={() => {
                    setSelectedSeverities(prev =>
                      prev.includes(level) ? prev.filter(s => s !== level) : [...prev, level]
                    )
                  }} />
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </label>
            ))}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-bold mb-2">Filter by Package</h3>
            <select multiple className="w-full border rounded p-1 text-sm" value={selectedPackages} onChange={e => {
              const options = Array.from(e.target.selectedOptions).map(o => o.value)
              setSelectedPackages(options)
            }}>
              {packages.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-bold mb-2">Search CVE ID</h3>
            <input type="text" className="w-full border rounded p-1 text-sm" value={searchCVE} onChange={e => setSearchCVE(e.target.value)} placeholder="Search..." />
          </div>

          {release.sbom?.content && (
            <button onClick={downloadSBOM} className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg py-2 text-sm">
              Download SBOM
            </button>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 space-y-6">
          {/* Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center bg-gray-50 p-4 rounded-lg">
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
            <div>
              <p className="text-sm text-gray-600">Pulls</p>
              <p className="font-bold text-lg">{pulls}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Vulnerabilities</p>
              <div className="flex justify-center gap-1 mt-1 flex-wrap">
                {vulnCounts.critical > 0 && <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">{vulnCounts.critical} C</span>}
                {vulnCounts.high > 0 && <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">{vulnCounts.high} H</span>}
                {vulnCounts.medium > 0 && <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">{vulnCounts.medium} M</span>}
                {vulnCounts.low > 0 && <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">{vulnCounts.low} L</span>}
              </div>
            </div>
          </div>

          {/* Vulnerabilities Table */}
          {filteredVulnerabilities.length > 0 && (
            <div className="overflow-auto max-h-[600px] border rounded-lg">
              <table className="w-full table-auto min-w-[700px]">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 text-left border-b">CVE ID</th>
                    <th className="px-4 py-2 text-left border-b">Severity</th>
                    <th className="px-4 py-2 text-left border-b">Score</th>
                    <th className="px-4 py-2 text-left border-b">Package</th>
                    <th className="px-4 py-2 text-left border-b">Affected Version</th>
                    <th className="px-4 py-2 text-left border-b">Fixed In</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVulnerabilities.map((vuln, index) => (
                    <tr key={`${vuln.cve_id}-${vuln.package}-${index}`} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{vuln.cve_id}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          vuln.severity_rating?.toLowerCase() === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : vuln.severity_rating?.toLowerCase() === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : vuln.severity_rating?.toLowerCase() === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {vuln.severity_rating?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-4 py-2">{vuln.severity_score?.toFixed(1) || '-'}</td>
                      <td className="px-4 py-2">{vuln.package}</td>
                      <td className="px-4 py-2">{vuln.affected_version || '-'}</td>
                      <td className="px-4 py-2">{vuln.fixed_in?.join(', ') || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Packages Table */}
          {packages.length > 0 && (
            <div className="overflow-auto max-h-[600px] border rounded-lg mt-6">
              <table className="w-full table-auto min-w-[400px]">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 text-left border-b">Package Name</th>
                    <th className="px-4 py-2 text-left border-b">Version</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg, index) => (
                    <tr key={`${pkg.name}-${pkg.version}-${index}`} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{pkg.name}</td>
                      <td className="px-4 py-2">{pkg.version}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
