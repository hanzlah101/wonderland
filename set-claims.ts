// biome-ignore-all lint: not needed
// @ts-nocheck

import { initializeApp, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import serviceAccount from "./service-account.json" with { type: "json" }

initializeApp({
  credential: cert(serviceAccount)
})

async function setAdmin(uid: string) {
  try {
    await getAuth().setCustomUserClaims(uid, { role: "admin" })
    console.log(`✅ Set user ${uid} as admin`)
    process.exit(0)
  } catch (err) {
    console.error("❌ Error setting admin:", err)
    process.exit(1)
  }
}

setAdmin("uLCbPRSqprXyUGEwJ0kl5gs9c6H2")
