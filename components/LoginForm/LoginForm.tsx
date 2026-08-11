"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/heists")
    } catch {
      setError("Invalid email or password")
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm text-body">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-lighter border border-lighter rounded-md px-3 py-2 text-heading focus:outline-none focus:border-primary"
          placeholder="you@example.com"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm text-body">Password</label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-lighter border border-lighter rounded-md px-3 py-2 pr-10 text-heading focus:outline-none focus:border-primary"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-body hover:text-heading"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 bg-primary text-dark font-semibold rounded-md px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isSubmitting ? "Logging in…" : "Login"}
      </button>

      <p className="text-center text-sm text-body">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary hover:underline">Sign Up</Link>
      </p>
    </form>
  )
}
