import type { ConfigOptions, GitlabRepo, Inspector, InspectResult, RangeMode, Spinner } from '../types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { getRepos, getRepoTags } from '../gitlab'
import { getLatestTag, normalizeRepo, normalizeTag } from '../utils'
import { inspectMavenMonorepo } from './maven'
import { inspectPnpmMonorepo } from './pnpm'

export const inspectors: Record<RangeMode, Inspector> = {
  manifest: inspectManifest,
}

async function inspectMonorepo(spinner: Spinner, options: ConfigOptions, repo: GitlabRepo, tag?: string): Promise<InspectResult[] | undefined> {
  if (!options.projectType || options.projectType === 'pnpm') {
    const pnpm = await inspectPnpmMonorepo(spinner, options, repo, tag)
    if (pnpm) {
      return pnpm
    }
  }

  if (!options.projectType || options.projectType === 'maven') {
    const maven = await inspectMavenMonorepo(spinner, options, repo, tag)
    if (maven) {
      return maven
    }
  }
}

export async function inspectManifest(options: ConfigOptions) {
  const data: InspectResult[] = []
  const repos = await getRepos(options)
  if (!repos.length) {
    p.log.error('No repositories found')
    p.outro('aborting...')
    process.exit(1)
  }

  for (const repo of repos) {
    const spinner = p.spinner()
    spinner.start(`Inspecting ${c.yellow(repo.name)}...`)

    const tags = await getRepoTags(options, repo)
    const latestTag = getLatestTag(tags)
    if (!latestTag) {
      p.log.warn(`${c.yellow(repo.name)} has no tags`)
    }

    const setRepo = () => {
      data.push({
        name: repo.name,
        repo: normalizeRepo(repo.web_url),
        description: repo.description ?? '',
        tag: normalizeTag(latestTag?.name),
      })
    }

    if (options.monorepo) {
      spinner.message('Inspecting monorepo...')
      const pkgs = await inspectMonorepo(spinner, options, repo, latestTag?.name)
      if (pkgs?.length)
        data.push(...pkgs)
      else
        setRepo()
    }
    else {
      setRepo()
    }
    spinner.stop(`Inspected ${c.yellow(repo.name)}`)
  }

  return data.sort((a, b) => a.name.localeCompare(b.name))
}
