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

// Helper to calculate OpenSSF score based on vulnerabilities and other factors
export function calculateOpenssfScore(
  vulnerabilities: { critical: number; high: number; medium: number; low: number },
  signed: boolean,
  verified: boolean
): number {
  let score = 10.0

  // Deduct points for vulnerabilities
  score -= vulnerabilities.critical * 0.8
  score -= vulnerabilities.high * 0.4
  score -= vulnerabilities.medium * 0.2
  score -= vulnerabilities.low * 0.05

  // Deduct if not signed
  if (!signed) score -= 0.5

  // Deduct if not verified
  if (!verified) score -= 0.3

  // Ensure score stays within 0-10 range
  return Math.max(0, Math.min(10, score))
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

    // Extract unique packages (dependencies count)
    const uniquePackages = new Set(releases.map(r => r.package))
    const dependencies = uniquePackages.size

    // Determine if official/verified (simplified logic)
    const isOfficial = firstRelease.project_type === 'docker' ||
                       firstRelease.release_name.toLowerCase().includes('official')
    const isVerified = vulnCounts.critical === 0 && vulnCounts.high < 3
    const isSigned = firstRelease.content_sha !== ''

    // Calculate OpenSSF score
    const openssfScore = calculateOpenssfScore(vulnCounts, isSigned, isVerified)

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
      description: `${firstRelease.project_type} release with ${dependencies} dependencies`,
      pulls: dependencies > 100 ? '1B+' : dependencies > 50 ? '500M+' : '100M+',
      updated: getRelativeTime(mostRecentDate.toISOString()),
      verified: isVerified,
      official: isOfficial,
      tags: ['latest', firstRelease.release_version, firstRelease.project_type],
      longDescription: `${firstRelease.release_name} version ${firstRelease.release_version}`,
      vulnerabilities: vulnCounts,
      dependencies,
      signed: isSigned,
      openssfScore,
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
