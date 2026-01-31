import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// Spinning loader
export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('flex items-center justify-center', className)}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={cn(
          sizes[size],
          'rounded-full border-blue-600 border-t-transparent'
        )}
      />
    </motion.div>
  )
}

// Dots loading animation
export function DotsLoader({ className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('flex items-center gap-1', className)}
    >
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          animate={{
            y: [0, -8, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: index * 0.15,
          }}
          className="w-2 h-2 bg-blue-600 rounded-full"
        />
      ))}
    </motion.div>
  )
}

// Pulse loading animation
export function PulseLoader({ className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('flex items-center justify-center', className)}
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
        }}
        className="w-8 h-8 bg-blue-600 rounded-full"
      />
    </motion.div>
  )
}

// Bar loading animation
export function BarLoader({ className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('flex items-end gap-1 h-6', className)}
    >
      {[0, 1, 2, 3, 4].map((index) => (
        <motion.div
          key={index}
          animate={{
            height: ['40%', '100%', '40%'],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: index * 0.1,
          }}
          className="w-1 bg-blue-600 rounded-full"
        />
      ))}
    </motion.div>
  )
}

// Skeleton loaders
export function SkeletonLine({ className = '' }) {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className={cn('h-4 bg-gray-200 rounded', className)}
    />
  )
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLine
          key={index}
          className={index === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('bg-white rounded-lg border border-gray-200 p-6', className)}
    >
      <div className="flex items-center gap-4 mb-4">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-12 h-12 bg-gray-200 rounded-full"
        />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="w-1/3 h-5" />
          <SkeletonLine className="w-1/2 h-3" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </motion.div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('space-y-2', className)}
    >
      {/* Header */}
      <div className="flex gap-4 py-3 border-b border-gray-200">
        {Array.from({ length: cols }).map((_, index) => (
          <SkeletonLine key={index} className="flex-1 h-5" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-3">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <SkeletonLine key={colIndex} className="flex-1 h-4" />
          ))}
        </div>
      ))}
    </motion.div>
  )
}

// Full page loader
export function PageLoader({ message = 'Loading...' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50"
    >
      <Spinner size="xl" />
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 text-gray-600 font-medium"
      >
        {message}
      </motion.p>
    </motion.div>
  )
}

// Content placeholder while loading
export function LoadingPlaceholder({ title = 'Loading', className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
    >
      <Spinner size="lg" className="mb-4" />
      <p className="text-gray-500">{title}</p>
    </motion.div>
  )
}

// Inline button loading state
export function ButtonSpinner({ className = '' }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={cn(
        'w-4 h-4 border-2 border-current border-t-transparent rounded-full',
        className
      )}
    />
  )
}
