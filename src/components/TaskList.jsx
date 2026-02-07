import React from 'react'
import TaskCard from './TaskCard'
import './TaskList.css'

const TaskList = ({ activeTab, searchQuery }) => {
  const allTasks = [
    {
      id: 1,
      name: 'Sarah Jenkins',
      role: 'Senior Developer',
      task: 'Update the authentication API to support OAuth 2.0. Needs to be tested with the mobile team before deployment.',
      status: 'pending',
      dueDate: 'Due: Oct 24, 2023',
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Jenkins&background=f59e0b&color=fff',
    },
    {
      id: 2,
      name: 'Michael Ross',
      role: 'UX Designer',
      task: 'Create high-fidelity wireframes for the new dashboard analytics view. Focus on the mobile responsiveness.',
      status: 'ongoing',
      dueDate: 'Due: Oct 25, 2023',
      avatar: 'https://ui-avatars.com/api/?name=Michael+Ross&background=3b82f6&color=fff',
    },
    {
      id: 3,
      name: 'Emily Chen',
      role: 'Marketing Lead',
      task: 'Finalize the Q4 social media strategy document and distribute to the content team for review.',
      status: 'pending',
      dueDate: 'Due: Oct 28, 2023',
      avatar: 'https://ui-avatars.com/api/?name=Emily+Chen&background=f59e0b&color=fff',
    },
    {
      id: 4,
      name: 'David Kim',
      role: 'Product Manager',
      task: 'Review competitor analysis report and highlight key differentiators.',
      status: 'resolved',
      completedDate: 'Completed',
      avatar: 'https://ui-avatars.com/api/?name=David+Kim&background=10b981&color=fff',
    },
    {
      id: 5,
      name: 'John Mitchell',
      role: 'Sales Executive',
      task: 'Follow up with Green Valley Supplies regarding pending order confirmation.',
      status: 'pending',
      dueDate: 'Due: Dec 5, 2023',
      avatar: 'https://ui-avatars.com/api/?name=John+Mitchell&background=f59e0b&color=fff',
    },
    {
      id: 6,
      name: 'Lisa Anderson',
      role: 'Operations Manager',
      task: 'Warehouse inventory audit pending approval from regional manager.',
      status: 'ongoing',
      dueDate: 'Due: Dec 8, 2023',
      avatar: 'https://ui-avatars.com/api/?name=Lisa+Anderson&background=3b82f6&color=fff',
    },
  ]

  // Filter tasks based on active tab
  let filteredTasks = allTasks.filter((task) => task.status === activeTab)

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
        filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)
      ) : (
        <div className="no-tasks">No tasks found</div>
      )}
    </div>
  )
}

export default TaskList
