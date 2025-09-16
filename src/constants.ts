export const MODE_CHOICES = ['manifest'] as const

export const DEFAULT_CONFIG_OPTIONS = {
  registry: 'https://gitlab.com',
  apiVersion: 'v4',
  perPage: 500,
  subgroups: true,
  archived: false,
  monorepo: true,
  preRelease: true,
  ignoreGroups: [],
  ignoreRepos: [],
  ignorePackages: [],
  ignorePatterns: [
    '.',
    'playground',
    'playground/*',
  ],
  json: 'gitlab-repo-inspector.json',
  merge: false,
}
