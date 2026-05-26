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

const translatedTables = [
  'transacoes_carteira',
  'favoritos',
  'carteiras',
  'reservas',
  'avaliacoes',
  'quartos_comodidades',
  'imagens_quarto',
  'quartos',
  'hoteis_comodidades',
  'comodidades',
  'imagens_hotel',
  'verificacoes_email',
  'usuarios',
  'hoteis',
]

const translatedIndexes = [
  'idx_hoteis_cidade_estado',
  'idx_hoteis_preco_inicial',
  'idx_hoteis_nota',
  'idx_hoteis_estrelas',
  'idx_hoteis_localizacao',
  'idx_imagens_hotel_hotel',
  'idx_quartos_hotel',
  'idx_quartos_capacidade',
  'idx_imagens_quarto_quarto',
  'idx_avaliacoes_hotel',
  'idx_verificacoes_email_usuario',
  'idx_reservas_usuario',
  'idx_reservas_quarto_datas',
  'idx_transacoes_carteira_usuario',
]

function tableExists(db, tableName) {
  return Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName))
}

function tableHasColumn(db, tableName, columnName) {
  return db.prepare(`PRAGMA table_info(${tableName})`).all().some((column) => column.name === columnName)
}

function prepareTranslatedSchema(db) {
  if (!tableExists(db, 'hoteis') || tableHasColumn(db, 'hoteis', 'estado')) return

  const suffix = Date.now()
  db.exec('PRAGMA foreign_keys = OFF;')

  translatedIndexes.forEach((indexName) => {
    db.exec(`DROP INDEX IF EXISTS ${indexName};`)
  })

  translatedTables.forEach((tableName) => {
    if (tableExists(db, tableName)) {
      db.exec(`ALTER TABLE ${tableName} RENAME TO ${tableName}_legado_${suffix};`)
    }
  })

  db.exec('PRAGMA foreign_keys = ON;')
}

function openDatabase() {
  if (!database) {
    database = new DatabaseSync(databasePath)
    database.exec('PRAGMA foreign_keys = ON;')
    database.exec('PRAGMA journal_mode = WAL;')
    database.exec('PRAGMA busy_timeout = 5000;')
  }

  return database
}

function waitForMs(ms) {
  const buffer = new SharedArrayBuffer(4)
  const view = new Int32Array(buffer)
  Atomics.wait(view, 0, 0, ms)
}

function isDatabaseLocked(error) {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('database is locked')
}

export function initializeSQLiteDatabase() {
  if (!existsSync(schemaPath)) {
    throw new Error(`Schema SQL nao encontrado em ${schemaPath}`)
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const db = openDatabase()

    try {
      db.exec('BEGIN IMMEDIATE;')
      prepareTranslatedSchema(db)
      db.exec(readFileSync(schemaPath, 'utf8'))

      if (existsSync(seedPath)) {
        db.exec(readFileSync(seedPath, 'utf8'))
      }

      db.exec('COMMIT;')
      return
    } catch (error) {
      try {
        db.exec('ROLLBACK;')
      } catch {
        // ignore rollback errors once the lock has been released
      }

      if (!isDatabaseLocked(error) || attempt === 4) {
        throw error
      }

      waitForMs(250 * (attempt + 1))
    }
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

export function runSQLite(sql, params = []) {
  return openDatabase().prepare(sql).run(...params)
}

export function execSQLite(sql) {
  return openDatabase().exec(sql)
}
