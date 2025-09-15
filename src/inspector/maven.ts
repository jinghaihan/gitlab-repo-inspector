import type { ConfigOptions, GitlabRepo, InspectResult, Spinner } from '../types'
import * as p from '@clack/prompts'
import c from 'ansis'
import { XMLParser } from 'fast-xml-parser'
import { createPackageFilter } from '../filter'
import { readRepoFile } from '../gitlab'
import { normalizeRepo, normalizeVersion } from '../utils'

const parser = new XMLParser()

export async function inspectMavenMonorepo(spinner: Spinner, options: ConfigOptions, repo: GitlabRepo, tag?: string): Promise<InspectResult[] | undefined> {
  spinner.message(`Reading ${c.yellow`${repo.name}`} pom.xml...`)
  const content = await readRepoFile(options, repo, 'pom.xml', tag)
  if (!content)
    return

  const packageFilter = createPackageFilter(options)

  const parsed = parser.parse(content)
  const project = parsed.project
  if (!project)
    return

  const modules = project.modules?.module || []
  const modulesList = Array.isArray(modules) ? modules : (modules ? [modules] : [])

  const pkgs: InspectResult[] = []
  const readPom = async (dir: string) => {
    if (dir)
      spinner.message(`Reading pom.xml in ${c.yellow`${dir}`}...`)

    const path = dir ? `${dir}/pom.xml` : 'pom.xml'
    const pomXml = await readRepoFile(options, repo, path, tag)
    if (!pomXml)
      return

    try {
      const data = parser.parse(pomXml)
      const project = data.project
      if (!project)
        return

      const hasModules = project.modules?.module
      if (hasModules) {
        const modulesList = Array.isArray(hasModules) ? hasModules : (hasModules ? [hasModules] : [])
        for (const module of modulesList) {
          const modulePath = dir ? `${dir}/${module}` : module
          await readPom(modulePath)
        }
        return
      }

      if (!project.artifactId)
        return

      pkgs.push({
        name: project.artifactId,
        repo: normalizeRepo(`${repo.web_url}/${dir}`),
        repoId: repo.id,
        webUrl: repo.web_url,
        projectType: 'maven',
        description: project.description || project.name,
        tag,
        version: normalizeVersion(tag),
      })
    }
    catch (error) {
      p.log.error(`Failed to read pom.xml for ${path}`)
      console.error(error)
    }
  }

  if (!modulesList.length) {
    await readPom('')
    return pkgs
  }

  for (const module of modulesList) {
    try {
      await readPom(module)
    }
    catch (error) {
      p.log.error(`Failed to read pom.xml for ${module}`)
      console.error(error)
      continue
    }
  }

  return packageFilter(pkgs)
}
