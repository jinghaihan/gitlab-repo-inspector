import type { CommandOptions } from './types'

export * from './config'
export * from './gitlab'
export * from './inspector'
export * from './types'

export function defineConfig(config: Partial<CommandOptions>) {
  return config
}
