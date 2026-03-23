import ScanFlow from './pages/ScanFlow'
import AdminDashboard from './pages/AdminDashboard'
import ModeratorDashboard from './pages/ModeratorDashboard'
import UpiSetup from './pages/UpiSetup'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Story from './pages/Story'
import AuthPage from './pages/AuthPage'
import ResetPassword from './pages/ResetPassword'
import UserDashboard from './pages/UserDashboard'
import SanitationWorkerDashboard from './pages/SanitationWorkerDashboard'  // ← add this

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/scan" element={<ScanFlow />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/moderator-dashboard" element={<ModeratorDashboard />} />
        <Route path="/" element={<Landing />} />
        <Route path="/story" element={<Story />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/setup-upi" element={<UpiSetup />} />
        <Route path="/worker-dashboard" element={<SanitationWorkerDashboard />} />  {/* ← add this */}
      </Routes>
    </BrowserRouter>
  )
}

export default App