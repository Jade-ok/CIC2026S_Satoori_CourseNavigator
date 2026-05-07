import { useEffect, useRef, useState } from 'react'
import { chat, type ChatResponse } from '../api/courses'

interface Message {
  type: 'ai' | 'user'
  content: string
  isTyping?: boolean
}

interface Props {
  onRevealMap: () => void
  completedCourses: string[]
  onChatResponse: (response: ChatResponse) => void
}

export default function ChatSidebar({ onRevealMap, completedCourses, onChatResponse }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [loading, setLoading] = useState(false)
  const hasStarted = useRef(false)
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

  const sendMessage = async () => {
    const text = inputVal.trim()
    if (!text || loading) return
    setInputVal('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    addUser(text)
    setShowUpload(false)
    setLoading(true)
    addAI('AI Coordinator is analyzing . . . 🔍', true)

    try {
      const response = await chat(text, completedCourses)
      setMessages(prev => prev.filter(m => !m.isTyping))
      addAI(response.message)
      onChatResponse(response)
      onRevealMap()
    } catch (error) {
      setMessages(prev => prev.filter(m => !m.isTyping))
      addAI('Sorry, something went wrong. Please try again. ❌')
      console.error('Chat error:', error)
    } finally {
      setLoading(false)
    }
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
    addAI('PDF uploaded! Type your completed courses (comma-separated) or ask me any questions about your course path. 📋')
  }

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 80) + 'px'
  }

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true
    setTimeout(() => {
      addAI("Hey there! 👋 I'm your UBC AI Course Coordinator.<br>I'll help you find the best course path for your goals.")
      setTimeout(() => {
        addAI('What\'s your career goal or area of interest?<div class="hint-text">e.g. "I want to become an AI/ML engineer, aiming for a big tech job after graduation. I prefer hands-on courses over heavy math."</div>')
        setShowUpload(true)
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
