import { createContext, useContext } from 'react'

const AuthContext = createContext({})

// Anonymous user ID for development (consistent across sessions)
const ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000000'

// Mock user for development without authentication
const MOCK_USER = {
  id: ANONYMOUS_USER_ID,
  email: 'dev@perdia.local',
  user_metadata: {
    name: 'Developer',
  },
  app_metadata: {},
  aud: 'authenticated',
  role: 'authenticated',
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  // Always provide mock user - no authentication required
  const value = {
    user,
    loading,
    signIn: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      return data
    },
    signUp: async (email, password) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://perdiav5.netlify.app/',
        },
      })
      if (error) throw error
      return data
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
