import { useEffect, useRef, useMemo, useState } from 'react'
import { type Course } from '../api/courses'

interface Props {
  revealed: boolean
  onCourseClick: (id: string) => void
  courses: Record<string, Course>
  courseStates?: Record<string, string>
  completedCourses?: string[]
}

const NODE_W = 184
const NODE_H = 104
const ROW_TOP = 64
const ROW_H = 132
const COL_X: Record<number, number> = {
  100: 30,
  200: 30 + NODE_W + 96,
  300: 30 + 2 * (NODE_W + 96),
  400: 30 + 3 * (NODE_W + 96),
}
const COL_LABELS: Record<number, string> = {
  100: '100 · Foundations',
  200: '200 · Core',
  300: '300 · Specialization',
  400: '400 · Advanced',
}

function getStatus(
  code: string,
  course: Course,
  completedSet: Set<string>,
  courseStates: Record<string, string>
): string {
  if (completedSet.has(code)) return 'completed'
  if (courseStates[code]) return courseStates[code]
  if (Object.keys(courseStates).length > 0) return 'locked'
  const prereqs = course.prereqs ?? []
  if (prereqs.length === 0 || prereqs.every(p => completedSet.has(p))) return 'available'
  return 'locked'
}

const LockIcon = () => (
  <svg width="11" height="12" viewBox="0 0 14 14" fill="none" style={{ display: 'block' }}>
    <rect x="2.5" y="6" width="9" height="6.5" rx="1.4" fill="currentColor" />
    <path d="M4.5 6 V4.3 a2.5 2.5 0 0 1 5 0 V6" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
  </svg>
)

