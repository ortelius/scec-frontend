// lib/types.ts

export interface SBOM {
  key: string
  contentsha: string
  objtype: string
  content: string
}

export interface Vulnerability {
  cve_id: string
  summary?: string
  details?: string
  severity_score?: number
  severity_rating?: string
  cvss_v3_score?: number
  published?: string
  modified?: string
  aliases?: string[]
  package: string
  affected_version?: string
  full_purl?: string
  fixed_in?: string[]
}

export interface Documentation {
  Short: string
  URL: string
}

export interface Check {
  Name: string
  Score: number
  Reason?: string
  Details?: string[]
  Documentation: Documentation
}

export interface Repo {
  Name: string
  Commit: string
}

export interface Scores {
  Version: string
  Commit: string
}

export interface ScorecardResult {
  Date: string
  Repo: Repo
  Scorecard: Scores
  Score: number
  Checks: Check[]
  Metadata?: string[]
}

export interface Release {
  key: string
  name: string
  version: string
  project_type: string
  content_sha?: string
  git_commit?: string
  git_branch?: string
  git_tag?: string
  git_repo?: string
  git_org?: string
  git_url?: string
  git_repo_project?: string
  git_verify_commit?: boolean
  git_signed_off_by?: string
  git_commit_timestamp?: string
  git_commit_authors?: string
  git_committerscnt?: number
  git_total_committerscnt?: number
  git_contrib_percentage?: string
  git_lines_added?: number
  git_lines_deleted?: number
  git_lines_total?: number
  git_prev_comp_commit?: string
  docker_repo?: string
  docker_tag?: string
  docker_sha?: string
  basename?: string
  build_date?: string
  build_id?: string
  build_num?: string
  build_url?: string
  dependency_count?: number
  sbom?: SBOM
  vulnerabilities: Vulnerability[]
  openssf_scorecard_score?: number
  scorecard_result?: ScorecardResult
  synced_endpoint_count?: number
  synced_endpoints?: AffectedEndpoint[]
}

// Additional types for other queries

export interface AffectedRelease {
  cve_id: string
  summary?: string
  details?: string
  severity_score?: number
  severity_rating?: string
  published?: string
  modified: string
  aliases?: string[]
  package: string
  affected_version?: string
  full_purl?: string
  fixed_in?: string[]
  release_name: string
  release_version: string
  content_sha?: string
  project_type: string
  openssf_scorecard_score?: number
  dependency_count: number
  synced_endpoint_count?: number
  version_count: number
  vulnerability_count?: number
  vulnerability_count_delta?: number
}

export interface GetAffectedReleasesResponse {
  affectedReleases: AffectedRelease[]
}

export interface GetReleaseResponse {
  release: Release
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

export interface GetSyncedEndpointsResponse {
  syncedEndpoints: SyncedEndpoint[]
}

export interface AffectedEndpoint {
  endpoint_name: string
  endpoint_url: string
  endpoint_type: string
  environment: string
  last_sync: string
  status: string
}

export interface GetAffectedEndpointsResponse {
  affectedEndpoints: AffectedEndpoint[]
}

export interface Mitigation {
  cve_id: string
  summary: string
  severity_score: number
  severity_rating: string
  package: string
  affected_version: string
  full_purl: string
  fixed_in: string[]
  affected_releases: number
  affected_endpoints: number
}

export interface GetVulnerabilitiesResponse {
  vulnerabilities: Mitigation[]
}

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
  version_count: number
  total_vulnerabilities: number
  vulnerability_count_delta?: number
}
