import { createContext, useContext, useState, useEffect } from 'react'
import { useSettingsMap, useUpdateSetting } from '@/hooks/useSystemSettings'

const HowToGuideContext = createContext(null)

const SETTING_KEY = 'how_to_guides_enabled'

export function HowToGuideProvider({ children }) {
  const { getBoolValue, isLoading } = useSettingsMap()
  const updateSetting = useUpdateSetting()

  // Local state for immediate UI response
  const [isEnabled, setIsEnabled] = useState(false)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)

  // Sync with database setting once loaded
  useEffect(() => {
    if (!isLoading) {
      setIsEnabled(getBoolValue(SETTING_KEY, false))
    }
  }, [isLoading, getBoolValue])

  const toggleEnabled = async () => {
    const newValue = !isEnabled
    setIsEnabled(newValue) // Optimistic update

    try {
      await updateSetting.mutateAsync({
        key: SETTING_KEY,
        value: newValue.toString(),
        category: 'ui',
        description: 'Enable floating help buttons on each page'
      })
    } catch (error) {
      // Revert on error
      setIsEnabled(!newValue)
      console.error('Failed to update how-to guides setting:', error)
    }
  }

  const setEnabled = async (value) => {
    setIsEnabled(value) // Optimistic update

    try {
      await updateSetting.mutateAsync({
        key: SETTING_KEY,
        value: value.toString(),
        category: 'ui',
        description: 'Enable floating help buttons on each page'
      })
    } catch (error) {
      // Revert on error
      setIsEnabled(!value)
      console.error('Failed to update how-to guides setting:', error)
    }
  }

  const openHelpModal = () => setIsHelpModalOpen(true)
  const closeHelpModal = () => setIsHelpModalOpen(false)

  return (
    <HowToGuideContext.Provider
      value={{
        isEnabled,
        isLoading,
        toggleEnabled,
        setEnabled,
        isHelpModalOpen,
        openHelpModal,
        closeHelpModal
      }}
    >
      {children}
    </HowToGuideContext.Provider>
  )
}

export function useHowToGuide() {
  const context = useContext(HowToGuideContext)
  if (!context) {
    throw new Error('useHowToGuide must be used within a HowToGuideProvider')
  }
  return context
}
