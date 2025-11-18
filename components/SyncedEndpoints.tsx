'use client'

import { useEffect, useState } from 'react'
import { graphqlQuery, GET_AFFECTED_ENDPOINTS } from '@/lib/graphql'
import { GetAffectedEndpointsResponse, AffectedEndpoint } from '@/lib/types'
import { getRelativeTime } from '@/lib/dataTransform'

// --- Material UI Icon Imports ---
import CloseIcon from '@mui/icons-material/Close'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import InventoryIcon from '@mui/icons-material/Inventory'
import AccessTimeIcon from '@mui/icons-material/AccessTime'

interface EndpointsModalProps {
  isOpen: boolean
  onClose: () => void
  releaseName: string
  releaseVersion: string
}

export default function EndpointsModal({ isOpen, onClose, releaseName, releaseVersion }: EndpointsModalProps) {
  const [endpoints, setEndpoints] = useState<AffectedEndpoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchEndpoints()
    }
  }, [isOpen, releaseName, releaseVersion])

  const fetchEndpoints = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await graphqlQuery<GetAffectedEndpointsResponse>(
        GET_AFFECTED_ENDPOINTS,
        {
          name: releaseName,
          version: releaseVersion,
        }
      )

      setEndpoints(response.affectedEndpoints)
    } catch (err) {
      console.error('Error fetching endpoints:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch endpoints')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower === 'active' || statusLower === 'running') return 'text-green-600 bg-green-50'
    if (statusLower === 'inactive' || statusLower === 'stopped') return 'text-gray-600 bg-gray-50'
    if (statusLower === 'error' || statusLower === 'failed') return 'text-red-600 bg-red-50'
    if (statusLower === 'warning') return 'text-yellow-600 bg-yellow-50'
    return 'text-blue-600 bg-blue-50'
  }

  const getEnvironmentColor = (environment: string) => {
    const envLower = environment.toLowerCase()
    if (envLower === 'production' || envLower === 'prod') return 'text-red-700 bg-red-100'
    if (envLower === 'staging' || envLower === 'stage') return 'text-orange-700 bg-orange-100'
    if (envLower === 'development' || envLower === 'dev') return 'text-blue-700 bg-blue-100'
    if (envLower === 'test' || envLower === 'testing') return 'text-purple-700 bg-purple-100'
    return 'text-gray-700 bg-gray-100'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900" id="modal-title">
                  Synced Endpoints
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Endpoints running {releaseName}:{releaseVersion}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <CloseIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading endpoints...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  {/* Error icon colored red */}
                  <ErrorOutlineIcon sx={{ color: 'rgb(248, 113, 113)' }} className="mx-auto h-12 w-12 text-red-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading endpoints</h3>
                  <p className="mt-1 text-sm text-gray-500">{error}</p>
                  <button
                    onClick={fetchEndpoints}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              ) : endpoints.length === 0 ? (
                <div className="text-center py-12">
                  {/* No endpoints icon colored neutral blue/gray */}
                  <Inventory2Icon sx={{ color: 'rgb(96, 165, 250)' }} className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No endpoints found</h3>
                  <p className="mt-1 text-sm text-gray-500">This release is not currently deployed to any endpoints</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {endpoints.map((endpoint, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{endpoint.endpoint_name}</h4>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(endpoint.status)}`}>
                              {endpoint.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{endpoint.endpoint_url}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          {/* Endpoint Type icon colored gray */}
                          <InventoryIcon sx={{ color: 'rgb(107, 114, 128)' }} className="w-4 h-4" />
                          <span>Type: <span className="font-medium text-gray-700">{endpoint.endpoint_type}</span></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getEnvironmentColor(endpoint.environment)}`}>
                            {endpoint.environment}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Last Sync icon colored gray */}
                          <AccessTimeIcon sx={{ color: 'rgb(107, 114, 128)' }} className="w-4 h-4" />
                          <span>Last sync: <span className="font-medium text-gray-700">{getRelativeTime(endpoint.last_sync)}</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}