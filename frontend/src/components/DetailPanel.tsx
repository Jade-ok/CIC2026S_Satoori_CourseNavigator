import { type Course } from '../api/courses'

const redditData: Record<string, { rating: number; count: number; recommend: number; bullets: [string, string][]; quotes: { sub: string; up: string; text: string }[] }> = {
  "CPSC 340": {
    rating: 4.7, count: 218, recommend: 93,
    bullets: [
      ["pro", "Best ML survey course at UBC — covers everything from linear models to neural nets with solid math foundations."],
      ["pro", "Assignments are challenging but directly map to real ML workflows. Great for building a portfolio."],
      ["con", "Heavy math (linear algebra + probability) — brush up before the term or you'll fall behind fast."],
      ["tip", "Start assignments early. The last 2 are brutal if you leave them to the night before."],
    ],
    quotes: [
      { sub: "r/UBC",     up: "+341", text: "340 is genuinely one of the best courses I've taken. If you want to work in ML/AI, this is non-negotiable." },
      { sub: "r/UBCcsss", up: "+154", text: "The prof makes even gradient descent feel intuitive. Come to lectures, they're worth it." },
    ],
  },
  "_default": {
    rating: 4.3, count: 97, recommend: 81,
    bullets: [
      ["pro", "Great stepping stone toward ML/AI roles — employers recognize UBC's ML curriculum as rigorous."],
      ["con", "Math-heavy. Expect real linear algebra and stats, not just sklearn calls."],
      ["tip", "Pair this with a Kaggle competition on the side — applying concepts in real time locks them in."],
    ],
    quotes: [
      { sub: "r/UBC",     up: "+189", text: "If you're serious about ML, grind through the hard parts. It pays off in interviews." },
      { sub: "r/UBCcsss", up: "+76",  text: "Tough but fair. The assignments actually teach you to think like an ML engineer, not just run libraries." },
    ],
  },
}

const mlEvents = [
  { day: 16, month: "MAY", type: "workshop",   pillLabel: "WORKSHOP",   title: "Intro to PyTorch & Neural Net Training",       host: "UBC ML Club",          loc: "ICCS 246",      time: "10:00 – 15:00" },
  { day: 22, month: "MAY", type: "talk",       pillLabel: "TALK",       title: "LLMs in Production: Lessons from the Trenches", host: "Google DeepMind",      loc: "Online",        time: "13:00 – 14:00" },
  { day: 5,  month: "JUN", type: "networking", pillLabel: "NETWORKING", title: "Vancouver AI/ML Industry Mixer",                host: "UBC CS x Cohere",      loc: "Forum, Nest",   time: "18:00 – 21:00" },
  { day: 14, month: "JUN", type: "conference", pillLabel: "CONFERENCE", title: "ICML 2026 Paper Reading + Watch Party",         host: "Vancouver ML Meetup",  loc: "ICCS X836",     time: "All day" },
]

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  completed:   { bg: "#ECFDF5", color: "#047857", label: "✓ Completed" },
  available:   { bg: "#EFF8FE", color: "#0369A1", label: "Available now" },
  recommended: { bg: "#FEF7E0", color: "#92400E", label: "★ AI Recommended" },
  locked:      { bg: "#F1F5F9", color: "#475569", label: "Locked" },
}

interface Props {
  courseId: string | null
  onClose: () => void
  courses: Record<string, Course>
  courseStates?: Record<string, string>
}

