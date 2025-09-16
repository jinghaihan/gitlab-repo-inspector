import type { MODE_CHOICES } from './constants'

export type RangeMode = (typeof MODE_CHOICES)[number]

export type Inspector = (options: ConfigOptions) => Promise<InspectResult[]>

export interface Spinner {
  start: (msg?: string) => void
  stop: (msg?: string, code?: number) => void
  message: (msg?: string) => void
}

export type ProjectType = 'pnpm' | 'maven' | 'npm' | 'yarn'

export interface CommandOptions {
  mode?: RangeMode
  cwd?: string
  registry?: string
  apiVersion?: string
  projectType?: ProjectType
  token?: string
  perPage?: number
  group?: string
  subgroups?: boolean
  archived?: boolean
  monorepo?: boolean
  preRelease?: boolean
  ignoreGroups?: string[]
  ignoreRepos?: string[]
  ignorePackages?: string[]
  ignorePatterns?: string[]
  json?: string
  merge?: boolean
}

export type ConfigOptions = Required<CommandOptions>

export interface GitlabGroup {
  id: number
  name: string
  path: string
  description?: string
  full_name: string
  full_path: string
}

export interface GitlabRepo {
  id: number
  name: string
  path: string
  archived: boolean
  visibility: 'public' | 'internal' | 'private'
  description?: string
  web_url: string
  namespace: {
    id: number
    name: string
    path: string
    kind: string
    full_path: string
  }
}

export interface GitlabRepoTag {
  name: string
  message: string
  target: string
  commit: {
    id: string
    created_at: string
    title: string
    committed_date: string
  }
}

export interface GitlabRepoTree {
  id: string
  name: string
  type: string
  path: string
  mode: string
}

export interface InspectResult {
  name: string
  repo?: string
  repoId?: number
  webUrl?: string
  projectType?: ProjectType
  description?: string
  tag?: string
  version?: string
}
