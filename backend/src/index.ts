import type { User } from "@ts-monorepo/common"
import { formatUser, isValidEmail } from "@ts-monorepo/common"

export function processUser(user: User): {
  formatted: string
  validEmail: boolean
} {
  const validEmail = isValidEmail(user.email)
  const formatted = formatUser(user)

  return {
    formatted,
    validEmail,
  }
}

if (require.main === module) {
  const demoUser: User = {
    id: "1",
    name: "Ada Lovelace",
    email: "ada@example.com",
  }

  const result = processUser(demoUser)
  console.log(result)
}
