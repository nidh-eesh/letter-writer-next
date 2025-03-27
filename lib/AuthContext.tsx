"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth"
import { auth, provider } from "./firebase"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const router = useRouter()

  // Verify session on mount and when user changes
  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await fetch('/api/auth/verify')
        if (!response.ok) {
          // If session is invalid, sign out
          await signOut(auth)
          setUser(null)
          router.push('/')
        }
      } catch (error) {
        console.error('Session verification failed:', error)
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        try {
          // Create session first
          const idToken = await currentUser.getIdToken()
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
          })
          // Then verify it
          await verifySession()
        } catch (error) {
          console.error('Session setup failed:', error)
          await signOut(auth)
          setUser(null)
          router.push('/')
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const login = async () => {
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, provider)
      // Wait for the session to be created and verified
      const idToken = await result.user.getIdToken()
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      })
      // Verify the session
      const verifyResponse = await fetch('/api/auth/verify')
      if (verifyResponse.ok) {
        router.push('/dashboard')
      } else {
        throw new Error('Session verification failed')
      }
    } catch (error) {
      console.error("Login Failed:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await signOut(auth)
      await fetch('/api/auth/session', { method: 'DELETE' })
      router.push('/')
    } catch (error) {
      console.error("Logout Failed:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
