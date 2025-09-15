import type { ConfigOptions, GitlabRepo, InspectResult, Spinner } from '../types'
import * as p from '@clack/prompts'
import c from 'ansis'
import { parse } from 'yaml'
import { createPackageFilter, createPatternFilter } from '../filter'
import { getRepoTree, readRepoFile } from '../gitlab'
import { normalizeRepo, normalizeVersion } from '../utils'

export async function inspectPnpmMonorepo(spinner: Spinner, options: ConfigOptions, repo: GitlabRepo, tag?: string): Promise<InspectResult[] | undefined> {
  spinner.message(`Reading ${c.yellow`${repo.name}`} pnpm-workspace.yaml...`)
  const content = await readRepoFile(options, repo, 'pnpm-workspace.yaml', tag)
  if (!content)
    return

  const patternFilter = createPatternFilter(options)
  const packageFilter = createPackageFilter(options)

  const parsed = parse(content)
  const packages = patternFilter(parsed.packages)

  const pkgs: InspectResult[] = []
  let hasSub = false

  const readPackage = async (dir: string) => {
    if (dir)
      spinner.message(`Reading package.json in ${c.yellow`${dir}`}...`)

    const path = dir ? `${dir}/package.json` : 'package.json'
    const pkgJson = await readRepoFile(options, repo, path, tag)
    if (!pkgJson)
      return

    try {
      const data = typeof pkgJson === 'string' ? JSON.parse(pkgJson) : pkgJson
      if (data.private === true)
        return

      hasSub = true
      pkgs.push({
        name: data.name,
        repo: normalizeRepo(`${repo.web_url}/${dir}`),
        repoId: repo.id,
        webUrl: repo.web_url,
        projectType: 'pnpm',
        description: data.description,
        tag,
        version: normalizeVersion(tag),
      })
      return true
    }
    catch (error) {
      p.log.error(`Failed to read package.json for ${path}`)
      console.error(error)
    }
  }

  if (!packages.length) {
    await readPackage('')
    return pkgs
  }

  for (const pattern of packages) {
    try {
      if (pattern.endsWith('/*')) {
        const baseDir = pattern.replace('/*', '')
        if (!baseDir)
          continue

        spinner.message(`Reading ${c.yellow`${repo.name}`}'s tree in ${c.yellow`${baseDir}`}...`)
        const tree = await getRepoTree(options, repo, baseDir, tag)
        const subDirs = tree?.filter(item => item.type === 'tree')
        if (!subDirs)
          continue

        for (const dir of subDirs) {
          await readPackage(dir.path)
        }
      }
      else {
        await readPackage(pattern)
      }
    }
    catch (error) {
      p.log.error(`Failed to read package.json for ${pattern}`)
      console.error(error)
      continue
    }
  }

  if (!hasSub || parsed.packages.includes('.')) {
    await readPackage('')
  }

  return packageFilter(pkgs)
}
