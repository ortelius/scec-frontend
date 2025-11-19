// lib/graphql.ts - UPDATED VERSION

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:3000/api/v1/graphql'

export async function graphqlQuery<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`)
  }

  const json = await response.json()

  if (json.errors) {
    throw new Error(json.errors[0]?.message || 'GraphQL query failed')
  }

  return json.data
}

// ------------------ QUERIES ------------------

// Fetch a single release with full fields including OpenSSF Scorecard
export const GET_RELEASE = `
  query GetRelease($name: String!, $version: String!) {
    release(name: $name, version: $version) {
      key
      name
      version
      project_type
      content_sha
      git_commit
      git_branch
      docker_repo
      docker_tag
      docker_sha
      sbom {
        key
        contentsha
        objtype
        content
      }
      vulnerabilities {
        cve_id
        summary
        details
        severity_score
        severity_rating
        cvss_v3_score
        published
        modified
        aliases
        package
        affected_version
        full_purl
        fixed_in
      }
      openssf_scorecard_score
      synced_endpoint_count
      synced_endpoints {
        endpoint_name
        endpoint_url
        endpoint_type
        environment
        last_sync
        status
      }
      scorecard_result {
        Date
        Repo {
          Name
          Commit
        }
        Scorecard {
          Version
          Commit
        }
        Score
        Checks {
          Name
          Score
          Reason
          Details
          Documentation {
            Short
            URL
          }
        }
        Metadata
      }
    }
  }
`

// Affected releases for vulnerabilities page
export const GET_AFFECTED_RELEASES = `
  query GetAffectedReleases($severity: Severity!, $limit: Int) {
    affectedReleases(severity: $severity, limit: $limit) {
      cve_id
      summary
      details
      severity_score
      severity_rating
      published
      modified
      aliases
      package
      affected_version
      full_purl
      fixed_in
      release_name
      release_version
      content_sha
      project_type
      openssf_scorecard_score
      dependency_count
      synced_endpoint_count
    }
  }
`

// Synced endpoints query
export const GET_SYNCED_ENDPOINTS = `
  query GetSyncedEndpoints($limit: Int) {
    syncedEndpoints(limit: $limit) {
      endpoint_name
      endpoint_url
      endpoint_type
      environment
      status
      last_sync
      release_count
      total_vulnerabilities {
        critical
        high
        medium
        low
      }
      releases {
        release_name
        release_version
      }
    }
  }
`

// Affected endpoints for a release
export const GET_AFFECTED_ENDPOINTS = `
  query GetAffectedEndpoints($name: String!, $version: String!) {
    affectedEndpoints(name: $name, version: $version) {
      endpoint_name
      endpoint_url
      endpoint_type
      environment
      last_sync
      status
    }
  }
`

// Mitigations page query
export const GET_MITIGATIONS = `
  query GetMitigations($limit: Int) {
    mitigations(limit: $limit) {
      cve_id
      summary
      severity_score
      severity_rating
      package
      affected_version
      full_purl
      fixed_in
      affected_releases
      affected_endpoints
    }
  }
`

// Vulnerabilities page query
export const GET_VULNERABILITIES = `
  query GetVulnerabilities($limit: Int) {
    vulnerabilities(limit: $limit) {
      cve_id
      summary
      severity_score
      severity_rating
      package
      affected_version
      full_purl
      fixed_in
      affected_releases
      affected_endpoints
    }
  }
`