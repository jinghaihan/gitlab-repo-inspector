export const MODE_CHOICES = ['manifest'] as const

export const DEFAULT_CONFIG_OPTIONS = {
  registry: 'https://gitlab.com',
  apiVersion: 'v4',
  subgroups: true,
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
}
