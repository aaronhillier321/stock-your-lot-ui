import './PdfPreviewModal.css'

/**
 * Modal that displays a PDF in an iframe (browser's built-in viewer).
 * Use with usePdfPreview() for blob URL lifecycle when previewing File objects.
 *
 * @param {boolean} open - Whether the modal is visible
 * @param {string | null} url - PDF URL (blob or http)
 * @param {string} label - Title shown in the modal header
 * @param {() => void} onClose - Called when the user closes the modal
 */
export default function PdfPreviewModal({ open, url, label, onClose }) {
  if (!open || !url) return null

  return (
    <div
      className="pdf-preview-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={label ? `PDF preview: ${label}` : 'PDF preview'}
    >
      <div
        className="pdf-preview-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pdf-preview-modal-header">
          <h3 className="pdf-preview-modal-title">{label || 'PDF'}</h3>
          <button
            type="button"
            className="pdf-preview-modal-close"
            onClick={onClose}
            aria-label="Close preview"
          >
            ×
          </button>
        </div>
        <iframe
          src={url}
          title={label || 'PDF preview'}
          className="pdf-preview-modal-iframe"
        />
      </div>
    </div>
  )
}
