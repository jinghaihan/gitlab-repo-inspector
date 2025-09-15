import type { CommandOptions, ConfigOptions } from './types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { createConfigLoader } from 'unconfig'
import { DEFAULT_CONFIG_OPTIONS } from './constants'

function normalizeConfig(options: Partial<CommandOptions>) {
  // interop
  if ('default' in options)
    options = options.default as Partial<CommandOptions>

  return options
}

export async function resolveConfig(options: Partial<CommandOptions>): Promise<ConfigOptions> {
  const defaults = structuredClone(DEFAULT_CONFIG_OPTIONS)
  const config = normalizeConfig(options)

  const loader = createConfigLoader<CommandOptions>({
    sources: [
      { files: ['gitlab-repo-inspector.config'] },
    ],
    cwd: options.cwd || process.cwd(),
    merge: false,
  })
  const generator = await loader.load()
  const configOptions = generator.sources.length ? normalizeConfig(generator.config) : {}
  const merged = { ...defaults, ...configOptions, ...config }

  if (!merged.token) {
    const token = await p.text({
      message: 'Enter your Gitlab token:',
    })
    if (p.isCancel(token) || !token) {
      p.outro(c.red('Gitlab token is required'))
      process.exit(1)
    }
    merged.token = token
  }

  if (!merged.group) {
    const group = await p.text({
      message: 'Enter your Gitlab group:',
    })
    if (p.isCancel(group) || !group) {
      p.outro(c.red('Gitlab group is required'))
      process.exit(1)
    }
    merged.group = group
  }

  // default to manifest mode
  if (!merged.mode) {
    merged.mode = 'manifest'
  }

  // normalize ignore options
  if (typeof merged.ignoreGroups === 'string')
    merged.ignoreGroups = [merged.ignoreGroups]
  if (typeof merged.ignoreRepos === 'string')
    merged.ignoreRepos = [merged.ignoreRepos]
  if (typeof merged.ignorePackages === 'string')
    merged.ignorePackages = [merged.ignorePackages]

  return merged as unknown as ConfigOptions
}