export default function CourseMap({ revealed, onCourseClick, courses, courseStates = {}, completedCourses = [] }: Props) {
  const ghostSvgRef = useRef<SVGSVGElement>(null)
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [nodeHeights, setNodeHeights] = useState<Record<string, number>>({})

  const visibleKeys = useMemo(() => {
    const aiKeys = Object.keys(courseStates)
    if (aiKeys.length > 0) return new Set(aiKeys)
    return new Set(Object.keys(courses))
  }, [courses, courseStates])

  const completedSet = useMemo(() => new Set(completedCourses), [completedCourses])

  const { nodePositions, connections, canvasMinHeight } = useMemo(() => {
    const byLevel: Record<number, string[]> = { 100: [], 200: [], 300: [], 400: [] }
    for (const key of visibleKeys) {
      const match = key.match(/\d+/)
      if (!match) continue
      const num = parseInt(match[0])
      const level = Math.floor(num / 100) * 100
      if (COL_X[level] !== undefined) byLevel[level].push(key)
    }
    for (const level of Object.keys(byLevel)) {
      byLevel[Number(level)].sort()
    }

    const positions: Record<string, [number, number]> = {}
    let maxCount = 0
    for (const level of [100, 200, 300, 400]) {
      const keys = byLevel[level]
      keys.forEach((key, i) => {
        positions[key] = [COL_X[level], ROW_TOP + i * ROW_H]
      })
      if (keys.length > maxCount) maxCount = keys.length
    }

    const conns: [string, string][] = []
    for (const key of visibleKeys) {
      const course = courses[key]
      if (!course) continue
      for (const prereq of (course.prereqs ?? [])) {
        if (!visibleKeys.has(prereq) || !courses[prereq]) continue
        const fromLevel = Math.floor(parseInt(courses[prereq].code.match(/\d+/)?.[0] ?? '0') / 100) * 100
        const toLevel   = Math.floor(parseInt(course.code.match(/\d+/)?.[0] ?? '0') / 100) * 100
        if (fromLevel !== toLevel) conns.push([prereq, key])
      }
    }

    return {
      nodePositions: positions,
      connections: conns,
      canvasMinHeight: Math.max(720, ROW_TOP + maxCount * ROW_H + 80),
    }
  }, [courses, visibleKeys])

  // Measure actual node heights after render so arrows hit node centers exactly
  useEffect(() => {
    const heights: Record<string, number> = {}
    for (const [id, el] of Object.entries(nodeRefs.current)) {
      if (el) heights[id] = el.offsetHeight
    }
    setNodeHeights(prev => {
      const same = Object.keys(heights).length === Object.keys(prev).length &&
        Object.keys(heights).every(k => prev[k] === heights[k])
      return same ? prev : heights
    })
  }, [nodePositions, visibleKeys])

  // Ghost lines for empty state
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

  // Bezier curves with fan-out/fan-in so multiple arrows from/to the same node don't overlap
  const svgPaths = useMemo(() => {
    const outIndex = new Map<string, string[]>()
    const inIndex  = new Map<string, string[]>()
    for (const [fromId, toId] of connections) {
      if (!outIndex.has(fromId)) outIndex.set(fromId, [])
      outIndex.get(fromId)!.push(toId)
      if (!inIndex.has(toId)) inIndex.set(toId, [])
      inIndex.get(toId)!.push(fromId)
    }
    for (const list of outIndex.values()) list.sort((a, b) => (nodePositions[a]?.[1] ?? 0) - (nodePositions[b]?.[1] ?? 0))
    for (const list of inIndex.values())  list.sort((a, b) => (nodePositions[a]?.[1] ?? 0) - (nodePositions[b]?.[1] ?? 0))

    return connections.map(([fromId, toId], i) => {
      const fp = nodePositions[fromId]
      const tp = nodePositions[toId]
      if (!fp || !tp) return null

      const fromH = nodeHeights[fromId] ?? NODE_H
      const toH   = nodeHeights[toId]   ?? NODE_H

      const sList = outIndex.get(fromId) ?? [toId]
      const sIdx  = sList.indexOf(toId)
      const sFan  = sList.length > 1 ? (sIdx - (sList.length - 1) / 2) * 16 : 0

      const tList = inIndex.get(toId) ?? [fromId]
      const tIdx  = tList.indexOf(fromId)
      const tFan  = tList.length > 1 ? (tIdx - (tList.length - 1) / 2) * 16 : 0

      const x1 = fp[0] + NODE_W
      const y1 = fp[1] + fromH / 2 + sFan
      const x2 = tp[0] - 16  // leave room for the arrowhead marker
      const y2 = tp[1] + toH / 2 + tFan
      const cx = (x2 - x1) * 0.55
      const d  = `M${x1},${y1} C${x1 + cx},${y1} ${x2 - cx},${y2} ${x2},${y2}`

      const toStatus   = courses[toId]   ? getStatus(toId,   courses[toId],   completedSet, courseStates) : undefined
      const fromStatus = courses[fromId] ? getStatus(fromId, courses[fromId], completedSet, courseStates) : undefined
      const active = (toStatus === 'completed' || toStatus === 'recommended' || toStatus === 'available')
                  && (fromStatus === 'completed' || fromStatus === 'available' || fromStatus === 'recommended')

      return active
        ? <path key={i} d={d} fill="none" stroke="#00A7E1" strokeWidth="2.25" strokeLinecap="butt" markerEnd="url(#arr-blue)" />
        : <path key={i} d={d} fill="none" stroke="#94A3B8" strokeWidth="1.75" strokeLinecap="butt" strokeDasharray="5,5" markerEnd="url(#arr-gray)" opacity="0.9" />
    })
  }, [connections, nodePositions, nodeHeights, courses, completedSet, courseStates])

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
        <div className="map-canvas" style={{ minHeight: canvasMinHeight }}>

          {/* Column headers */}
          {([100, 200, 300, 400] as const).map(level => (
            <div key={level} className="col-header" style={{ left: COL_X[level] }}>
              {COL_LABELS[level]}
            </div>
          ))}

          {/* Legend */}
          <div className="map-legend">
            <div className="legend-item" style={{ color: '#047857' }}>
              <span className="legend-swatch" style={{ background: '#ECFDF5', borderColor: '#10B981' }} />
              Completed
            </div>
            <div className="legend-item" style={{ color: '#0369A1' }}>
              <span className="legend-swatch" style={{ background: '#EFF8FE', borderColor: '#00A7E1' }} />
              Available
            </div>
            <div className="legend-item" style={{ color: '#92400E' }}>
              <span className="legend-swatch" style={{ background: '#FEF7E0', borderColor: '#F5B800' }} />
              AI Recommended
            </div>
            <div className="legend-item" style={{ color: '#475569' }}>
              <span className="legend-swatch" style={{ background: '#F8FAFC', borderColor: '#94A3B8' }} />
              Locked
            </div>
            <span className="legend-arrow">
              <svg width="36" height="10" viewBox="0 0 36 10">
                <path d="M2 5 C12 5, 22 5, 32 5" stroke="#00A7E1" strokeWidth="2.25" fill="none" />
                <path d="M27 1 L34 5 L27 9 Z" fill="#00A7E1" />
              </svg>
              unlocks
            </span>
            <span className="legend-arrow" style={{ borderLeft: 'none', paddingLeft: 0 }}>
              <svg width="36" height="10" viewBox="0 0 36 10">
                <path d="M2 5 H30" stroke="#94A3B8" strokeWidth="2" strokeDasharray="5,4" fill="none" />
                <path d="M28 1 L34 5 L28 9" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
              locked path
            </span>
          </div>

          {/* Connections */}
          <svg className="connections-svg" style={{ minHeight: canvasMinHeight }}>
            <defs>
              <marker id="arr-blue" viewBox="0 0 10 10" refX="0" refY="5" markerWidth="11" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto">
                <path d="M0,0 L10,5 L0,10 Z" fill="#00A7E1" />
              </marker>
              <marker id="arr-gray" viewBox="0 0 10 10" refX="0" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
                <path d="M0,0 L10,5 L0,10 Z" fill="#94A3B8" />
              </marker>
            </defs>
            {svgPaths}
          </svg>

          {/* Course nodes — onClick preserved for DetailPanel sidebar */}
          {Object.entries(nodePositions).map(([id, [left, top]]) => {
            const course = courses[id]
            if (!course) return null
            const status = getStatus(id, course, completedSet, courseStates)
            return (
              <div
                key={id}
                ref={el => { nodeRefs.current[id] = el }}
                className={`course-node ${status}`}
                style={{ left, top }}
                onClick={() => onCourseClick(id)}
              >
                <div className="node-code">{course.code}</div>
                <div className="node-name">{course.name}</div>
                <div className="node-badge">
                  {status === 'completed'   ? '✓'             :
                   status === 'recommended' ? '★ RECOMMENDED' :
                   status === 'available'   ? 'OPEN'          :
                   <LockIcon />}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
