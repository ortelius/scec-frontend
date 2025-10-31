export interface Vulnerability {
  cve_id: string
  summary: string
  details: string
  severity_score: number
  severity_rating: string
  cvss_v3_score?: string
  published: string
  modified: string
  aliases: string[]
  package: string
  affected_version: string
  full_purl: string
  fixed_in: string[]
}

export interface AffectedRelease {
  cve_id: string
  summary: string
  details: string
  severity_score: number
  severity_rating: string
  published: string
  modified: string
  aliases: string[]
  package: string
  affected_version: string
  full_purl: string
  fixed_in: string[]
  release_name: string
  release_version: string
  content_sha: string
  project_type: string
  dependency_count: number
  synced_endpoint_count: number
  openssf_scorecard_score: number
}

export interface AffectedEndpoint {
  endpoint_name: string
  endpoint_url: string
  endpoint_type: string
  environment: string
  last_sync: string
  status: string
}

export interface SyncedEndpoint {
  endpoint_name: string
  endpoint_url: string
  endpoint_type: string
  environment: string
  status: string
  last_sync: string
  release_count: number
  total_vulnerabilities: {
    critical: number
    high: number
    medium: number
    low: number
  }
  releases: Array<{
    release_name: string
    release_version: string
  }>
}

export interface SBOM {
  key: string
  contentsha: string
  content: string
}

export interface Release {
  key: string
  name: string
  version: string
  project_type: string
  content_sha: string
  git_commit?: string
  git_branch?: string
  docker_repo?: string
  docker_tag?: string
  docker_sha?: string
  sbom?: SBOM
  vulnerabilities: Vulnerability[]
}

// For display purposes, we'll transform the GraphQL data into this format
export interface ImageData {
  name: string
  version: string
  releaseDate: string
  publisher: string
  description: string
  pulls: string
  updated: string
  verified: boolean
  official: boolean
  tags: string[]
  longDescription?: string
  vulnerabilities: {
    critical: number
    high: number
    medium: number
    low: number
  }
  dependency_count: number
  signed: boolean
  openssfScore: number
  syncedEndpoints: number
}

export interface GetAffectedReleasesResponse {
  affectedReleases: AffectedRelease[]
}

export interface GetReleaseResponse {
  release: Release
}

export interface GetAffectedEndpointsResponse {
  affectedEndpoints: AffectedEndpoint[]
}

export interface GetSyncedEndpointsResponse {
  syncedEndpoints: SyncedEndpoint[]
}
