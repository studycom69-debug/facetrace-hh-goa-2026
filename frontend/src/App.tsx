import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import HistoryDetailPage from './pages/HistoryDetailPage'
import HistoryPage from './pages/HistoryPage'
import HomePage from './pages/HomePage'
import HowItWorksPage from './pages/HowItWorksPage'
import RecordDetailPage from './pages/RecordDetailPage'
import RecordsPage from './pages/RecordsPage'
import ResponsibleUsePage from './pages/ResponsibleUsePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history/:runId" element={<HistoryDetailPage />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/records/:recordId" element={<RecordDetailPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/responsible-use" element={<ResponsibleUsePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
