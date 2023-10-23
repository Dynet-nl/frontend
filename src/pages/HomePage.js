import React from 'react'
import { useNavigate } from 'react-router-dom'

const HomePage = () => {
  const navigate = useNavigate()
  return (
    <div>
      <h1>HomePage</h1>
      <p>You are logged in!</p>
    </div>
  )
}

export default HomePage
