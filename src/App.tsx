import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { IncidentExplorer } from './pages/IncidentExplorer'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/layout/Layout'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/incident" element={<IncidentExplorer />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App

