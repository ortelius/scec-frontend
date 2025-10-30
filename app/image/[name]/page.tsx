'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import Header from '@/components/Header'
import { graphqlQuery, GET_RELEASE } from '@/lib/graphql'
import { GetReleaseResponse, Release } from '@/lib/types'
import { countVulnerabilitiesBySeverity, getRelativeTime, extractTags, estimatePullCount } from '@/lib/dataTransform'

export default function ImageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [release, setRelease] = useState<Release | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const imageName = params.name as string

  const handleSearch = () => {
    router.push('/')
  }

  // Fetch release data from GraphQL
  useEffect(() => {
    const fetchRelease = async () => {
      try {
        setLoading(true)
        setError(null)

        // For now, we'll use a version of "latest" or extract from name
        // In a real implementation, you'd want to handle version selection
        const response = await graphqlQuery<GetReleaseResponse>(
          GET_RELEASE,
          {
            name: imageName,
            version: 'latest', // You might want to make this dynamic
          }
        )

        setRelease(response.release)
      } catch (err) {
        console.error('Error fetching release:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch release data')
      } finally {
        setLoading(false)
      }
    }

    if (imageName) {
      fetchRelease()
    }
  }, [imageName])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading release details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !release) {
    return (
      <div className="min-h-screen bg-white">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />
        <div className="container mx-auto px-6 py-12">
          <h1 className="text-2xl font-bold">Release not found</h1>
          <p className="mt-2 text-gray-600">{error || 'The requested release could not be found.'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            ← Back to search
          </button>
        </div>
      </div>
    )
  }

  const vulnCounts = countVulnerabilitiesBySeverity(release.vulnerabilities)
  const tags = extractTags(release)
  const isOfficial = release.project_type === 'docker'
  const pulls = estimatePullCount(release.vulnerabilities.length, isOfficial)
  const publisher = isOfficial ? 'Docker Official Image' : 'Community'

  // Get the most recent update date from vulnerabilities
  const mostRecentVulnDate = release.vulnerabilities.length > 0
    ? release.vulnerabilities.reduce((latest, v) => {
        const date = new Date(v.modified)
        return date > latest ? date : latest
      }, new Date(0))
    : new Date()

  const updated = getRelativeTime(mostRecentVulnDate.toISOString())

  return (
    <div className="min-h-screen bg-white">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />

      <div className="container mx-auto px-6 py-6 max-w-7xl">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to search
        </button>

        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-gray-900">{release.name}</h1>
                {isOfficial && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 rounded text-sm font-medium text-blue-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Official image</span>
                  </div>
                )}
              </div>
              <p className="text-gray-600 mb-1">
                By <span className="font-semibold">{publisher}</span>
              </p>
              <p className="text-sm text-gray-500">Version: {release.version}</p>
              <p className="text-sm text-gray-500">Updated {updated}</p>
            </div>

            <button className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors">
              Docker Pull Command
            </button>
          </div>

          <div className="flex items-center gap-8 mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <div>
                <div className="text-2xl font-bold text-gray-900">{pulls}</div>
                <div className="text-sm text-gray-600">Pulls</div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 leading-relaxed">
              {release.project_type} release version {release.version}
              {release.docker_repo && ` from ${release.docker_repo}`}
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Docker Pull Command</h2>
            <div className="bg-gray-900 text-white p-4 rounded-lg font-mono text-sm">
              docker pull {release.name}:{release.version}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Supported tags</h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {release.content_sha && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Content SHA</h2>
              <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm break-all">
                {release.content_sha}
              </div>
            </div>
          )}

          {release.vulnerabilities && release.vulnerabilities.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Vulnerabilities ({release.vulnerabilities.length})
              </h2>

              <div className="flex gap-4 mb-6">
                {vulnCounts.critical > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-red-600"></div>
                    <span className="font-semibold text-red-800">Critical: {vulnCounts.critical}</span>
                  </div>
                )}
                {vulnCounts.high > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                    <span className="font-semibold text-orange-800">High: {vulnCounts.high}</span>
                  </div>
                )}
                {vulnCounts.medium > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                    <span className="font-semibold text-yellow-800">Medium: {vulnCounts.medium}</span>
                  </div>
                )}
                {vulnCounts.low > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    <span className="font-semibold text-blue-800">Low: {vulnCounts.low}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {release.vulnerabilities.slice(0, 10).map((vuln, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{vuln.cve_id}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          vuln.severity_rating?.toLowerCase() === 'critical' ? 'bg-red-100 text-red-800' :
                          vuln.severity_rating?.toLowerCase() === 'high' ? 'bg-orange-100 text-orange-800' :
                          vuln.severity_rating?.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {vuln.severity_rating?.toUpperCase() || 'UNKNOWN'} {vuln.severity_score?.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{vuln.summary}</p>
                    <div className="text-xs text-gray-500">
                      <span>Package: {vuln.package}</span>
                      {vuln.affected_version && <span> • Version: {vuln.affected_version}</span>}
                      {vuln.fixed_in && vuln.fixed_in.length > 0 && (
                        <span> • Fixed in: {vuln.fixed_in.join(', ')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {release.vulnerabilities.length > 10 && (
                <p className="text-sm text-gray-500 mt-4">
                  Showing 10 of {release.vulnerabilities.length} vulnerabilities
                </p>
              )}
            </div>
          )}

          {release.sbom && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">SBOM</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  SBOM SHA: <span className="font-mono">{release.sbom.contentsha}</span>
                </p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View SBOM content
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-900 text-white rounded text-xs overflow-x-auto max-h-96">
                    {release.sbom.content}
                  </pre>
                </details>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
