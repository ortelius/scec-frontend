import { AffectedRelease, ImageData, Vulnerability } from './types'

// Helper to count vulnerabilities by severity
export function countVulnerabilitiesBySeverity(vulnerabilities: Vulnerability[]) {
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  }

  vulnerabilities.forEach(vuln => {
    const rating = vuln.severity_rating?.toLowerCase()
    if (rating === 'critical') counts.critical++
    else if (rating === 'high') counts.high++
    else if (rating === 'medium') counts.medium++
    else if (rating === 'low') counts.low++
  })

  return counts
}

// Helper to format relative time
export function getRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'today'
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  } catch {
    return 'recently'
  }
}

// Transform GraphQL AffectedRelease data to ImageData format for UI
export function transformAffectedReleasesToImageData(
  affectedReleases: AffectedRelease[]
): ImageData[] {
  // Group by release (name + version)
  const releaseMap = new Map<string, AffectedRelease[]>()

  affectedReleases.forEach(ar => {
    const key = `${ar.release_name}:${ar.release_version}`
    if (!releaseMap.has(key)) {
      releaseMap.set(key, [])
    }
    releaseMap.get(key)!.push(ar)
  })

  // Transform each release group into ImageData
  const imageDataList: ImageData[] = []

  releaseMap.forEach((releases, key) => {
    const firstRelease = releases[0]

    // Count vulnerabilities
    const vulnCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    }

    releases.forEach(r => {
      const rating = r.severity_rating?.toLowerCase()
      if (rating === 'critical') vulnCounts.critical++
      else if (rating === 'high') vulnCounts.high++
      else if (rating === 'medium') vulnCounts.medium++
      else if (rating === 'low') vulnCounts.low++
    })

    // Get the most recent modified date
    const mostRecentDate = releases.reduce((latest, r) => {
      const date = new Date(r.modified)
      return date > latest ? date : latest
    }, new Date(0))

    imageDataList.push({
      name: firstRelease.release_name,
      version: firstRelease.release_version,
      releaseDate: firstRelease.published || new Date().toISOString(),
      publisher: firstRelease.project_type === 'docker' ? 'Docker Official Image' : 'Community',
      description: `${firstRelease.project_type} release with ${firstRelease.dependency_count} dependencies`,
      pulls: firstRelease.dependency_count > 100 ? '1B+' : firstRelease.dependency_count > 50 ? '500M+' : '100M+',
      updated: getRelativeTime(mostRecentDate.toISOString()),
      verified: false,
      official: false,
      tags: ['latest', firstRelease.release_version, firstRelease.project_type],
      longDescription: `${firstRelease.release_name} version ${firstRelease.release_version}`,
      vulnerabilities: vulnCounts,
      dependency_count: firstRelease.dependency_count,
      signed: false,
      openssfScore: firstRelease.openssf_scorecard_score ?? 0,
      syncedEndpoints: firstRelease.synced_endpoint_count ?? 0,
    })
  })

  return imageDataList
}

// Extract unique tags from a release
export function extractTags(release: any): string[] {
  const tags: string[] = ['latest']

  if (release.version) {
    tags.push(release.version)
  }

  if (release.docker_tag) {
    tags.push(release.docker_tag)
  }

  if (release.project_type) {
    tags.push(release.project_type)
  }

  return [...new Set(tags)]
}

// Get pull count based on various factors (simplified)
export function estimatePullCount(dependencies: number, isOfficial: boolean): string {
  if (isOfficial) {
    if (dependencies > 200) return '10B+'
    if (dependencies > 100) return '5B+'
    return '1B+'
  }

  if (dependencies > 200) return '500M+'
  if (dependencies > 100) return '100M+'
  return '10M+'
}
