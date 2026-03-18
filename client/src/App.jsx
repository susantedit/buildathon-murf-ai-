import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Creator from './pages/Creator'
import Assistant from './pages/Assistant'
import Study from './pages/Study'
import Focus from './pages/Focus'
import Planner from './pages/Planner'
import Safety from './pages/Safety'
import History from './pages/History'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/creator"   element={<Creator />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/study"     element={<Study />} />
          <Route path="/focus"     element={<Focus />} />
          <Route path="/planner"   element={<Planner />} />
          <Route path="/safety"    element={<Safety />} />
          <Route path="/history"   element={<History />} />
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg2)',
              color: 'var(--text1)',
              border: '1px solid var(--border)',
              backdropFilter: 'blur(20px)'
            }
          }}
        />
      </BrowserRouter>
    </ThemeProvider>
  )
}
