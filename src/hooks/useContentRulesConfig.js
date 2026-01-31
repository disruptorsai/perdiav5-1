import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * Content Rules Configuration Hooks
 *
 * Manage content generation rules with version history
 * Allows Tony to edit rules, track changes, and restore previous versions
 */

// Default empty config structure for fallback
const DEFAULT_CONFIG = {
  hard_rules: {
    authors: { approved_authors: [], require_author_assignment: true, enforce_approved_only: true },
    links: { blocked_domains: [], blocked_patterns: [], block_edu_links: true, block_competitor_links: true },
    external_sources: { allowed_domains: [], require_whitelist: true },
    monetization: { require_monetization_shortcode: true, block_unknown_shortcodes: true, block_legacy_shortcodes: true },
    publishing: { require_human_review: true, block_high_risk: true, block_critical_risk: true },
  },
  guidelines: {
    word_count: { minimum: 1500, target: 2000, maximum: 2500 },
    structure: { min_h2_headings: 3, max_h2_headings: 8 },
    faqs: { minimum: 3, target: 5 },
    links: { internal_links_min: 3, internal_links_target: 5, external_citations_min: 2 },
    quality: { minimum_score_to_publish: 70, minimum_score_auto_publish: 80, target_score: 85 },
  },
  tone_voice: {
    overall_style: { tone: 'conversational', formality: 'professional but approachable' },
    banned_phrases: [],
    preferred_phrases: [],
  },
  pipeline_steps: [],
  author_content_mapping: {},
  shortcode_rules: { allowed_shortcodes: [], legacy_shortcodes_blocked: [] },
}

/**
 * Get active content rules configuration
 */
export function useContentRulesConfig() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['content-rules-config'],
    queryFn: async () => {
      // Try RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_active_content_rules')

      if (!rpcError && rpcData) {
        return rpcData
      }

      // Fallback to direct query
      const { data, error } = await supabase
        .from('content_rules_config')
        .select('*')
        .eq('is_active', true)
        .single()

      if (error) {
        // If no config exists, return default
        if (error.code === 'PGRST116') {
          console.warn('[ContentRules] No active config found, using defaults')
          return { ...DEFAULT_CONFIG, version: 0, id: null }
        }
        throw error
      }

      return data
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Update content rules configuration (creates new version)
 */
export function useUpdateContentRulesConfig() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ updates, changeSummary, versionName = null }) => {
      // 1. Get current config
      const { data: current, error: fetchError } = await supabase
        .from('content_rules_config')
        .select('*')
        .eq('is_active', true)
        .single()

      if (fetchError) throw fetchError

      // 2. Save current to history before updating
      const { error: historyError } = await supabase.from('content_rules_history').insert({
        config_id: current.id,
        version: current.version,
        version_name: current.version_name,
        hard_rules: current.hard_rules,
        guidelines: current.guidelines,
        tone_voice: current.tone_voice,
        pipeline_steps: current.pipeline_steps,
        author_content_mapping: current.author_content_mapping,
        shortcode_rules: current.shortcode_rules,
        change_type: 'update',
        change_summary: changeSummary || 'Configuration updated',
        changed_by: user?.email || 'unknown',
      })

      if (historyError) {
        console.error('[ContentRules] Failed to save history:', historyError)
        // Continue anyway - history is nice-to-have
      }

      // 3. Update config with new version
      const { data, error } = await supabase
        .from('content_rules_config')
        .update({
          ...updates,
          version: current.version + 1,
          version_name: versionName || `Version ${current.version + 1}`,
          updated_by: user?.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', current.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-rules-config'] })
      queryClient.invalidateQueries({ queryKey: ['content-rules-history'] })
    },
  })
}

/**
 * Update a specific section of the config
 */
export function useUpdateConfigSection() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ section, value, changeSummary }) => {
      // 1. Get current config
      const { data: current, error: fetchError } = await supabase
        .from('content_rules_config')
        .select('*')
        .eq('is_active', true)
        .single()

      if (fetchError) throw fetchError

      // Validate section name
      const validSections = ['hard_rules', 'guidelines', 'tone_voice', 'pipeline_steps', 'author_content_mapping', 'shortcode_rules']
      if (!validSections.includes(section)) {
        throw new Error(`Invalid section: ${section}`)
      }

      // 2. Save current to history
      await supabase.from('content_rules_history').insert({
        config_id: current.id,
        version: current.version,
        version_name: current.version_name,
        hard_rules: current.hard_rules,
        guidelines: current.guidelines,
        tone_voice: current.tone_voice,
        pipeline_steps: current.pipeline_steps,
        author_content_mapping: current.author_content_mapping,
        shortcode_rules: current.shortcode_rules,
        change_type: 'update',
        change_summary: changeSummary || `Updated ${section}`,
        changes_diff: { [section]: { old: current[section], new: value } },
        changed_by: user?.email || 'unknown',
      })

      // 3. Update just the specific section
      const { data, error } = await supabase
        .from('content_rules_config')
        .update({
          [section]: value,
          version: current.version + 1,
          updated_by: user?.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', current.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-rules-config'] })
      queryClient.invalidateQueries({ queryKey: ['content-rules-history'] })
    },
  })
}

/**
 * Get version history
 */
