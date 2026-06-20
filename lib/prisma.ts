import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './prisma-client/client'
import { getCached } from './redis'

const connectionString = `${process.env.DATABASE_URL}`

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

import { encrypt, decrypt } from './encryption'

const encryptAccountData = (data: any) => {
  if (!data) return
  if (typeof data.access_token === 'string') data.access_token = encrypt(data.access_token)
  if (typeof data.refresh_token === 'string') data.refresh_token = encrypt(data.refresh_token)
  if (typeof data.id_token === 'string') data.id_token = encrypt(data.id_token)
}

const encryptConnectedAccountData = (data: any) => {
  if (!data) return
  if (typeof data.pageAccessToken === 'string') data.pageAccessToken = encrypt(data.pageAccessToken)
  if (typeof data.longLivedUserToken === 'string') data.longLivedUserToken = encrypt(data.longLivedUserToken)
}

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter })
    .$extends({
      query: {
        account: {
          async $allOperations({ operation, args, query }) {
            const typedArgs = args as any
            if (['create', 'update'].includes(operation) && typedArgs.data) {
              encryptAccountData(typedArgs.data)
            }
            if (operation === 'upsert') {
              encryptAccountData(typedArgs.create)
              encryptAccountData(typedArgs.update)
            }
            if (operation === 'createMany' && Array.isArray(typedArgs.data)) {
              typedArgs.data.forEach(encryptAccountData)
            }
            return query(args)
          }
        },
        connectedAccount: {
          async $allOperations({ operation, args, query }) {
            const typedArgs = args as any
            if (['create', 'update'].includes(operation) && typedArgs.data) {
              encryptConnectedAccountData(typedArgs.data)
            }
            if (operation === 'upsert') {
              encryptConnectedAccountData(typedArgs.create)
              encryptConnectedAccountData(typedArgs.update)
            }
            if (operation === 'createMany' && Array.isArray(typedArgs.data)) {
              typedArgs.data.forEach(encryptConnectedAccountData)
            }
            return query(args)
          }
        }
      },
      result: {
        account: {
          access_token: { needs: { access_token: true }, compute(model) { return decrypt(model.access_token) } },
          refresh_token: { needs: { refresh_token: true }, compute(model) { return decrypt(model.refresh_token) } },
          id_token: { needs: { id_token: true }, compute(model) { return decrypt(model.id_token) } },
        },
        connectedAccount: {
          pageAccessToken: { needs: { pageAccessToken: true }, compute(model) { return decrypt(model.pageAccessToken) } },
          longLivedUserToken: { needs: { longLivedUserToken: true }, compute(model) { return decrypt(model.longLivedUserToken) } },
        }
      }
    })
    .$extends({
      query: {
        $allModels: {
          async findUnique({ model, operation, args, query }) {
            const key = `db:${model}:${operation}:${JSON.stringify(args)}`
            return getCached(key, () => query(args), 60)
          },
          async findFirst({ model, operation, args, query }) {
            const key = `db:${model}:${operation}:${JSON.stringify(args)}`
            return getCached(key, () => query(args), 60)
          },
          async findMany({ model, operation, args, query }) {
            const key = `db:${model}:${operation}:${JSON.stringify(args)}`
            return getCached(key, () => query(args), 60)
          },
        },
      },
    })
}

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
