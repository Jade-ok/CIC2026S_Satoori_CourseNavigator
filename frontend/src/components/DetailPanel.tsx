import { courses } from '../data/courses'

const REDDIT_LOGO = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" style="display:block">
  <circle cx="10" cy="10" r="10" fill="#FF4500"/>
  <path fill="white" d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.07 2.13.45a1 1 0 1 0 1-.97 1 1 0 0 0-.96.68l-2.38-.5a.16.16 0 0 0-.19.12l-.73 3.44a7.14 7.14 0 0 0-3.89 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .64-1.54zM7.27 11a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.71a3.58 3.58 0 0 1-2.85.86 3.58 3.58 0 0 1-2.85-.86.25.25 0 0 1 .35-.35 3.13 3.13 0 0 0 2.5.71 3.13 3.13 0 0 0 2.5-.71.25.25 0 0 1 .35.35zm-.17-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"/>
</svg>`

const REDDIT_MINI = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" style="display:block">
  <circle cx="10" cy="10" r="10" fill="#FF4500"/>
  <path fill="white" d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.07 2.13.45a1 1 0 1 0 1-.97 1 1 0 0 0-.96.68l-2.38-.5a.16.16 0 0 0-.19.12l-.73 3.44a7.14 7.14 0 0 0-3.89 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .64-1.54zM7.27 11a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.71a3.58 3.58 0 0 1-2.85.86 3.58 3.58 0 0 1-2.85-.86.25.25 0 0 1 .35-.35 3.13 3.13 0 0 0 2.5.71 3.13 3.13 0 0 0 2.5-.71.25.25 0 0 1 .35.35zm-.17-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"/>
</svg>`

const categoryStyle: Record<string, { bg: string; color: string }> = {
  Completed:      { bg: '#D1FAE5', color: '#065F46' },
  Available:      { bg: '#E0F4FD', color: '#0369A1' },
  'AI Recommended': { bg: '#FEF3C7', color: '#92400E' },
  Locked:         { bg: '#F3F4F6', color: '#6B7280' },
}

interface Props {
  courseId: string | null
  onClose: () => void
}

export default function DetailPanel({ courseId, onClose }: Props) {
  const course = courseId ? courses[courseId] : null
  const style = course ? (categoryStyle[course.category] ?? { bg: '#F3F4F6', color: '#6B7280' }) : null

  return (
    <div className={`detail-panel${course ? ' open' : ''}`}>
      {course && style && (
        <>
          <div className="detail-header">
            <button className="detail-close" onClick={onClose}>✕</button>
            <div className="detail-code">{course.code}</div>
            <div className="detail-name">{course.name}</div>
            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: style.bg, color: style.color }}>
              {course.category}
            </span>
          </div>

          <div className="detail-body">
            <div className="detail-desc">{course.desc}</div>
            <div className="credits-row">
              <span className="credits-label">Credits</span>
              <span className="credits-value">{course.credits} credits</span>
            </div>

            <div className="detail-section">Prerequisites</div>
            <div className="tag-list">
              {course.prereqs.map(p => <span key={p} className="dtag">{p}</span>)}
            </div>

            {course.unlocks.length > 0 && (
              <>
                <div className="detail-section">Unlocks After Completion</div>
                <div className="tag-list">
                  {course.unlocks.map(u => <span key={u} className="dtag unlock">{u}</span>)}
                </div>
              </>
            )}

            <div className="divider" />

            <div className="reddit-section">
              <div className="reddit-header">
                <div className="reddit-logo" dangerouslySetInnerHTML={{ __html: REDDIT_LOGO }} />
                <div className="reddit-title">Student Reviews from r/UBC</div>
              </div>
              <div className="review-list">
                {course.reviews.map((r, i) => (
                  <div key={i} className="review-item">
                    <div className="review-meta">
                      <div className="review-mini-logo" dangerouslySetInnerHTML={{ __html: REDDIT_MINI }} />
                      <span className="review-user">{r.user}</span>
                    </div>
                    <div className="review-text">{r.text}</div>
                    <div className="upvote-row">
                      <button className="upvote-btn">▲ {r.upvotes}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
