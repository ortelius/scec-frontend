'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import Header from '@/components/Header'
import { getRelativeTime } from '@/lib/dataTransform'

interface EndpointDetails {
  endpoint_name: string
  endpoint_url: string
  endpoint_type: string
  environment: string
  status: string
  last_sync: string
  release_name: string
  release_version: string
  ip_address?: string
  region?: string
  cluster?: string
  namespace?: string
  pod_count?: number
  cpu_usage?: number
  memory_usage?: number
  uptime?: string
}

export default function EndpointDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [endpoint, setEndpoint] = useState<EndpointDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const endpointName = params.name as string
  const version = searchParams.get('version') || 'latest'

  const handleSearch = () => {
    router.push('/')
  }

  // Fetch endpoint data (placeholder - replace with actual GraphQL query)
  useEffect(() => {
    const fetchEndpoint = async () => {
      try {
        setLoading(true)
        setError(null)

        // Placeholder data - replace with actual GraphQL query
        // This would call something like GET_ENDPOINT_DETAILS
        const mockData: EndpointDetails = {
          endpoint_name: endpointName,
          endpoint_url: `https://${endpointName}.example.com`,
          endpoint_type: 'kubernetes',
          environment: 'production',
          status: 'active',
          last_sync: new Date().toISOString(),
          release_name: endpointName,
          release_version: version,
          ip_address: '10.0.1.42',
          region: 'us-east-1',
          cluster: 'prod-cluster-1',
          namespace: 'default',
          pod_count: 3,
          cpu_usage: 45,
          memory_usage: 68,
          uptime: '45 days',
        }

        setEndpoint(mockData)
      } catch (err) {
        console.error('Error fetching endpoint:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch endpoint data')
      } finally {
        setLoading(false)
      }
    }

    if (endpointName) {
      fetchEndpoint()
    }
  }, [endpointName, version])

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower === 'active' || statusLower === 'running') return 'bg-green-100 text-green-800'
    if (statusLower === 'inactive' || statusLower === 'stopped') return 'bg-gray-100 text-gray-800'
    if (statusLower === 'error' || statusLower === 'failed') return 'bg-red-100 text-red-800'
    if (statusLower === 'warning') return 'bg-yellow-100 text-yellow-800'
    return 'bg-blue-100 text-blue-800'
  }

  const getEnvironmentColor = (environment: string) => {
    const envLower = environment.toLowerCase()
    if (envLower === 'production' || envLower === 'prod') return 'bg-red-100 text-red-800'
    if (envLower === 'staging' || envLower === 'stage') return 'bg-orange-100 text-orange-800'
    if (envLower === 'development' || envLower === 'dev') return 'bg-blue-100 text-blue-800'
    if (envLower === 'test' || envLower === 'testing') return 'bg-purple-100 text-purple-800'
    return 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading endpoint details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !endpoint) {
    return (
      <div className="min-h-screen bg-white">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />
        <div className="container mx-auto px-6 py-12">
          <h1 className="text-2xl font-bold">Endpoint not found</h1>
          <p className="mt-2 text-gray-600">{error || 'The requested endpoint could not be found.'}</p>
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
                <h1 className="text-4xl font-bold text-gray-900">{endpoint.endpoint_name}</h1>
                <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(endpoint.status)}`}>
                  {endpoint.status.toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded text-sm font-medium ${getEnvironmentColor(endpoint.environment)}`}>
                  {endpoint.environment.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-600 mb-1">
                <span className="font-semibold">{endpoint.endpoint_url}</span>
              </p>
              <p className="text-sm text-gray-500">Type: {endpoint.endpoint_type}</p>
              <p className="text-sm text-gray-500">Last synced {getRelativeTime(endpoint.last_sync)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pb-8 border-b border-gray-200">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Uptime</div>
              <div className="text-2xl font-bold text-gray-900">{endpoint.uptime}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">CPU Usage</div>
              <div className="text-2xl font-bold text-gray-900">{endpoint.cpu_usage}%</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Memory Usage</div>
              <div className="text-2xl font-bold text-gray-900">{endpoint.memory_usage}%</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Deployment Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Release</div>
                <div className="font-semibold text-gray-900">{endpoint.release_name}:{endpoint.release_version}</div>
              </div>
              {endpoint.region && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Region</div>
                  <div className="font-semibold text-gray-900">{endpoint.region}</div>
                </div>
              )}
              {endpoint.ip_address && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">IP Address</div>
                  <div className="font-semibold text-gray-900 font-mono">{endpoint.ip_address}</div>
                </div>
              )}
              {endpoint.cluster && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Cluster</div>
                  <div className="font-semibold text-gray-900">{endpoint.cluster}</div>
                </div>
              )}
              {endpoint.namespace && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Namespace</div>
                  <div className="font-semibold text-gray-900">{endpoint.namespace}</div>
                </div>
              )}
              {endpoint.pod_count !== undefined && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Pod Count</div>
                  <div className="font-semibold text-gray-900">{endpoint.pod_count}</div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connection Information</h2>
            <div className="bg-gray-900 text-white p-4 rounded-lg font-mono text-sm space-y-2">
              <div>Endpoint URL: {endpoint.endpoint_url}</div>
              {endpoint.ip_address && <div>IP Address: {endpoint.ip_address}</div>}
              <div>Type: {endpoint.endpoint_type}</div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => router.push(`/release/${endpoint.release_name}?version=${encodeURIComponent(endpoint.release_version)}`)}
              className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              View Release Details
            </button>
            <button className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors">
              View Logs
            </button>
            <button className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors">
              View Metrics
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
