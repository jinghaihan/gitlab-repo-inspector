import type { ConfigOptions, GitlabGroup, GitlabRepo, GitlabRepoTag, GitlabRepoTree } from './types'
import process from 'node:process'
import * as p from '@clack/prompts'
import axios from 'axios'
import { createPreReleaseFilter, createRepoFilter } from './filter'
import { baseURL, retry } from './utils'

export async function getGroups(options: ConfigOptions): Promise<GitlabGroup | undefined> {
  const { token, group, subgroups } = options
  return await retry(async () => {
    const { data } = await axios.get<GitlabGroup[]>(
      `${baseURL(options)}/groups`,
      {
        params: {
          search: group,
          with_projects: subgroups,
        },
        headers: {
          'PRIVATE-TOKEN': token,
        },
      },
    )

    const i = data.find(i => i.name === group)
    if (!i && data.length) {
      p.log.error(`Group ${group} not found`)
      const result = await p.select({
        message: `Group ${group} not found, select one of the following groups`,
        options: data.map(i => ({
          label: i.name,
          value: i,
        })),
      })
      if (p.isCancel(result)) {
        p.outro('aborting...')
        process.exit(1)
      }
      return result
    }
    return i
  })
}

export async function getRepos(options: ConfigOptions): Promise<GitlabRepo[]> {
  const { token, subgroups } = options
  const gitlabGroup = await getGroups(options)
  if (!gitlabGroup) {
    return []
  }

  const filter = createRepoFilter(options)
  return await retry(async () => {
    const { data } = await axios.get<GitlabRepo[]>(
      `${baseURL(options)}/groups/${gitlabGroup.id}/projects`,
      {
        params: {
          include_subgroups: subgroups,
          per_page: 500,
        },
        headers: {
          'PRIVATE-TOKEN': token,
        },
      },
    )
    return filter(data)
  }) ?? []
}

export async function getRepoTags(options: ConfigOptions, repo: GitlabRepo) {
  const { token } = options
  const filter = createPreReleaseFilter(options)
  return await retry(async () => {
    const { data } = await axios.get<GitlabRepoTag[]>(
      `${baseURL(options)}/projects/${repo.id}/repository/tags`,
      {
        headers: {
          'PRIVATE-TOKEN': token,
        },
      },
    )
    if (options.preRelease)
      return data
    else
      return filter(data)
  }) ?? []
}

export async function readRepoFile(options: ConfigOptions, repo: GitlabRepo, path: string, tag?: string) {
  const { token } = options

  return await retry(async () => {
    const { data } = await axios.get(
      `${baseURL(options)}/projects/${repo.id}/repository/files/${encodeURIComponent(path)}/raw`,
      {
        params: {
          ref: tag,
        },
        headers: {
          'PRIVATE-TOKEN': token,
        },
      },
    )
    return data
  })
}

export async function getRepoTree(options: ConfigOptions, repo: GitlabRepo, path: string = '', tagOrBranch?: string) {
  const { token } = options

  return await retry(async () => {
    const { data } = await axios.get<GitlabRepoTree[]>(
      `${baseURL(options)}/projects/${repo.id}/repository/tree`,
      {
        params: {
          path,
          ref: tagOrBranch,
          per_page: 500,
        },
        headers: {
          'PRIVATE-TOKEN': token,
        },
      },
    )
    return data
  })
}
