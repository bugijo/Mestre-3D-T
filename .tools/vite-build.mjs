import { build } from 'vite'

// Forward --mode <name> so the right .env.<mode> file is loaded (e.g. mobile)
const modeIndex = process.argv.indexOf('--mode')
const mode = modeIndex >= 0 ? process.argv[modeIndex + 1] : undefined

await build({ mode })
