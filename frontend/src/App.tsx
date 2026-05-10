import { useState, useEffect } from 'react'
import ChatSidebar from './components/ChatSidebar'
import CourseMap from './components/CourseMap'
import DetailPanel from './components/DetailPanel'
import { getCourses, type Course, type ChatResponse } from './api/courses'

export default function App() {
  const [mapRevealed, setMapRevealed] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [completedCourses, setCompletedCourses] = useState<string[]>([])
  const [courseStates, setCourseStates] = useState<Record<string, string>>({})
  const [courses, setCourses] = useState<Record<string, Course>>({})
  const [loadingCourses, setLoadingCourses] = useState(true)

  useEffect(() => {
    getCourses()
      .then((data) => setCourses(data))
      .catch((err) => console.error('Failed to load courses:', err))
      .finally(() => setLoadingCourses(false))
  }, [])

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
        <ChatSidebar
          onRevealMap={() => setMapRevealed(true)}
          completedCourses={completedCourses}
          onChatResponse={(response: ChatResponse) => {
            const completed = Object.entries(response.course_states)
              .filter(([, v]) => v === 'completed')
              .map(([k]) => k)
            setCompletedCourses(completed)
            setCourseStates(response.course_states)
          }}
          onTranscriptParsed={setCompletedCourses}
        />
        <main className="main">
          <div className="main-grid-bg" />
          {loadingCourses ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6B7280', fontSize: 14 }}>
              Loading courses…
            </div>
          ) : (
            <CourseMap
              revealed={mapRevealed}
              onCourseClick={setSelectedCourse}
              courses={courses}
              courseStates={courseStates}
              completedCourses={completedCourses}
            />
          )}
        </main>
      </div>

      <DetailPanel courseId={selectedCourse} onClose={() => setSelectedCourse(null)} courses={courses} courseStates={courseStates} />
    </>
  )
}
