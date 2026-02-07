import React from 'react'
import './SearchBar.css'

const SearchBar = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className="task-search-bar">
      <img 
        src="/search-icon.png" 
        alt="Search" 
        className="search-icon"
      />
      <input
        type="text"
        placeholder="Search tasks..."
        className="search-input"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  )
}

export default SearchBar
