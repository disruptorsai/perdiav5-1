/**
 * Article Editing Lock Hook
 * Manages concurrent editing prevention (F-06)
 *
 * Features:
 * - Acquire lock when entering editor
 * - Auto-extend lock while editing
 * - Release lock on navigation/close
 * - Visual indicator of who is editing
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'

const LOCK_DURATION_MINUTES = 30
const LOCK_EXTEND_INTERVAL_MS = 15 * 60 * 1000 // 15 minutes

/**
 * Check if an article is currently locked
 */
export function useArticleLockStatus(articleId) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['article-lock', articleId],
    queryFn: async () => {
      if (!articleId) return null

      try {
        const { data, error } = await supabase
          .from('articles')
          .select('editing_locked_by, editing_locked_at, editing_lock_expires_at')
          .eq('id', articleId)
          .single()

        // If columns don't exist yet (migration not run), return unlocked state
        if (error) {
          console.warn('Article lock query failed (columns may not exist):', error.message)
          return {
            isLocked: false,
            lockedBy: null,
            lockedByEmail: null,
            lockedAt: null,
            expiresAt: null,
            isOwnLock: false,
          }
        }

        // Check if lock is active (not expired)
        if (data?.editing_locked_by && data?.editing_lock_expires_at) {
          const expiresAt = new Date(data.editing_lock_expires_at)
          if (expiresAt > new Date()) {
            return {
              isLocked: true,
              lockedBy: data.editing_locked_by,
              lockedByEmail: 'Another user', // Skip auth.users lookup - not accessible via REST
              lockedAt: new Date(data.editing_locked_at),
              expiresAt: expiresAt,
              isOwnLock: data.editing_locked_by === user?.id,
            }
          }
        }

        return {
          isLocked: false,
          lockedBy: null,
          lockedByEmail: null,
          lockedAt: null,
          expiresAt: null,
          isOwnLock: false,
        }
      } catch (err) {
        console.warn('Article lock check failed:', err)
        return {
          isLocked: false,
          lockedBy: null,
          lockedByEmail: null,
          lockedAt: null,
          expiresAt: null,
          isOwnLock: false,
        }
      }
    },
    enabled: !!articleId && !!user,
    refetchInterval: 30000, // Check every 30 seconds
  })
}

/**
 * Acquire an editing lock on an article
 */
export function useAcquireLock() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (articleId) => {
      try {
        const { data, error } = await supabase
          .rpc('acquire_article_lock', {
            p_article_id: articleId,
            p_user_id: user.id,
            p_lock_duration_minutes: LOCK_DURATION_MINUTES,
          })

        // If RPC function doesn't exist, gracefully return success
        if (error) {
          console.warn('acquire_article_lock RPC failed (function may not exist):', error.message)
          return { success: true, message: 'Lock feature not available' }
        }

        const result = data?.[0]
        if (!result?.success) {
          throw new Error(result?.message || 'Failed to acquire lock')
        }

        return result
      } catch (err) {
        console.warn('acquire_article_lock failed:', err)
        return { success: true, message: 'Lock feature not available' }
      }
    },
    onSuccess: (_, articleId) => {
      queryClient.invalidateQueries({ queryKey: ['article-lock', articleId] })
    },
  })
}

/**
 * Release an editing lock
 */
export function useReleaseLock() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (articleId) => {
      try {
        const { data, error } = await supabase
          .rpc('release_article_lock', {
            p_article_id: articleId,
            p_user_id: user.id,
          })

        // If RPC function doesn't exist, gracefully return
        if (error) {
          console.warn('release_article_lock RPC failed (function may not exist):', error.message)
          return { success: true }
        }
        return data?.[0]
      } catch (err) {
        console.warn('release_article_lock failed:', err)
        return { success: true }
      }
    },
    onSuccess: (_, articleId) => {
      queryClient.invalidateQueries({ queryKey: ['article-lock', articleId] })
    },
  })
}

/**
 * Extend an editing lock
 */
export function useExtendLock() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (articleId) => {
      try {
        const { data, error } = await supabase
          .rpc('extend_article_lock', {
            p_article_id: articleId,
            p_user_id: user.id,
            p_additional_minutes: 15,
          })

        // If RPC function doesn't exist, gracefully return
        if (error) {
          console.warn('extend_article_lock RPC failed (function may not exist):', error.message)
          return { success: true }
        }
        return data?.[0]
      } catch (err) {
        console.warn('extend_article_lock failed:', err)
        return { success: true }
      }
    },
    onSuccess: (_, articleId) => {
      queryClient.invalidateQueries({ queryKey: ['article-lock', articleId] })
    },
  })
}

/**
 * Complete hook for managing article editing with automatic lock management
 *
 * Usage:
 * const { lockStatus, hasLock, acquireLock, releaseLock, lockError } = useArticleEditing(articleId)
 */
export function useArticleEditing(articleId) {
  const { user } = useAuth()
  const [lockError, setLockError] = useState(null)
  const extendIntervalRef = useRef(null)

  const { data: lockStatus, isLoading: isCheckingLock } = useArticleLockStatus(articleId)
  const acquireLockMutation = useAcquireLock()
  const releaseLockMutation = useReleaseLock()
  const extendLockMutation = useExtendLock()

  // Check if we have the lock
  const hasLock = lockStatus?.isOwnLock || false

  // Acquire lock
  const acquireLock = useCallback(async () => {
    if (!articleId || !user) return false

    try {
      setLockError(null)
      await acquireLockMutation.mutateAsync(articleId)
      return true
    } catch (error) {
      setLockError(error.message)
      return false
    }
  }, [articleId, user, acquireLockMutation])

  // Release lock
  const releaseLock = useCallback(async () => {
    if (!articleId || !user) return

    try {
      await releaseLockMutation.mutateAsync(articleId)
    } catch (error) {
      console.error('Failed to release lock:', error)
    }
  }, [articleId, user, releaseLockMutation])

  // Force take lock (for admins/override)
  const forceTakeLock = useCallback(async () => {
    if (!articleId || !user) return false

    try {
      // First release any existing lock (ignoring errors)
      await supabase
        .from('articles')
        .update({
          editing_locked_by: null,
          editing_locked_at: null,
          editing_lock_expires_at: null,
        })
        .eq('id', articleId)

      // Then acquire our lock
      return await acquireLock()
    } catch (error) {
      setLockError(error.message)
      return false
    }
  }, [articleId, user, acquireLock])

  // Auto-extend lock while editing
  useEffect(() => {
    if (hasLock && articleId) {
      extendIntervalRef.current = setInterval(() => {
        extendLockMutation.mutate(articleId)
      }, LOCK_EXTEND_INTERVAL_MS)
    }

    return () => {
      if (extendIntervalRef.current) {
        clearInterval(extendIntervalRef.current)
      }
    }
  }, [hasLock, articleId, extendLockMutation])

  // Release lock on unmount (with beforeunload for browser close)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasLock && articleId) {
        // Use sendBeacon for reliability on page close
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/release_article_lock`,
          JSON.stringify({
            p_article_id: articleId,
            p_user_id: user?.id,
          })
        )
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Release lock on component unmount
      if (hasLock && articleId) {
        releaseLock()
      }
    }
  }, [hasLock, articleId, user, releaseLock])

  return {
    lockStatus,
    hasLock,
    isCheckingLock,
    lockError,
    acquireLock,
    releaseLock,
    forceTakeLock,
    isAcquiringLock: acquireLockMutation.isPending,
    isReleasingLock: releaseLockMutation.isPending,
  }
}

export default useArticleEditing
