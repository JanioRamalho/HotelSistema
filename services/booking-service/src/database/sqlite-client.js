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

export function db() {
  if (!database) {
    database = new DatabaseSync(databasePath)
    database.exec('PRAGMA foreign_keys = ON;')
    database.exec('PRAGMA journal_mode = WAL;')

    if (!existsSync(schemaPath)) {
      throw new Error(`Schema SQL nao encontrado em ${schemaPath}`)
    }

    prepareTranslatedSchema(database)
    database.exec(readFileSync(schemaPath, 'utf8'))
    if (existsSync(seedPath)) {
      database.exec(readFileSync(seedPath, 'utf8'))
    }
  }

  return database
}

export function databaseInfo() {
  return { databasePath }
}
