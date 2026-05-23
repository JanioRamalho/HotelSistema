import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const defaultDatabasePath = join(__dirname, '..', '..', '..', '..', 'hoteis.db')
const databasePath = resolve(process.env.SQLITE_DATABASE_PATH || defaultDatabasePath)
const schemaPath = join(__dirname, '..', '..', '..', '..', 'infra', 'database', 'schema.sql')
const seedPath = join(__dirname, '..', '..', '..', '..', 'infra', 'database', 'seed-hotels.sql')

let database

function openDatabase() {
  if (!database) {
    database = new DatabaseSync(databasePath)
    database.exec('PRAGMA foreign_keys = ON;')
    database.exec('PRAGMA journal_mode = WAL;')
  }

  return database
}

export function initializeSQLiteDatabase() {
  const db = openDatabase()

  if (!existsSync(schemaPath)) {
    throw new Error(`Schema SQL nao encontrado em ${schemaPath}`)
  }

  db.exec(readFileSync(schemaPath, 'utf8'))

  if (existsSync(seedPath)) {
    db.exec(readFileSync(seedPath, 'utf8'))
  }
}

export function getSQLiteDatabasePath() {
  return databasePath
}

export function querySQLite(sql, params = []) {
  return openDatabase().prepare(sql).all(...params)
}

export function getSQLite(sql, params = []) {
  return openDatabase().prepare(sql).get(...params)
}