export function useContentRulesHistory(limit = 20) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['content-rules-history', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_rules_history')
        .select('*')
        .order('version', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    },
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Restore to a previous version
 */
export function useRestoreContentRulesVersion() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ historyId }) => {
      // 1. Get the history record to restore
      const { data: historyRecord, error: historyError } = await supabase
        .from('content_rules_history')
        .select('*')
        .eq('id', historyId)
        .single()

      if (historyError) throw historyError

      // 2. Get current config
      const { data: current, error: currentError } = await supabase
        .from('content_rules_config')
        .select('*')
        .eq('is_active', true)
        .single()

      if (currentError) throw currentError

      // 3. Save current to history before restore
      await supabase.from('content_rules_history').insert({
        config_id: current.id,
        version: current.version,
        version_name: current.version_name,
        hard_rules: current.hard_rules,
        guidelines: current.guidelines,
        tone_voice: current.tone_voice,
        pipeline_steps: current.pipeline_steps,
        author_content_mapping: current.author_content_mapping,
        shortcode_rules: current.shortcode_rules,
        change_type: 'restore',
        change_summary: `Restored from version ${historyRecord.version}`,
        changed_by: user?.email || 'unknown',
      })

      // 4. Update config with restored values
      const { data, error } = await supabase
        .from('content_rules_config')
        .update({
          hard_rules: historyRecord.hard_rules,
          guidelines: historyRecord.guidelines,
          tone_voice: historyRecord.tone_voice,
          pipeline_steps: historyRecord.pipeline_steps,
          author_content_mapping: historyRecord.author_content_mapping,
          shortcode_rules: historyRecord.shortcode_rules,
          version: current.version + 1,
          version_name: `Restored from v${historyRecord.version}`,
          updated_by: user?.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', current.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-rules-config'] })
      queryClient.invalidateQueries({ queryKey: ['content-rules-history'] })
    },
  })
}

/**
 * Compare two versions
 */
export function useCompareVersions(version1Id, version2Id) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['content-rules-compare', version1Id, version2Id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_rules_history')
        .select('*')
        .in('id', [version1Id, version2Id])

      if (error) throw error

      if (data.length !== 2) {
        throw new Error('Could not find both versions to compare')
      }

      const [v1, v2] = data.sort((a, b) => a.version - b.version)

      // Calculate differences
      const diff = {
        hard_rules: deepDiff(v1.hard_rules, v2.hard_rules),
        guidelines: deepDiff(v1.guidelines, v2.guidelines),
        tone_voice: deepDiff(v1.tone_voice, v2.tone_voice),
        pipeline_steps: deepDiff(v1.pipeline_steps, v2.pipeline_steps),
        author_content_mapping: deepDiff(v1.author_content_mapping, v2.author_content_mapping),
        shortcode_rules: deepDiff(v1.shortcode_rules, v2.shortcode_rules),
      }

      return {
        version1: v1,
        version2: v2,
        diff,
      }
    },
    enabled: !!user && !!version1Id && !!version2Id,
  })
}

/**
 * Helper: Deep diff between two objects
 */
function deepDiff(obj1, obj2, path = '') {
  const changes = []

  // Handle arrays
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (JSON.stringify(obj1) !== JSON.stringify(obj2)) {
      changes.push({
        path: path || 'root',
        type: 'modified',
        old: obj1,
        new: obj2,
      })
    }
    return changes
  }

  // Handle objects
  if (typeof obj1 === 'object' && obj1 !== null && typeof obj2 === 'object' && obj2 !== null) {
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)])

    for (const key of allKeys) {
      const newPath = path ? `${path}.${key}` : key

      if (!(key in obj1)) {
        changes.push({ path: newPath, type: 'added', new: obj2[key] })
      } else if (!(key in obj2)) {
        changes.push({ path: newPath, type: 'removed', old: obj1[key] })
      } else {
        changes.push(...deepDiff(obj1[key], obj2[key], newPath))
      }
    }

    return changes
  }

  // Handle primitives
  if (obj1 !== obj2) {
    changes.push({
      path: path || 'root',
      type: 'modified',
      old: obj1,
      new: obj2,
    })
  }

  return changes
}

// Export helper constants for UI components
export const CONFIG_SECTIONS = {
  global_rules: {
    label: 'Global Rules',
    description: 'Natural language rules that AI follows during generation',
    icon: 'Globe',
  },
  hard_rules: {
    label: 'Hard Rules',
    description: 'Non-negotiable rules that BLOCK publishing if violated',
    icon: 'Shield',
  },
  guidelines: {
    label: 'Guidelines',
    description: 'Soft rules that generate warnings but don\'t block publishing',
    icon: 'BookOpen',
  },
  tone_voice: {
    label: 'Tone & Voice',
    description: 'Writing style, banned phrases, and content focus',
    icon: 'MessageSquare',
  },
  pipeline_steps: {
    label: 'Pipeline',
    description: 'Configure each step of the article generation process',
    icon: 'GitBranch',
  },
  author_content_mapping: {
    label: 'Author Mapping',
    description: 'Map authors to their expertise areas and content types',
    icon: 'Users',
  },
  shortcode_rules: {
    label: 'Shortcodes',
    description: 'Allowed shortcodes and monetization rules',
    icon: 'Code',
  },
}
