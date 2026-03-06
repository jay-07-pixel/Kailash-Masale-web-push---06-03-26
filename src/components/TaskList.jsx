import React, { useMemo } from 'react'
import TaskCard from './TaskCard'
import './TaskList.css'

function toMs(v) {
  if (!v) return 0
  if (typeof v.toDate === 'function') return v.toDate().getTime()
  const d = new Date(v)
  return isNaN(d.getTime()) ? 0 : d.getTime()
}

const TaskList = ({ activeTab, searchQuery, tasks = [], employees = [], onMarkComplete, onEdit, onDelete }) => {
  const allTasks = useMemo(() => {
    return tasks.map((t) => {
      const emp = employees.find((e) => e.id === t.employeeId)
      const name = emp ? (emp.salesPersonName || emp.email || t.employeeId) : t.employeeId || '—'
      const role = emp?.designation || '—'
      const createdMs  = toMs(t.createdAt)
      const resolvedMs = toMs(t.resolvedAt)
      const createdAt  = createdMs ? new Date(createdMs) : null
      const dueDateStr = createdAt
        ? `Since: ${createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        : '—'
      const resolvedAt = resolvedMs ? new Date(resolvedMs) : null
      const completedStr = resolvedAt
        ? `Resolved: ${resolvedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        : t.status === 'resolved' ? 'Completed' : null
      return {
        id: t.id,
        name,
        role,
        task: t.description || '—',
        status: t.status || 'pending',
        dueDate: dueDateStr,
        completedDate: completedStr,
        createdMs,
        resolvedMs,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.replace(/\s+/g, '+'))}&background=f59e0b&color=fff`,
      }
    })
  }, [tasks, employees])

  // Filter tasks based on active tab
  let filteredTasks = allTasks.filter((task) => task.status === activeTab)

  // Sort: ongoing → oldest createdAt first (longest ongoing at top)
  //       resolved → newest resolvedAt first (latest resolved at top)
  if (activeTab === 'pending' || activeTab === 'ongoing') {
    filteredTasks = [...filteredTasks].sort((a, b) => a.createdMs - b.createdMs)
  } else if (activeTab === 'resolved') {
    filteredTasks = [...filteredTasks].sort((a, b) => b.resolvedMs - a.resolvedMs)
  }

  // Filter by search query
  if (searchQuery) {
    filteredTasks = filteredTasks.filter(
      (task) =>
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.task.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  return (
    <div className="task-list">
      {filteredTasks.length > 0 ? (
        filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onMarkComplete={onMarkComplete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      ) : (
        <div className="no-tasks">No tasks found</div>
      )}
    </div>
  )
}

export default TaskList
