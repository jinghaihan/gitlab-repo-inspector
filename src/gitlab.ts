import type { ConfigOptions, GitlabGroup, GitlabRepo, GitlabRepoTag, GitlabRepoTree } from './types'
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

    return data.find(i => i.name === group)
  })
}

export async function getRepos(options: ConfigOptions): Promise<GitlabRepo[]> {
  const { token, group, subgroups } = options
  const gitlabGroup = await getGroups(options)
  if (!gitlabGroup) {
    throw new Error(`Group ${group} not found`)
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
