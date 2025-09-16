import type { CAC } from 'cac'
import type { CommandOptions, RangeMode } from './types'
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { cac } from 'cac'
import { join } from 'pathe'
import { name, version } from '../package.json'
import { resolveConfig } from './config'
import { MODE_CHOICES } from './constants'
import { inspectors } from './inspector'

try {
  const cli: CAC = cac(name)

  cli
    .command('[mode]', 'Inspect Gitlab repositories')
    .option('--cwd <cwd>', 'Current working directory')
    .option('--registry <registry>', 'Registry URL')
    .option('--api-version <apiVersion>', 'API version')
    .option('--project-type <projectType>', 'Project type (pnpm or maven)')
    .option('--token <token>', 'Gitlab token')
    .option('--per-page <perPage>', 'Number of repositories per page')
    .option('--group <group>', 'Gitlab group')
    .option('--subgroups', 'Include subgroups')
    .option('--archived', 'Include archived repositories')
    .option('--monorepo', 'Enable monorepo mode')
    .option('--pre-release', 'Include pre-release versions')
    .option('--ignore-groups <groups>', 'Ignore groups')
    .option('--ignore-repos <repos>', 'Ignore repositories')
    .option('--ignore-packages <packages>', 'Ignore packages')
    .option('--ignore-patterns <patterns>', 'Ignore monorepo patterns')
    .option('--json <json>', 'Output json file')
    .option('--merge', 'Merge json file')
    .action(async (mode: RangeMode, options: CommandOptions) => {
      if (mode) {
        if (!MODE_CHOICES.includes(mode)) {
          console.error(`Invalid mode: ${mode}. Please use one of the following: ${MODE_CHOICES.join('|')}`)
          process.exit(1)
        }
        options.mode = mode
      }

      p.intro(`${c.yellow`${name} `}${c.dim`v${version}`}`)
      const config = await resolveConfig(options)
      const inspector = inspectors[config.mode]
      const result = await inspector(config)

      const path = join(config.cwd, config.json)
      if (config.merge) {
        if (existsSync(path)) {
          const content = await readFile(path, 'utf-8')
          const data = JSON.parse(content)
          result.push(...data)
        }
      }

      await writeFile(path, JSON.stringify(result, null, 2))
      p.outro(`${c.green`Inspect completed, saved to ${c.yellow`gitlab-repo-inspector.json`}`}`)
    })

  cli.help()
  cli.version(version)
  cli.parse()
}
catch (error) {
  console.error(error)
  process.exit(1)
}
