import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Upload from './pages/Upload'
import Results from './pages/Results'

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/upload" element={
          <PrivateRoute><Upload /></PrivateRoute>
        } />
        <Route path="/results/:id" element={
          <PrivateRoute><Results /></PrivateRoute>
        } />
        <Route path="/" element={<Navigate to="/upload" />} />
      </Routes>
    </BrowserRouter>
  )
}