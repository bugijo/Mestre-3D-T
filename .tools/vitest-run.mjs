import { startVitest } from 'vitest/node'

const filters = process.argv.slice(2).filter((argument) => !argument.startsWith('--'))
const coverage = process.argv.includes('--coverage')
const options = { run: true }
if (coverage) options.coverage = { enabled: true }
const context = await startVitest('test', filters, options)

if (!context) process.exitCode = 1
