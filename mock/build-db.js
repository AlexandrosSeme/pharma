import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, basename } from 'node:path'

const dataDir = 'mock/data'
const db = {}

for (const file of readdirSync(dataDir).filter((f) => f.endsWith('.json'))) {
  db[basename(file, '.json')] = JSON.parse(readFileSync(join(dataDir, file), 'utf-8'))
}

writeFileSync('db.json', JSON.stringify(db, null, 2))
console.log(`db.json built from: ${Object.keys(db).join(', ')}`)
