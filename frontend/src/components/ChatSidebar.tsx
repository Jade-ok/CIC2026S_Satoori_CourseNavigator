import { useEffect, useRef, useState } from 'react'

interface Message {
  type: 'ai' | 'user'
  content: string
  isTyping?: boolean
}

interface Props {
  onRevealMap: () => void
}

export default function ChatSidebar({ onRevealMap }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const chatStep = useRef(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addAI = (content: string, isTyping = false) => {
    setMessages(prev => [...prev, { type: 'ai', content, isTyping }])
  }

  const addUser = (content: string) => {
    setMessages(prev => [...prev, { type: 'user', content }])
  }

  const removeTyping = () => {
    setMessages(prev => prev.filter(m => !m.isTyping))
  }

  const runAnalysis = () => {
    addAI('AI Coordinator is planning your recommended path . . . 🔍', true)
    setTimeout(() => {
      removeTyping()
      setMessages(prev => [
        ...prev,
        { type: 'ai', content: "✅ Analysis complete! Based on your completed courses and goals, here's what I recommend:" },
      ])
      onRevealMap()
    }, 2400)
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { type: 'ai', content: "📌 <strong>Top priorities for next semester:</strong><br><br>1️⃣ <strong>MATH 221</strong> — Linear algebra is the math backbone of ML<br>2️⃣ <strong>CPSC 221</strong> — Unlocks most upper-level CS courses<br>3️⃣ <strong>CPSC 330</strong> — Hands-on ML with Python, lower barrier to entry" },
      ])
    }, 3600)
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { type: 'ai', content: "🎯 After those three, <strong>CPSC 340 (Machine Learning)</strong> opens up — the most career-relevant course for big tech interviews.<br><br>Check the map — yellow courses are your <strong>AI-recommended picks</strong>! 👉" },
      ])
      chatStep.current = 4
    }, 4900)
  }

  const processStep = (_text: string) => {
    if (chatStep.current === 1) {
      chatStep.current = 2
      setShowUpload(false)
      setTimeout(() => {
        addAI('For a more accurate analysis, please <strong>upload your transcript PDF</strong>, or type your completed courses in the chat. 📋')
        setShowUpload(true)
      }, 500)
    } else if (chatStep.current === 2) {
      chatStep.current = 3
      setShowUpload(false)
      setTimeout(runAnalysis, 300)
    } else if (chatStep.current === 4) {
      setTimeout(() => {
        addAI('Feel free to ask anything else! Click any course on the map to see details and real student reviews. 🗺️')
      }, 400)
    }
  }

  const sendMessage = () => {
    const text = inputVal.trim()
    if (!text) return
    setInputVal('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    addUser(text)
    setShowUpload(false)
    processStep(text)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handlePDFUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setShowUpload(false)
    addUser(`📄 ${file.name}`)
    chatStep.current = 3
    setTimeout(runAnalysis, 300)
  }

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 80) + 'px'
  }

  // Start chat on mount
  useEffect(() => {
    setTimeout(() => {
      addAI("Hey there! 👋 I'm your UBC AI Course Coordinator.<br>I'll help you find the best course path for your goals.")
      setTimeout(() => {
        addAI('What\'s your career goal or area of interest?<div class="hint-text">e.g. "I want to become an AI/ML engineer, aiming for a big tech job after graduation. I prefer hands-on courses over heavy math."</div>')
        chatStep.current = 1
      }, 900)
    }, 500)
  }, [])

  return (
    <aside className="chat-sidebar">
      <div className="chat-box">
        <div className="chat-header">
          <div className="chat-avatar">
            🎓
            <div className="online-dot" />
          </div>
          <div>
            <div className="chat-header-name">AI Coordinator</div>
            <div className="chat-header-status">Online · UBC Course Navigator</div>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg, i) =>
            msg.type === 'ai' ? (
              <div key={i} className="msg ai">
                <div className="msg-avatar">🎓</div>
                {msg.isTyping ? (
                  <div className="typing-bubble">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <span className="typing-label">{msg.content}</span>
                  </div>
                ) : (
                  <div className="msg-bubble" dangerouslySetInnerHTML={{ __html: msg.content }} />
                )}
              </div>
            ) : (
              <div key={i} className="msg user">
                <div className="msg-bubble">{msg.content}</div>
              </div>
            )
          )}
          <div ref={messagesEndRef} />
        </div>

        {showUpload && (
          <div className="quick-replies">
            <label className="upload-chip">
              📄 Upload Transcript PDF
              <input
                type="file"
                accept=".pdf"
                onChange={handlePDFUpload}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
              />
            </label>
          </div>
        )}

        <div className="chat-input-area">
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder="Type a message..."
            rows={1}
            value={inputVal}
            onChange={e => { setInputVal(e.target.value); autoResize(e.target) }}
            onKeyDown={handleKey}
          />
          <button className="send-btn" onClick={sendMessage}>➤</button>
        </div>
      </div>
    </aside>
  )
}
