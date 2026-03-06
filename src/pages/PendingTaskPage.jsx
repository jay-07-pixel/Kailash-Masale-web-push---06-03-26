import React, { useState, useEffect } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import UniversalHeader from '../components/UniversalHeader'
import AssignTaskModal from '../components/AssignTaskModal'
import TaskSummaryCards from '../components/TaskSummaryCards'
import TaskFilterTabs from '../components/TaskFilterTabs'
import SearchBar from '../components/SearchBar'
import TaskList from '../components/TaskList'
import './PendingTaskPage.css'

const EMPLOYEES_COLLECTION = 'employees'
const TASKS_COLLECTION = 'tasks'

function PendingTaskPage() {
  const [activeTab, setActiveTab] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAssignTaskModalOpen, setIsAssignTaskModalOpen] = useState(false)
  const [employees, setEmployees] = useState([])
  const [tasks, setTasks] = useState([])
  const [editTaskModal, setEditTaskModal] = useState(null)
  const [editTaskDescription, setEditTaskDescription] = useState('')

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, EMPLOYEES_COLLECTION), (snapshot) => {
      setEmployees(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, TASKS_COLLECTION), (snapshot) => {
      setTasks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  const handleAssignTask = async (employeeId, taskDescription, status = 'pending') => {
    if (!db || !employeeId?.trim() || !taskDescription?.trim()) return
    try {
      await addDoc(collection(db, TASKS_COLLECTION), {
        employeeId: employeeId.trim(),
        description: taskDescription.trim(),
        status,
        createdAt: serverTimestamp(),
      })
      setIsAssignTaskModalOpen(false)
    } catch (err) {
      console.error('Failed to assign task:', err)
    }
  }

  const handleMarkComplete = async (taskId) => {
    if (!db || !taskId) return
    try {
      await updateDoc(doc(db, TASKS_COLLECTION, taskId), {
        status: 'resolved',
        resolvedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Failed to mark task complete:', err)
    }
  }

  const handleEditTask = (taskId, currentDescription) => {
    setEditTaskModal({ taskId })
    setEditTaskDescription(currentDescription || '')
  }

  const handleSaveEditTask = async () => {
    if (!db || !editTaskModal?.taskId || !editTaskDescription?.trim()) return
    try {
      await updateDoc(doc(db, TASKS_COLLECTION, editTaskModal.taskId), {
        description: editTaskDescription.trim(),
      })
      setEditTaskModal(null)
      setEditTaskDescription('')
    } catch (err) {
      console.error('Failed to update task:', err)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!db || !taskId) return
    if (!window.confirm('Delete this task?')) return
    try {
      await deleteDoc(doc(db, TASKS_COLLECTION, taskId))
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }

  return (
    <div className="main-content">
      <UniversalHeader title="Pending Task" />

      <div className="content-wrapper">
        <div className="page-actions">
          <button
            className="assign-task-button"
            onClick={() => setIsAssignTaskModalOpen(true)}
          >
            <img 
              src="/assign-task-icon.png" 
              alt="Assign Task" 
              className="button-icon"
            />
            Assign Task
          </button>
        </div>

        <TaskSummaryCards
          pendingCount={tasks.filter((t) => (t.status || 'pending') === 'pending').length}
          resolvedCount={tasks.filter((t) => t.status === 'resolved').length}
        />
        
        <div className="task-controls">
          <TaskFilterTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </div>

        <TaskList
          activeTab={activeTab}
          searchQuery={searchQuery}
          tasks={tasks}
          employees={employees}
          onMarkComplete={handleMarkComplete}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
        />
      </div>
      <AssignTaskModal
        isOpen={isAssignTaskModalOpen}
        onClose={() => setIsAssignTaskModalOpen(false)}
        employees={employees}
        onSave={handleAssignTask}
        onSubmit={handleAssignTask}
      />
      {editTaskModal && (
        <div className="assign-task-overlay" onClick={() => setEditTaskModal(null)}>
          <div className="assign-task-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button type="button" className="back-button" onClick={() => setEditTaskModal(null)}>
                <span className="back-arrow">←</span>
              </button>
              <h3 className="modal-title">Edit Task</h3>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Task description</label>
                <textarea
                  value={editTaskDescription}
                  onChange={(e) => setEditTaskDescription(e.target.value)}
                  className="task-textarea"
                  rows={4}
                  placeholder="Task description"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="save-button" onClick={() => { setEditTaskModal(null); setEditTaskDescription('') }}>
                Cancel
              </button>
              <button type="button" className="submit-button" onClick={handleSaveEditTask} disabled={!editTaskDescription.trim()}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PendingTaskPage
