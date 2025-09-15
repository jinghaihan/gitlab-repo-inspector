import type { ConfigOptions, GitlabRepoTag } from './types'

export function baseURL(options: ConfigOptions) {
  const { registry, apiVersion } = options
  return `${registry}/api/${apiVersion}`
}

export async function retry<T>(fn: () => Promise<T>, maxAttempts: number = 10, delay: number = 300): Promise<T | undefined> {
  let attempts: number = 0
  while (attempts < maxAttempts) {
    try {
      return await fn()
    }
    catch {
      attempts++
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

export function normalizeVersion(tag?: string) {
  if (!tag)
    return
  return tag.replace(/^v/, '')
}

export function normalizeRepo(repo: string) {
  return repo.endsWith('/') ? repo.slice(0, -1) : repo
}

export function getLatestTag(tags: GitlabRepoTag[]) {
  return tags.sort((a, b) => new Date(b.commit.committed_date).getTime() - new Date(a.commit.committed_date).getTime())[0]
}
