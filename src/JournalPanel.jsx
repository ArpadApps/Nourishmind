import { useRef, useState } from 'react'

const MEAL_CYCLE = ['breakfast', 'lunch', 'dinner', 'snack']

function formatDayLabel(dateStr) {
  const today = new Date().toLocaleDateString('en-CA')
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA')
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function JournalPanel({ pendingQueue, journalHistory = [], onConfirm, onDiscard, onMealChange, onEditPending, onEditHistory, onDeleteHistory, onClose }) {
  const overlayRef = useRef(null)

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  // Group history entries by date, most recent first
  const grouped = journalHistory
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .reduce((acc, entry) => {
      if (!acc[entry.date]) acc[entry.date] = []
      acc[entry.date].push(entry)
      return acc
    }, {})
  const groupedDays = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div
      ref={overlayRef}
      className="journal-overlay"
      onClick={handleOverlayClick}
    >
      <div className="journal-panel">
        <div className="journal-handle" />

        {/* ── Pending section ── */}
        {pendingQueue.length > 0 && (
          <div className="journal-pending-section">
            <p className="journal-pending-header">Confirm your meals</p>
            <p className="journal-pending-hint">Tap ✓ to add to your food journal</p>
            <div className="journal-pending-items-list">
              {pendingQueue.map(entry => (
                <PendingItem
                  key={entry.id}
                  entry={entry}
                  onConfirm={() => onConfirm(entry.id)}
                  onDiscard={() => onDiscard(entry.id)}
                  onMealChange={(meal) => onMealChange(entry.id, meal)}
                  onEditText={(text) => onEditPending(entry.id, text)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Divider ── */}
        {pendingQueue.length > 0 && <div className="journal-section-divider" />}

        {/* ── History section ── */}
        <div className="journal-history-section">
          <p className="journal-history-header">Your food journal</p>
          {groupedDays.length === 0 ? (
            <p className="journal-empty">Your confirmed meals will appear here.</p>
          ) : (
            groupedDays.map(date => (
              <div key={date} className="journal-day">
                <p className="journal-day-label">{formatDayLabel(date)}</p>
                {grouped[date].map((entry, i) => (
                  <HistoryEntry
                    key={entry.confirmedAt || i}
                    entry={entry}
                    onEdit={(text, meal) => onEditHistory(entry, text, meal)}
                    onDelete={() => onDeleteHistory(entry)}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Pending item with inline editing ──────────────────────────────────────

function PendingItem({ entry, onConfirm, onDiscard, onMealChange, onEditText }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(entry.items.join(', '))
  const inputRef = useRef(null)

  const cycleMeal = () => {
    const idx = MEAL_CYCLE.indexOf(entry.meal)
    onMealChange(MEAL_CYCLE[(idx + 1) % MEAL_CYCLE.length])
  }

  const startEdit = () => {
    setDraft(entry.items.join(', '))
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const commitEdit = () => {
    const trimmed = draft.trim()
    if (trimmed) onEditText(trimmed)
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
    if (e.key === 'Escape') { setEditing(false) }
  }

  return (
    <div className="journal-pending-item">
      <div className="journal-pending-top">
        {editing ? (
          <input
            ref={inputRef}
            className="journal-pending-edit-input"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <button className="journal-pending-text-btn" onClick={startEdit} aria-label="Edit food description">
            <span className="journal-pending-items">{entry.items.join(', ')}</span>
            <svg className="journal-edit-hint" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <div className="journal-pending-actions">
          <button className="journal-confirm-btn" onClick={onConfirm} aria-label="Confirm">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8L6.5 11.5L13 4.5" stroke="#c8a97e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="journal-discard-btn" onClick={onDiscard} aria-label="Discard">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4.5 4.5L11.5 11.5M11.5 4.5L4.5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
      <button className="journal-meal-tag journal-meal-tag--tappable" onClick={cycleMeal}>
        {entry.meal}
      </button>
    </div>
  )
}

// ── Confirmed history entry with inline editing and delete ────────────────

function HistoryEntry({ entry, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(entry.items.join(', '))
  const [draftMeal, setDraftMeal] = useState(entry.meal)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const inputRef = useRef(null)

  const startEdit = () => {
    setDraft(entry.items.join(', '))
    setDraftMeal(entry.meal)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const commitEdit = () => {
    const trimmed = draft.trim()
    if (trimmed) onEdit(trimmed, draftMeal)
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
    if (e.key === 'Escape') { setEditing(false) }
  }

  const cycleMeal = () => {
    const idx = MEAL_CYCLE.indexOf(draftMeal)
    setDraftMeal(MEAL_CYCLE[(idx + 1) % MEAL_CYCLE.length])
  }

  const handleDeleteTap = () => {
    if (confirmDelete) { onDelete() } else { setConfirmDelete(true) }
  }

  if (confirmDelete) {
    return (
      <div className="journal-history-entry journal-history-entry--deleting">
        <span className="journal-history-delete-confirm">Delete this entry?</span>
        <div className="journal-history-delete-actions">
          <button className="journal-history-delete-yes" onClick={onDelete}>Delete</button>
          <button className="journal-history-delete-cancel" onClick={() => setConfirmDelete(false)}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`journal-history-entry${editing ? ' journal-history-entry--editing' : ''}`}>
      <div className="journal-history-main">
        {editing ? (
          <div className="journal-history-edit-row">
            <input
              ref={inputRef}
              className="journal-history-edit-input"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
            />
            <button className="journal-meal-tag journal-meal-tag--tappable journal-meal-tag--edit" onClick={cycleMeal}>
              {draftMeal}
            </button>
          </div>
        ) : (
          <span className="journal-history-items">{entry.items.join(', ')}</span>
        )}
        {!editing && (
          <div className="journal-history-meta">
            {entry.detectedAt && (
              <span className="journal-history-time">
                {new Date(entry.detectedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </span>
            )}
            {entry.meal && entry.meal !== 'unspecified' && (
              <span className="journal-meal-tag journal-meal-tag--static">{entry.meal}</span>
            )}
          </div>
        )}
      </div>
      <div className="journal-history-controls">
        <button className="journal-history-edit-btn" onClick={editing ? commitEdit : startEdit} aria-label="Edit entry">
          {editing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7L5.5 10.5L12 3.5" stroke="#c8a97e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9.5 1.5L12.5 4.5L5 12H2V9L9.5 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
        <button className="journal-history-delete-btn" onClick={handleDeleteTap} aria-label="Delete entry">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 4H12M5 4V2.5H9V4M5.5 6.5V10.5M8.5 6.5V10.5M3 4L3.5 11.5H10.5L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
