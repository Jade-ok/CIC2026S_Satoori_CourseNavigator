import { useEffect, useRef } from 'react'
import { courses, connections, nodePositions } from '../data/courses'

interface Props {
  revealed: boolean
  onCourseClick: (id: string) => void
}

export default function CourseMap({ revealed, onCourseClick }: Props) {
  const ghostSvgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const drawGhostLines = () => {
      const svg = ghostSvgRef.current
      if (!svg || !svg.parentElement) return
      const w = svg.parentElement.offsetWidth || 800
      const h = svg.parentElement.offsetHeight || 600
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
      svg.setAttribute('width', String(w))
      svg.setAttribute('height', String(h))
      const pairs: [[number, number], [number, number]][] = [
        [[0.07, 0.22], [0.30, 0.22]], [[0.07, 0.42], [0.30, 0.22]],
        [[0.30, 0.22], [0.52, 0.20]], [[0.30, 0.22], [0.52, 0.45]],
        [[0.52, 0.20], [0.74, 0.20]], [[0.52, 0.45], [0.74, 0.45]],
        [[0.74, 0.20], [0.74, 0.68]],
      ]
      let html = ''
      pairs.forEach(([[x1r, y1r], [x2r, y2r]]) => {
        const x1 = x1r * w + 65, y1 = y1r * h + 30
        const x2 = x2r * w,      y2 = y2r * h + 30
        const mx = (x1 + x2) / 2
        html += `<path d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}" fill="none" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.5"/>`
      })
      svg.innerHTML = html
    }

    drawGhostLines()
    const ro = new ResizeObserver(drawGhostLines)
    const parent = ghostSvgRef.current?.parentElement
    if (parent) ro.observe(parent)
    window.addEventListener('resize', drawGhostLines)
    return () => { ro.disconnect(); window.removeEventListener('resize', drawGhostLines) }
  }, [])

  return (
    <>
      {/* Empty state */}
      <div
        id="emptyState"
        style={{ opacity: revealed ? 0 : 1, pointerEvents: revealed ? 'none' : undefined }}
      >
        <div className="ghost-nodes">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="ghost-node" />)}
        </div>
        <svg className="ghost-lines" ref={ghostSvgRef} />
        <div className="empty-center">
          <div className="empty-icon-wrap">
            <div className="pulse-ring" />
            <div className="pulse-ring" />
            <div className="empty-icon">🗺️</div>
          </div>
          <div className="empty-title">Your Course Map</div>
          <div className="empty-sub">
            Tell the AI Coordinator your goals and completed courses — your personalized path will appear here.
          </div>
          <div className="empty-steps">
            <div className="empty-step">
              <div className="step-num">1</div>
              <span>Share your <strong>career goal</strong> or area of interest in the chat</span>
            </div>
            <div className="empty-step">
              <div className="step-num">2</div>
              <span>Upload your <strong>transcript PDF</strong> or type your completed courses</span>
            </div>
            <div className="empty-step">
              <div className="step-num">3</div>
              <span>AI builds your <strong>personalized course map</strong> with recommendations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div
        className="map-container"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div className="map-canvas">
          <svg className="connections-svg">
            <defs>
              <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,1 L9,5 L0,9" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinejoin="round" />
              </marker>
              <marker id="arr-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,1 L9,5 L0,9" fill="none" stroke="#00A7E1" strokeWidth="1.5" strokeLinejoin="round" />
              </marker>
            </defs>
            {connections.map(([from, to], i) => {
              const fp = nodePositions[from], tp = nodePositions[to]
              if (!fp || !tp) return null
              const x1 = fp[0] + 145, y1 = fp[1] + 35
              const x2 = tp[0],       y2 = tp[1] + 35
              const mx = (x1 + x2) / 2
              const active = courses[to]?.status === 'recommended' || courses[to]?.status === 'available'
              return (
                <path key={i}
                  d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                  fill="none"
                  stroke={active ? '#BAE6FD' : '#E5E7EB'}
                  strokeWidth="1.5"
                  markerEnd={`url(#${active ? 'arr-blue' : 'arr'})`}
                  strokeDasharray={active ? undefined : '4,3'}
                />
              )
            })}
          </svg>

          {/* Legend */}
          <div style={{ position: 'absolute', top: 14, left: 10, display: 'flex', gap: 20, pointerEvents: 'none', zIndex: 2 }}>
            {[
              { label: 'Completed',      color: '#10B981', bg: '#34D399' },
              { label: 'Available',      color: '#0369A1', bg: '#00A7E1' },
              { label: 'AI Recommended', color: '#92400E', bg: '#FFC72C' },
              { label: 'Locked',         color: '#6B7280', bg: '#D1D5DB' },
            ].map(({ label, color, bg }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: bg, display: 'inline-block' }} />
                {label}
              </div>
            ))}
          </div>

          {/* Course nodes */}
          {Object.entries(nodePositions).map(([id, [left, top]]) => {
            const course = courses[id]
            if (!course) return null
            return (
              <div
                key={id}
                className={`course-node ${course.status}`}
                style={{ left, top }}
                onClick={() => onCourseClick(id)}
              >
                <div className="node-code">{course.code}</div>
                <div className="node-name">{course.name}</div>
                <div className="node-badge">{course.badge}</div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
