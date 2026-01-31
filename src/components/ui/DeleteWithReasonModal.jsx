import { useState } from 'react'
import { Loader2, Trash2, AlertTriangle } from 'lucide-react'

/**
 * Deletion categories with labels and descriptions
 * Used consistently across content ideas and articles
 */
export const DELETION_CATEGORIES = {
  irrelevant_topic: {
    label: 'Irrelevant Topic',
    description: "Topic doesn't fit our content strategy",
  },
  not_monetizable: {
    label: 'Not Monetizable',
    description: 'No revenue potential (e.g., space tourism)',
  },
  duplicate_content: {
    label: 'Duplicate',
    description: 'Similar content already exists',
  },
  outdated_information: {
    label: 'Outdated',
    description: 'Information is stale or inaccurate',
  },
  poor_quality: {
    label: 'Poor Quality',
    description: 'Quality too low to salvage',
  },
  wrong_audience: {
    label: 'Wrong Audience',
    description: "Doesn't match target audience",
  },
  compliance_issue: {
    label: 'Compliance Issue',
    description: 'Legal, copyright, or policy concerns',
  },
  test_content: {
    label: 'Test Content',
    description: 'Was just for testing purposes',
  },
  client_request: {
    label: 'Client Request',
    description: 'Client asked us to remove it',
  },
  other: {
    label: 'Other',
    description: 'Other reason (explain below)',
  },
}

/**
 * Modal for deleting content with a required reason
 * Works for both content ideas and articles
 */
export function DeleteWithReasonModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  entityType = 'item', // 'content idea' or 'article'
  isDeleting = false,
}) {
  const [formData, setFormData] = useState({
    deletionCategory: '',
    deletionReason: '',
    additionalNotes: '',
  })

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.deletionCategory) {
      alert('Please select a reason for deletion')
      return
    }
    onConfirm(formData)
  }

  const handleClose = () => {
    setFormData({
      deletionCategory: '',
      deletionReason: '',
      additionalNotes: '',
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Delete {entityType}
              </h2>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                "{title}"
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">
              This action cannot be undone. Please tell us why you're deleting
              this {entityType} to help improve our content suggestions.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Deletion Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why are you deleting this? *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(DELETION_CATEGORIES).map(
                  ([key, { label, description }]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, deletionCategory: key })
                      }
                      className={`p-3 text-left rounded-lg border transition-colors ${
                        formData.deletionCategory === key
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-sm">{label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {description}
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Detailed Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Reason (for AI training)
              </label>
              <textarea
                value={formData.deletionReason}
                onChange={(e) =>
                  setFormData({ ...formData, deletionReason: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder={`Explain why this ${entityType} should be deleted so the AI can avoid similar content in the future...`}
              />
              <p className="text-xs text-gray-500 mt-1">
                This feedback will help train the AI to suggest better content.
              </p>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (optional)
              </label>
              <input
                type="text"
                value={formData.additionalNotes}
                onChange={(e) =>
                  setFormData({ ...formData, additionalNotes: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Any other context..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={isDeleting || !formData.deletionCategory}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete {entityType}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default DeleteWithReasonModal
