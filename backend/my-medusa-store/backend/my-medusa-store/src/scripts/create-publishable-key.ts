import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createApiKeysWorkflow, linkSalesChannelsToApiKeyWorkflow } from "@medusajs/medusa/core-flows"
import fs from "fs"
import path from "path"

export default async function createPublishableKey({ container }: ExecArgs) {
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)

  console.log("🔐 Creating publishable API key and linking to Default Sales Channel (if present)...")

  const { result: apiKeys } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: "Webshop Frontend",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  })

  const key = apiKeys?.[0]
  if (!key) {
    console.error("❌ Failed to create publishable API key")
    return
  }

  // token is only available on creation
  if (key.token) {
    console.log(`✅ Publishable key created. Save this token now:`)
    console.log(`PUBLISHABLE_KEY=${key.token}`)
    // Persist key to backend .env and frontend .env.local for local development
    try {
      const repoRoot = process.cwd()
      const backendEnv = path.join(repoRoot, '..', '.env') // medusa root .env
      const backendLine = `MEDUSA_PUBLISHABLE_KEY=${key.token}\n`
      try { fs.appendFileSync(backendEnv, backendLine) } catch { /* ignore write errors */ }

      const frontendEnv = path.join(repoRoot, '..', '..', 'frontend', 'markasouq-web', '.env.local')
      const frontLine = `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${key.token}\n`
      try { fs.appendFileSync(frontendEnv, frontLine) } catch { /* ignore write errors */ }
    } catch (err) {
      console.warn('Failed to persist publishable key to .env files:', err)
    }
  } else {
    console.log(`ℹ️ Key created with id ${key.id}, but token not returned.`)
  }

  // Link to Default Sales Channel if exists
  const channels = await salesChannelModuleService.listSalesChannels({ name: "Default Sales Channel" })
  if (channels.length) {
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: {
        id: key.id,
        add: [channels[0].id],
      },
    })
    console.log(`🔗 Linked key to sales channel: ${channels[0].name}`)
  } else {
    console.log("ℹ️ No Default Sales Channel found to link. You can link it later in Admin.")
  }

  console.log("✅ Done.")
}