export default function DetailPanel({ courseId, onClose, courses, courseStates = {} }: Props) {
  const course = courseId ? courses[courseId] : null
  const isOpen = !!course

  const status = courseId ? (courseStates[courseId] ?? 'available') : 'available'
  const statusStyle = statusConfig[status] ?? statusConfig.available
  const reddit = courseId ? (redditData[courseId] ?? redditData._default) : redditData._default
  const description = course ? (course.description || course.desc || '') : ''
  const prereqs = course?.prereqs ?? []

  return (
    <>
      <div className={`detail-overlay${isOpen ? ' open' : ''}`} onClick={onClose} />

      <aside className={`detail-drawer${isOpen ? ' open' : ''}`} aria-hidden={!isOpen}>
        <button className="detail-close" onClick={onClose} aria-label="Close">✕</button>

        {course && (
          <div className="detail-scroll">
            <div className="detail-code">{course.code}</div>
            <div className="detail-name">{course.name}</div>
            <span className="detail-tag" style={{ background: statusStyle.bg, color: statusStyle.color }}>
              {statusStyle.label}
            </span>
            {description && <div className="detail-desc">{description}</div>}

            <div className="detail-meta">
              <div className="detail-meta-row">
                <div className="detail-meta-label">Credits</div>
                <div className="detail-meta-value">{course.credits ?? 3} credits</div>
              </div>
              <div className="detail-meta-row">
                <div className="detail-meta-label">Prerequisites</div>
                <div className="detail-meta-value">
                  {prereqs.length > 0
                    ? prereqs.map(p => <span key={p} className="prereq-pill">{p}</span>)
                    : <span className="prereq-none">None</span>}
                </div>
              </div>
            </div>

            {/* Reddit Reviews */}
            <div className="detail-section">
              <div className="section-head">
                <span className="section-icon reddit">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="8" cy="8" r="7" opacity="0.15"/>
                    <path d="M13 7.5a1.4 1.4 0 0 0-2.4-1 6.6 6.6 0 0 0-3.4-1l.6-2.5 1.8.4a1 1 0 1 0 .15-.7l-2-.45a.3.3 0 0 0-.36.22l-.7 3a6.6 6.6 0 0 0-3.4 1A1.4 1.4 0 1 0 2.5 9.1a2.5 2.5 0 0 0-.05.55c0 1.95 2.45 3.55 5.5 3.55s5.5-1.6 5.5-3.55c0-.18-.02-.36-.05-.55A1.4 1.4 0 0 0 13 7.5zM5.5 9a.9.9 0 1 1 1.8 0 .9.9 0 0 1-1.8 0zm5.4 2.4c-.9.6-2.1.85-2.9.85s-2-.25-2.9-.85a.3.3 0 0 1 .35-.5c.7.5 1.7.7 2.55.7s1.85-.2 2.55-.7a.3.3 0 0 1 .35.5zm-.3-1.5a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8z"/>
                  </svg>
                </span>
                <span className="section-title">Student Reviews</span>
                <span className="section-subtitle">{reddit.count} reviews · r/UBC</span>
              </div>

              <div className="reddit-summary">
                <div className="summary-stats">
                  <div className="stat-block">
                    <div className="stat-num">{reddit.rating.toFixed(1)}<span style={{ fontSize: 13, color: 'var(--muted)' }}> / 5</span></div>
                    <div className="stat-label">Avg Rating</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-num">{reddit.recommend}%</div>
                    <div className="stat-label">Would Recommend</div>
                    <div className="sentiment-bar" />
                  </div>
                </div>
                {reddit.bullets.map(([tag, text], i) => (
                  <div key={i} className="summary-bullet">
                    <span className={`bullet-tag ${tag}`}>{tag.toUpperCase()}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              <div className="reddit-quotes">
                {reddit.quotes.map((q, i) => (
                  <div key={i} className="quote-card">
                    <div className="quote-meta">
                      <span className="quote-sub">{q.sub}</span>
                      <span className="quote-up">▲ {q.up}</span>
                    </div>
                    <div className="quote-text">{q.text}</div>
                  </div>
                ))}
              </div>
              <div className="ai-disclaimer">AI-summarized from public Reddit threads · 4h ago</div>
            </div>

            {/* HCI Career Events */}
            <div className="detail-section">
              <div className="section-head">
                <span className="section-icon career">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="12" height="10" rx="1.5"/>
                    <path d="M2 7h12M5.5 2v3M10.5 2v3"/>
                  </svg>
                </span>
                <span className="section-title">ML Career Events</span>
                <span className="section-subtitle">Curated for your goal</span>
              </div>

              {mlEvents.map((e, i) => (
                <div key={i} className="event-card">
                  <div className="event-date">
                    <div className="event-month">{e.month}</div>
                    <div className="event-day">{e.day}</div>
                  </div>
                  <div className="event-body">
                    <span className={`event-pill ${e.type}`}>{e.pillLabel}</span>
                    <div className="event-title">{e.title}</div>
                    <div className="event-meta">
                      <span>🤝 {e.host}</span>
                      <span>📍 {e.loc}</span>
                      <span>🕐 {e.time}</span>
                    </div>
                  </div>
                </div>
              ))}
              <a className="view-all" href="#">View all ML events →</a>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
