import type { ConfigOptions, GitlabRepo, ProjectType, Spinner } from '../types'
import c from 'ansis'
import { getRepoTree } from '../gitlab'

export async function inferenceProjectType(spinner: Spinner, options: ConfigOptions, repo: Pick<GitlabRepo, 'id' | 'name'>, tagOrBranch?: string): Promise<ProjectType | undefined> {
  spinner.message(`Inferring project type for ${c.yellow(repo.name)}...`)
  if (await isPnpmProject(options, repo, tagOrBranch))
    return 'pnpm'
  if (await isMavenProject(options, repo, tagOrBranch))
    return 'maven'
  if (await isNpmProject(options, repo, tagOrBranch))
    return 'npm'
  if (await isYarnProject(options, repo, tagOrBranch))
    return 'yarn'
}

export async function isNpmProject(options: ConfigOptions, repo: Pick<GitlabRepo, 'id'>, tagOrBranch?: string) {
  const tree = await getRepoTree(options, repo, '', tagOrBranch)
  if (!tree)
    return false
  return !!tree.find(i => i.path === 'package-lock.json')
}

export async function isYarnProject(options: ConfigOptions, repo: Pick<GitlabRepo, 'id'>, tagOrBranch?: string) {
  const tree = await getRepoTree(options, repo, '', tagOrBranch)
  if (!tree)
    return false
  return !!tree.find(i => i.path === 'yarn.lock')
}

export async function isPnpmProject(options: ConfigOptions, repo: Pick<GitlabRepo, 'id'>, tagOrBranch?: string) {
  const tree = await getRepoTree(options, repo, '', tagOrBranch)
  if (!tree)
    return false
  return !!tree.find(i => i.path === 'pnpm-lock.yaml' || i.path === 'pnpm-workspace.yaml')
}

export async function isMavenProject(options: ConfigOptions, repo: Pick<GitlabRepo, 'id'>, tagOrBranch?: string) {
  const tree = await getRepoTree(options, repo, '', tagOrBranch)
  if (!tree)
    return false
  return !!tree.find(i => i.path === 'pom.xml')
}
