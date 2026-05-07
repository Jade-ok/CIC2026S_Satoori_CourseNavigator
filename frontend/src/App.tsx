import { useState } from 'react'
import ChatSidebar from './components/ChatSidebar'
import CourseMap from './components/CourseMap'
import DetailPanel from './components/DetailPanel'

export default function App() {
  const [mapRevealed, setMapRevealed] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)

  return (
    <>
      <header>
        <div className="logo">
          <div className="logo-mark">🧭</div>
          <div className="logo-text">UBC <span>Course Navigator</span></div>
        </div>
        <a
          className="team-link"
          href="https://github.com/jennachoi/CIC2026S_Satoori"
          target="_blank"
          rel="noreferrer"
        >
          CIC2026S_Satoori ↗
        </a>
      </header>

      <div className="app">
        <ChatSidebar onRevealMap={() => setMapRevealed(true)} />
        <main className="main">
          <div className="main-grid-bg" />
          <CourseMap revealed={mapRevealed} onCourseClick={setSelectedCourse} />
        </main>
      </div>

      <DetailPanel courseId={selectedCourse} onClose={() => setSelectedCourse(null)} />
    </>
  )
}
