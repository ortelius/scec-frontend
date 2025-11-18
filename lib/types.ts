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
  docker_repo?: string
  docker_tag?: string
  docker_sha?: string
  sbom?: SBOM
  vulnerabilities: Vulnerability[]
  openssf_scorecard_score?: number
  scorecard_result?: ScorecardResult
}
