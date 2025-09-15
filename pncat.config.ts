import { defineConfig, mergeCatalogRules } from 'pncat'

export default defineConfig({
  catalogRules: mergeCatalogRules([
    {
      name: 'parser',
      match: ['yaml', 'fast-xml-parser'],
    },
  ]),
})
