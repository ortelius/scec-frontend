const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:3000/api/v1/graphql'

export interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{
    message: string
    locations?: Array<{ line: number; column: number }>
    path?: string[]
  }>
}

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

  const result: GraphQLResponse<T> = await response.json()

  if (result.errors) {
    throw new Error(result.errors.map(e => e.message).join(', '))
  }

  if (!result.data) {
    throw new Error('No data returned from GraphQL query')
  }

  return result.data
}

// Query to get affected releases by severity
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
      dependency_count
    }
  }
`

// Query to get a single release with details
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
    }
  }
`
