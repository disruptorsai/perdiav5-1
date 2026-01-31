import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle } from 'lucide-react'
import { useHowToGuide } from '@/contexts/HowToGuideContext'

function FloatingHelpButton() {
  const { isEnabled, openHelpModal } = useHowToGuide()

  return (
    <AnimatePresence>
      {isEnabled && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openHelpModal}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
          aria-label="How to use this page"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="text-sm font-medium">How to use this page</span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}

export default FloatingHelpButton
