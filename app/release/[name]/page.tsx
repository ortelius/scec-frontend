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

// --- Material UI Icon Imports ---
import SettingsIcon from '@mui/icons-material/Settings'
import SecurityIcon from '@mui/icons-material/Security'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import DownloadIcon from '@mui/icons-material/Download'
import WarningIcon from '@mui/icons-material/Warning'
import StarIcon from '@mui/icons-material/Star'
import LinkIcon from '@mui/icons-material/Link'
import BuildIcon from '@mui/icons-material/Build'
import AltRouteIcon from '@mui/icons-material/AltRoute'
import HistoryIcon from '@mui/icons-material/History'
import ConstructionIcon from '@mui/icons-material/Construction'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import WhatshotIcon from '@mui/icons-material/Whatshot'
import NotificationsIcon from '@mui/icons-material/Notifications'


export default function ReleaseVersionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchQuery, setSearchQuery] = useState('')
  const [release, setRelease] = useState<Release | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEndpointsModalOpen, setIsEndpointsModalOpen] = useState(false)
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const releaseVersion = params.name as string
  const version = searchParams.get('version') || 'latest'

  const handleSearch = () => router.push('/')

  const [vulnerabilities, setVulnerabilities] = useState<Release['vulnerabilities']>([])
  const [packages, setPackages] = useState<Array<{ name: string; version: string; purl?: string }>>([])

  // Filter state
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>(['critical', 'high', 'medium', 'low', 'clean'])
  const [packageFilter, setPackageFilter] = useState('')
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
              .filter((c: any) => c.type !== 'file')
              .map((c: any) => {
                let identifier = c.purl || c['bom-ref'] || c.name
                if (identifier) {
                  if (identifier.includes('/') && !identifier.startsWith('pkg:')) {
                    identifier = identifier.split('/').pop() || identifier
                  }
                  identifier = identifier.replace(/@[^@]*$/, '')
                }
                return {
                  name: identifier,
                  version: c.version || 'unknown',
                  purl: c.purl || identifier  // Keep full purl for matching
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

  // ====================================================================
  // FIXED LOGIC: Process packages individually, not grouped by name
  // ====================================================================
  
  const combinedData: Array<{
    cve_id: string
    severity: string
    score: number
    package: string
    version: string
    fixed_in: string
    full_purl?: string
  }> = []

  // First, add all vulnerable packages (from GraphQL)
  vulnerabilities
    .filter(v => selectedSeverities.includes(v.severity_rating?.toLowerCase() || 'unknown'))
    .filter(v => !searchCVE || v.cve_id.includes(searchCVE))
    .forEach(v => {
      const packageName = v.package
      if (packageFilter && !packageName.toLowerCase().includes(packageFilter.toLowerCase())) {
        return
      }
      
      combinedData.push({
        cve_id: v.cve_id,
        severity: v.severity_rating?.toLowerCase() || 'unknown',
        score: v.severity_score ?? 0,
        package: packageName,
        version: v.affected_version || 'unknown',
        fixed_in: v.fixed_in?.join(', ') || '—',
        full_purl: v.full_purl
      })
    })

  // Second, add clean packages (from SBOM) if "clean" filter is selected
  if (selectedSeverities.includes('clean')) {
    packages.forEach(pkg => {
      // Apply package name filter
      if (packageFilter && !pkg.name.toLowerCase().includes(packageFilter.toLowerCase())) {
        return
      }

      // Check if THIS SPECIFIC package version is vulnerable
      // We need to match by full_purl or by name+version
      const isVulnerable = vulnerabilities.some(v => {
        // Try to match by full_purl first (most accurate)
        if (v.full_purl && pkg.purl) {
          // Both have full purls - compare them
          // Note: SBOM purl might have version, vuln purl might not
          // Extract base purl without version for comparison
          const basePkgPurl = pkg.purl.split('@')[0]
          const baseVulnPurl = v.full_purl.split('@')[0]
          
          // If base purls match, check version
          if (basePkgPurl === baseVulnPurl) {
            // Check if vulnerability affects this version
            return v.affected_version === pkg.version
          }
        }
        
        // Fallback: match by package name and version
        const vulnPackageName = v.package.split('@')[0] // Remove version if present
        return vulnPackageName === pkg.name && v.affected_version === pkg.version
      })

      // Only add clean row if this specific version is NOT vulnerable
      if (!isVulnerable) {
        combinedData.push({
          cve_id: '—',
          severity: 'clean',
          score: 0,
          package: pkg.name,
          version: pkg.version,
          fixed_in: '—',
          full_purl: pkg.purl
        })
      }
    })
  }

  // Sort by score (highest first), then by package name
  combinedData.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.package.localeCompare(b.package)
  })

  // ====================================================================
  // END OF FIXED LOGIC
  // ====================================================================

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

  const openssfScore = release.openssf_scorecard_score ?? 'N/A'
  const syncedEndpoints = release.synced_endpoint_count || 0
  const syncedEndpointsList = release.synced_endpoints || []


  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />
      <SyncedEndpoints isOpen={isEndpointsModalOpen} onClose={() => setIsEndpointsModalOpen(false)} releaseName={release.name} releaseVersion={release.version} />

      <div className={`px-6 py-6 flex ${isSidebarOpen ? 'gap-6' : 'gap-2'}`}>
        
        <aside className={`flex-shrink-0 transition-all duration-300 ${isSidebarOpen ? 'w-full lg:w-64' : 'w-12'}`}>
          
          <div className="sticky top-20"> 

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              
              <div className={`flex items-center justify-between mb-4 ${isSidebarOpen ? '' : 'justify-center'}`}>
                  {isSidebarOpen ? (
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <SettingsIcon sx={{ width: 20, height: 20, color: 'rgb(37, 99, 235)' }} /> 
                          Filters
                      </h3>
                  ) : (
                      <SettingsIcon sx={{ width: 20, height: 20, color: 'rgb(37, 99, 235)' }} />
                  )}
                  
                  <button 
                      onClick={() => setIsSidebarOpen(prev => !prev)}
                      className="text-gray-500 hover:text-blue-600 transition-colors"
                      aria-label={isSidebarOpen ? "Collapse Filters" : "Expand Filters"}
                  >
                      {isSidebarOpen ? (
                          <ChevronLeftIcon sx={{ width: 20, height: 20 }} />
                      ) : (
                          <ChevronRightIcon sx={{ width: 20, height: 20 }} />
                      )}
                  </button>
              </div>

              <div className={`transition-all duration-300 overflow-hidden ${isSidebarOpen ? 'h-auto opacity-100' : 'h-0 opacity-0'}`}>
                  
                  {(selectedSeverities.length < 5 || packageFilter || searchCVE) && (
                      <div className="flex justify-end mb-4">
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
                      </div>
                  )}

                  <div className="mb-6"> 
                      <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <SecurityIcon sx={{ width: 16, height: 16, color: 'rgb(22, 163, 74)' }} /> 
                          Severity
                      </h4>
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
                      <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Inventory2Icon sx={{ width: 16, height: 16, color: 'rgb(59, 130, 246)' }} /> 
                          Package
                      </h4>
                      <input
                          type="text"
                          className="w-[98%] mx-auto px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 block"
                          value={packageFilter}
                          onChange={e => setPackageFilter(e.target.value)}
                          placeholder="Filter by package name..."
                      />
                  </div>

                  <div className="mb-6"> 
                      <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span 
                              className="material-symbols-outlined" 
                              style={{ 
                                  fontSize: '20px', 
                                  color: 'rgb(185, 28, 28)',
                                  lineHeight: '1'
                              }}>
                              threat_intelligence
                          </span>
                          CVE ID
                      </h4>
                      <input
                          type="text"
                          className="w-[98%] mx-auto px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 block"
                          value={searchCVE}
                          onChange={e => setSearchCVE(e.target.value)}
                          placeholder="Filter by CVE ID..."
                      />
                  </div>
              </div>

            </div>
          </div>

        </aside>

        <main className="flex-1 space-y-6">
          
          <div className="flex items-center gap-4 mb-6">
              <button
                  onClick={() => router.back()}
                  className="flex items-center text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
                  aria-label="Go back to previous page"
              >
                  <ArrowBackIcon sx={{ width: 16, height: 16 }} />
                  <span className="ml-1">Back</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                  {release.name} <span className="text-gray-500 font-normal">({release.version})</span>
              </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-center bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div>
              <p className="text-xs text-gray-600 flex justify-center items-center gap-1">
                <span 
                    className="material-symbols-outlined" 
                    style={{ 
                        fontSize: '20px', 
                        color: 'rgb(185, 28, 28)',
                        lineHeight: '1'
                    }}>
                    threat_intelligence
                </span>
                Vulnerabilities
              </p>
              <p className="font-medium text-lg text-gray-900">{vulnerabilities.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 flex justify-center items-center gap-1"><SecurityIcon sx={{ width: 16, height: 16, color: 'rgb(22, 163, 74)' }} /> OpenSSF Score</p>
              <p className="font-medium text-lg text-gray-900">{openssfScore}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 flex justify-center items-center gap-1"><LinkIcon sx={{ width: 16, height: 16, color: 'rgb(37, 99, 235)' }} /> Synced Endpoints</p>
              <p className="font-medium text-lg text-gray-900">{syncedEndpoints}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 flex justify-center items-center gap-1"><Inventory2Icon sx={{ width: 16, height: 16, color: 'rgb(107, 114, 128)' }} /> Packages</p>
              <p className="font-medium text-lg text-gray-900">{packages.length}</p>
            </div>
            
            {release.sbom?.content && (
              <div className="flex flex-col items-center justify-center">
                  <p className="text-xs text-gray-600 flex justify-center items-center gap-1">
                      <DownloadIcon sx={{ width: 16, height: 16, color: 'rgb(37, 99, 235)' }} /> SBOM
                  </p>
                  <button
                    onClick={downloadSBOM}
                    className="font-medium text-lg text-gray-900 text-blue-600 hover:text-blue-800 transition-colors bg-transparent border-none p-0 cursor-pointer"
                  >
                      Download
                  </button>
              </div>
            )}
          </div>

          <section className="mt-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <LinkIcon sx={{ width: 20, height: 20, color: 'rgb(37, 99, 235)' }} /> 
              Synced Endpoints ({syncedEndpointsList.length})
            </h3>
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Endpoint Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Environment</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Last Sync Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {syncedEndpointsList.length > 0 ? (
                    syncedEndpointsList.map((endpoint, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 align-top whitespace-normal text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                          {endpoint.endpoint_name}
                        </td>
                        <td className="px-4 py-2 align-top whitespace-nowrap text-sm text-gray-700">
                          {endpoint.environment}
                        </td>
                        <td className="px-4 py-2 align-top whitespace-nowrap text-sm text-gray-700">
                          {endpoint.last_sync ? getRelativeTime(endpoint.last_sync) : '—'}
                        </td>
                        <td className="px-4 py-2 align-top whitespace-nowrap text-sm text-gray-700">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                              endpoint.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            } w-fit`}>
                            {endpoint.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center bg-white">
                        <p className="text-gray-500 font-medium text-lg">No synced endpoints found for this release.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="overflow-auto border rounded-lg max-h-96"> 
            {combinedData.length > 0 ? (
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
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                            <StarIcon sx={{ width: 12, height: 12, color: 'rgb(22, 163, 74)' }} /> CLEAN
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
                          } flex items-center gap-1 w-fit`}>
                            {row.severity === 'critical' ? (
                                <span className="material-symbols-outlined" style={{ 
                                    fontSize: '12px', 
                                    width: '12px', 
                                    height: '12px', 
                                    color: 'rgb(185, 28, 28)',
                                    lineHeight: '1', 
                                    marginRight: '4px'
                                }}>
                                    bomb
                                </span>
                            ) : 
                             row.severity === 'high' ? <WhatshotIcon sx={{ width: 12, height: 12, color: 'rgb(194, 65, 12)' }} /> : 
                             row.severity === 'medium' ? <NotificationsIcon sx={{ width: 12, height: 12, color: 'rgb(202, 138, 4)' }} /> : 
                             <WarningIcon sx={{ width: 12, height: 12, color: 'rgb(29, 78, 216)' }} />} {row.severity.toUpperCase()}
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
            ) : (
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
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center bg-white">
                      <p className="text-gray-500 font-medium text-lg">No data found matching current filters.</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <section className="mt-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <BuildIcon sx={{ width: 20, height: 20, color: 'rgb(100, 116, 139)' }} />
                Source & Build Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1 text-sm text-gray-700">
              
              <div>
                <h4 className="text-md font-semibold text-gray-900 mt-2 mb-1 flex items-center gap-2">
                    <AltRouteIcon sx={{ width: 16, height: 16, color: 'rgb(59, 130, 246)' }} />
                    Source Control
                </h4>
                <ul className="space-y-1">
                  <li><span className="font-medium">Commit:</span> {release.git_commit || '—'}</li>
                  <li><span className="font-medium">Branch:</span> {release.git_branch || '—'}</li>
                  <li><span className="font-medium">Tag:</span> {release.git_tag || '—'}</li>
                  <li><span className="font-medium">Repo:</span> {release.git_repo || '—'}</li>
                  <li><span className="font-medium">Org:</span> {release.git_org || '—'}</li>
                  <li><span className="font-medium">URL:</span> {release.git_url || '—'}</li>
                  <li><span className="font-medium">Project:</span> {release.git_repo_project || '—'}</li>
                </ul>
              </div>

              <div>
                <h4 className="text-md font-semibold text-gray-900 mt-2 mb-1 flex items-center gap-2">
                    <Inventory2Icon sx={{ width: 16, height: 16, color: 'rgb(20, 184, 166)' }} />
                    Container Artifacts
                </h4>
                <ul className="space-y-1">
                  <li><span className="font-medium">Content SHA:</span> {release.content_sha || '—'}</li>
                  <li><span className="font-medium">Docker Repo:</span> {release.docker_repo || '—'}</li>
                  <li><span className="font-medium">Docker Tag:</span> {release.docker_tag || '—'}</li>
                  <li><span className="font-medium">Docker SHA:</span> {release.docker_sha || '—'}</li>
                  <li><span className="font-medium">Basename:</span> {release.basename || '—'}</li>
                  <li><span className="font-medium">Commit Verified:</span> {release.git_verify_commit !== undefined ? (release.git_verify_commit ? 'Yes' : 'No') : '—'}</li>
                  <li><span className="font-medium">Signed Off By:</span> {release.git_signed_off_by || '—'}</li>
                </ul>
              </div>

              <div>
                <h4 className="text-md font-semibold text-gray-900 mt-2 mb-1 flex items-center gap-2">
                    <HistoryIcon sx={{ width: 16, height: 16, color: 'rgb(124, 58, 237)' }} />
                    Metrics & Timestamps
                </h4>
                <ul className="space-y-1">
                  <li><span className="font-medium">Commit Timestamp:</span> {release.git_commit_timestamp || '—'}</li>
                  <li><span className="font-medium">Commit Authors:</span> {release.git_commit_authors || '—'}</li>
                  <li><span className="font-medium">Committers Count:</span> {release.git_committerscnt || '—'}</li>
                  <li><span className="font-medium">Total Committers Count:</span> {release.git_total_committerscnt || '—'}</li>
                  <li><span className="font-medium">Contrib Percentage:</span> {release.git_contrib_percentage || '—'}</li>
                  <li><span className="font-medium">Lines Added:</span> {release.git_lines_added || '—'}</li>
                  <li><span className="font-medium">Lines Deleted:</span> {release.git_lines_deleted || '—'}</li>
                  <li><span className="font-medium">Lines Total:</span> {release.git_lines_total || '—'}</li>
                  <li><span className="font-medium">Previous Component Commit:</span> {release.git_prev_comp_commit || '—'}</li>
                </ul>
              </div>

              <div className="lg:col-span-3">
                <h4 className="text-md font-semibold text-gray-900 mt-2 mb-1 flex items-center gap-2">
                    <ConstructionIcon sx={{ width: 16, height: 16, color: 'rgb(249, 115, 22)' }} />
                    Build Environment
                </h4>
                <ul className="space-y-1 grid grid-cols-2 md:grid-cols-4">
                  <li><span className="font-medium">Build Date:</span> {release.build_date || '—'}</li>
                  <li><span className="font-medium">Build ID:</span> {release.build_id || '—'}</li>
                  <li><span className="font-medium">Build Number:</span> {release.build_num || '—'}</li>
                  <li><span className="font-medium">Build URL:</span> {release.build_url || '—'}</li>
                </ul>
              </div>

            </div>
          </section>

          {release.scorecard_result && (
            <section className="mt-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <SecurityIcon sx={{ width: 20, height: 20, color: 'rgb(22, 163, 74)' }} />
                OpenSSF Scorecard
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Aggregate Score: <span className="font-medium text-gray-900">{release.scorecard_result.Score || '—'}</span> (Version: {release.scorecard_result.Scorecard.Version})
              </p>
              
              <div className="overflow-x-auto border rounded-lg mt-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Check Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Score</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {release.scorecard_result.Checks.map((check, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 align-top whitespace-normal text-sm text-gray-900">
                          {check.Name}
                        </td>
                        <td className="px-4 py-2 align-top whitespace-nowrap text-sm text-gray-700">
                          {check.Score}
                        </td>
                        <td className="px-4 py-2 align-top text-sm text-gray-700 break-words max-w-sm">
                          {check.Reason ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        </main>
      </div>
    </div>
  )
}