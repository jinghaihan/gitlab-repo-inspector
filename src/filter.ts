import type { ConfigOptions, GitlabRepo, GitlabRepoTag, InspectResult } from './types'
import { prerelease } from 'semver'

export function createRepoFilter(options: ConfigOptions) {
  return (data: GitlabRepo[]) => data
    .filter(i => !options.ignoreRepos?.includes(i.path))
    .filter(i => !options.ignoreGroups?.includes(i.namespace.name))
    .filter(i => options.archived ? true : !i.archived)
}

export function createPreReleaseFilter(options: ConfigOptions) {
  return (data: GitlabRepoTag[]) => data
    .filter(i => options.preRelease ? true : !prerelease(i.name))
}

export function createPatternFilter(options: ConfigOptions) {
  return (data: string[]) => data
    .filter(i => !options.ignorePatterns.includes(i))
}

export function createPackageFilter(options: ConfigOptions) {
  return (data: InspectResult[]) => data
    .filter(i => !options.ignorePackages.includes(i.name))
}
