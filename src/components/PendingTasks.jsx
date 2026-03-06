import React, { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import './PendingTasks.css'

const TASKS_COLLECTION     = 'tasks'
const EMPLOYEES_COLLECTION = 'employees'

function toMs(v) {
  if (!v) return 0
  if (typeof v.toDate === 'function') return v.toDate().getTime()
  const d = new Date(v)
  return isNaN(d.getTime()) ? 0 : d.getTime()
}

const PendingTasks = () => {
  const [activeTab, setActiveTab] = useState('ongoing')
  const [rawTasks, setRawTasks]       = useState([])
  const [employees, setEmployees]     = useState([])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const u1 = onSnapshot(collection(db, TASKS_COLLECTION),     s => setRawTasks(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u2 = onSnapshot(collection(db, EMPLOYEES_COLLECTION), s => setEmployees(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    return () => { u1(); u2() }
  }, [])

  const tasks = useMemo(() => {
    return rawTasks.map(t => {
      const emp  = employees.find(e => e.id === t.employeeId)
      const name = emp ? (emp.salesPersonName || emp.email || t.employeeId) : (t.employeeId || '—')
      const role = emp?.designation || '—'
      const createdMs  = toMs(t.createdAt)
      const resolvedMs = toMs(t.resolvedAt)
      const isResolved = t.status === 'resolved'

      // How long has this been ongoing: from createdAt until now
      const ongoingSince = createdMs
        ? Math.floor((Date.now() - createdMs) / (1000 * 60 * 60 * 24))
        : null

      const createdLabel = createdMs
        ? new Date(createdMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : null

      const resolvedLabel = resolvedMs
        ? new Date(resolvedMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : null

      return {
        id: t.id,
        name,
        role,
        description: t.description || '—',
        status: t.status || 'pending',
        isResolved,
        createdMs,
        resolvedMs,
        ongoingSince,
        createdLabel,
        resolvedLabel,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.replace(/\s+/g, '+'))}&background=f59e0b&color=fff`,
      }
    })
  }, [rawTasks, employees])

  const displayed = useMemo(() => {
    if (activeTab === 'ongoing') {
      // Non-resolved, oldest createdAt first (ongoing the longest at the top)
      return tasks
        .filter(t => !t.isResolved)
        .sort((a, b) => a.createdMs - b.createdMs)
    } else {
      // Resolved, most recently resolved first
      return tasks
        .filter(t => t.isResolved)
        .sort((a, b) => b.resolvedMs - a.resolvedMs)
    }
  }, [tasks, activeTab])

  return (
    <div className="pending-tasks-card">
      <div className="card-header-section">
        <div>
          <h3 className="card-title">Pending Tasks</h3>
          <p className="card-subtitle">Track and manage employee assignments</p>
        </div>
        <div className="task-tabs">
          <button
            className={`tab-button ${activeTab === 'ongoing' ? 'active' : ''}`}
            onClick={() => setActiveTab('ongoing')}
          >
            Ongoing
          </button>
          <button
            className={`tab-button ${activeTab === 'resolved' ? 'active' : ''}`}
            onClick={() => setActiveTab('resolved')}
          >
            Resolved
          </button>
        </div>
      </div>

      <div className="tasks-grid">
        {displayed.length === 0 ? (
          <p className="no-tasks-message">No {activeTab} tasks</p>
        ) : (
          displayed.map(task => (
            <div key={task.id} className="task-card">
              <div className="task-header">
                <div className="task-user">
                  <img src={task.avatar} alt={task.name} className="task-avatar" />
                  <div>
                    <div className="task-name">{task.name}</div>
                    <div className="task-title">{task.role}</div>
                  </div>
                </div>
                <span className={`task-status-badge ${task.isResolved ? 'resolved' : 'ongoing'}`}>
                  {task.isResolved ? 'Resolved' : 'Ongoing'}
                </span>
              </div>

              <p className="task-description">{task.description}</p>

              <div className="task-footer">
                {task.isResolved ? (
                  <span className="task-date completed">
                    ✓ Resolved {task.resolvedLabel ? `on ${task.resolvedLabel}` : ''}
                  </span>
                ) : (
                  <>
                    <span className="task-date">
                      {task.createdLabel ? `Since: ${task.createdLabel}` : '—'}
                    </span>
                    {task.ongoingSince !== null && (
                      <span className="task-time-left" style={{ color: task.ongoingSince > 7 ? '#ef4444' : '#f59e0b' }}>
                        {task.ongoingSince === 0 ? 'Today' : `${task.ongoingSince}d ongoing`}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default PendingTasks
