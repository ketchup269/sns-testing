import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const settings = await prisma.automationSettings.findMany()
  console.log("--- Automation Settings ---")
  console.log(JSON.stringify(settings, null, 2))

  const events = await prisma.automationEvent.findMany()
  console.log("--- Automation Events ---")
  console.log(JSON.stringify(events, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
