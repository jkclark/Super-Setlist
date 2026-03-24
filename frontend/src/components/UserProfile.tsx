import type { User } from "@ts-monorepo/common"
import { formatUser, isValidEmail } from "@ts-monorepo/common"
import React, { useEffect, useState } from "react"

const defaultUser: User = {
  id: "1",
  name: "John Doe",
  email: "john@example.com",
}

export const UserProfile: React.FC = () => {
  const [user, setUser] = useState<User>(defaultUser)
  const [formattedUser, setFormattedUser] = useState<string>("")
  const [isEmailValid, setIsEmailValid] = useState<boolean>(true)

  useEffect(() => {
    setFormattedUser(formatUser(user))
    setIsEmailValid(isValidEmail(user.email))
  }, [user])

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setUser((prev) => ({
      ...prev,
      email: newEmail,
    }))
  }

  return (
    <div className="bg-base-300 max-w-md rounded-lg p-3">
      <h2>User Profile</h2>
      <div>
        <p>
          <strong>ID:</strong> {user.id}
        </p>
        <p>
          <strong>Name:</strong> {user.name}
        </p>
        <div>
          <label htmlFor="email">
            <strong>Email:</strong>
          </label>
          <input
            id="email"
            type="email"
            value={user.email}
            onChange={handleEmailChange}
          />
          {!isEmailValid && <p>Please enter a valid email address</p>}
        </div>
      </div>
      <div>
        <strong>Formatted User:</strong> {formattedUser}
      </div>
      <div>{isEmailValid ? "✓ Email is valid" : "✗ Invalid email format"}</div>
    </div>
  )
}

export default UserProfile
