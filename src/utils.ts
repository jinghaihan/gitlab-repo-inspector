import type { ConfigOptions, GitlabRepoTag } from './types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'

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
    catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          p.outro(`${c.red('401')}: please check your token or registry`)
          process.exit(1)
        }
      }
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
