/**
 * Para migrar para banco de dados:
 * 1. Implemente StorageAdapter em um novo arquivo (ex: database.ts)
 * 2. Substitua a linha abaixo pelo novo adapter
 * 3. A aplicação inteira funciona sem mais nenhuma alteração
 */
export { localStorageAdapter as storage } from "./local"
export type { Entrega, StorageAdapter, TipoVeiculo, StatusEntrega } from "./types"
