import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Search, Plus, X, Copy, Edit2, Trash2, Tag, ExternalLink, Check } from 'lucide-react'
import './App.css'

// Categories for prompts
const CATEGORIES = [
  'Design',
  'Writing',
  'Analysis',
  'Coding',
  'Data',
  'Business',
  'Marketing',
  'Research',
  'Other'
]

// AI Platforms
const PLATFORMS = [
  'Claude',
  'ChatGPT',
  'Gemini',
  'General'
]

function App() {
  const [prompts, setPrompts] = useState([])
  const [filteredPrompts, setFilteredPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('browse') // 'browse' or 'add' or 'detail'
  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [copiedId, setCopiedId] = useState(null)
  
  // Smart Import state
  const [importMode, setImportMode] = useState('smart') // 'smart' or 'manual'
  const [pastedText, setPastedText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    prompt_text: '',
    category: 'Other',
    platforms: [],
    tags: '',
    source: '',
    notes: ''
  })

  // Load prompts on mount
  useEffect(() => {
    loadPrompts()
  }, [])

  // Filter prompts when search/filters change
  useEffect(() => {
    filterPrompts()
  }, [prompts, searchQuery, categoryFilter, platformFilter])

  async function loadPrompts() {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setPrompts(data || [])
    } catch (error) {
      console.error('Error loading prompts:', error)
      alert('Error loading prompts. Make sure your Supabase is configured.')
    } finally {
      setLoading(false)
    }
  }

  function filterPrompts() {
    let filtered = [...prompts]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(query) ||
        p.prompt_text?.toLowerCase().includes(query) ||
        p.tags?.toLowerCase().includes(query) ||
        p.notes?.toLowerCase().includes(query) ||
        p.source?.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter)
    }

    // Platform filter
    if (platformFilter !== 'all') {
      filtered = filtered.filter(p => p.platforms?.includes(platformFilter))
    }

    setFilteredPrompts(filtered)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('prompts')
        .insert([{
          title: formData.title,
          prompt_text: formData.prompt_text,
          category: formData.category,
          platforms: formData.platforms,
          tags: formData.tags,
          source: formData.source,
          notes: formData.notes
        }])

      if (error) throw error

      // Reset form
      setFormData({
        title: '',
        prompt_text: '',
        category: 'Other',
        platforms: [],
        tags: '',
        source: '',
        notes: ''
      })

      // Reload prompts and go back to browse
      await loadPrompts()
      setView('browse')
    } catch (error) {
      console.error('Error adding prompt:', error)
      alert('Error adding prompt')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this prompt?')) return

    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadPrompts()
      setView('browse')
      setSelectedPrompt(null)
    } catch (error) {
      console.error('Error deleting prompt:', error)
      alert('Error deleting prompt')
    }
  }

  async function handleUpdate(id, updates) {
    try {
      const { error } = await supabase
        .from('prompts')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      await loadPrompts()
    } catch (error) {
      console.error('Error updating prompt:', error)
      alert('Error updating prompt')
    }
  }

  function handleCopy(text, id) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function togglePlatform(platform) {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }))
  }

  async function parseWithAI() {
    if (!pastedText.trim()) {
      alert('Please paste some text to parse')
      return
    }

    setParsing(true)
    
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Analyze this text and extract prompt information. Return ONLY a JSON object with these fields:
- title: A short, descriptive title for this prompt (string)
- prompt_text: The actual prompt text, cleaned up (string)
- category: Pick ONE from: Design, Writing, Analysis, Coding, Data, Business, Marketing, Research, Other (string)
- platforms: Array of applicable platforms from: Claude, ChatGPT, Gemini, General (array of strings)
- tags: Relevant keywords/topics, comma-separated (string)
- source: Where this came from - detect if it's from Twitter/LinkedIn/etc and include author if visible (string)
- notes: Any additional context about when/why to use this (string)

Text to analyze:
${pastedText}

Return ONLY the JSON object, no other text.`
            }
          ],
        })
      })

      const data = await response.json()
      const text = data.content[0].text
      
      // Clean up the response - remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim()
      const parsedData = JSON.parse(cleanText)
      
      // Update form with parsed data
      setFormData({
        title: parsedData.title || '',
        prompt_text: parsedData.prompt_text || pastedText,
        category: parsedData.category || 'Other',
        platforms: Array.isArray(parsedData.platforms) ? parsedData.platforms : [],
        tags: parsedData.tags || '',
        source: parsedData.source || '',
        notes: parsedData.notes || ''
      })
      
      setParsed(true)
      setImportMode('manual') // Switch to manual mode so they can review/edit
      
    } catch (error) {
      console.error('Error parsing with AI:', error)
      alert('Error parsing the text. Please try manual entry or check the console for details.')
    } finally {
      setParsing(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading your prompt library...</p>
      </div>
    )
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="logo">Prompt Library</h1>
          <button 
            className="btn-primary"
            onClick={() => setView(view === 'add' ? 'browse' : 'add')}
          >
            {view === 'add' ? <X size={18} /> : <Plus size={18} />}
            {view === 'add' ? 'Cancel' : 'Add Prompt'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        {view === 'browse' && (
          <>
            {/* Search and Filters */}
            <div className="search-section">
              <div className="search-bar">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filters">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Platforms</option>
                  {PLATFORMS.map(plat => (
                    <option key={plat} value={plat}>{plat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prompt Grid */}
            <div className="prompt-grid">
              {filteredPrompts.length === 0 ? (
                <div className="empty-state">
                  <p>No prompts found. {prompts.length === 0 ? 'Add your first prompt to get started!' : 'Try adjusting your filters.'}</p>
                </div>
              ) : (
                filteredPrompts.map(prompt => (
                  <div 
                    key={prompt.id} 
                    className="prompt-card"
                    onClick={() => {
                      setSelectedPrompt(prompt)
                      setView('detail')
                    }}
                  >
                    <div className="prompt-card-header">
                      <h3>{prompt.title || 'Untitled Prompt'}</h3>
                      <span className="category-badge">{prompt.category}</span>
                    </div>
                    
                    <p className="prompt-preview">
                      {prompt.prompt_text?.substring(0, 150)}
                      {prompt.prompt_text?.length > 150 ? '...' : ''}
                    </p>

                    {prompt.platforms?.length > 0 && (
                      <div className="platforms">
                        {prompt.platforms.map(p => (
                          <span key={p} className="platform-tag">{p}</span>
                        ))}
                      </div>
                    )}

                    {prompt.tags && (
                      <div className="tags">
                        <Tag size={14} />
                        <span>{prompt.tags}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {view === 'add' && (
          <div className="add-form-container">
            <h2>Add New Prompt</h2>
            
            {/* Mode Toggle */}
            <div className="mode-toggle">
              <button
                className={`mode-btn ${importMode === 'smart' ? 'active' : ''}`}
                onClick={() => setImportMode('smart')}
              >
                ✨ Smart Import
              </button>
              <button
                className={`mode-btn ${importMode === 'manual' ? 'active' : ''}`}
                onClick={() => setImportMode('manual')}
              >
                Manual Entry
              </button>
            </div>

            {importMode === 'smart' ? (
              /* Smart Import Interface */
              <div className="smart-import">
                <div className="import-instructions">
                  <p>Paste any prompt from Twitter, LinkedIn, or anywhere else. AI will automatically parse and organize it for you.</p>
                </div>
                
                <textarea
                  className="paste-area"
                  rows={15}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste your prompt here (including the full tweet, post, or any context)..."
                />

                <button
                  onClick={parseWithAI}
                  disabled={parsing || !pastedText.trim()}
                  className="btn-primary btn-large btn-parse"
                >
                  {parsing ? (
                    <>
                      <div className="spinner-small"></div>
                      Parsing with AI...
                    </>
                  ) : (
                    <>
                      ✨ Parse with AI
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Manual Entry Form */
              <form onSubmit={handleSubmit} className="add-form">
                {parsed && (
                  <div className="parsed-notice">
                    ✨ AI parsed your prompt! Review and edit before saving.
                  </div>
                )}
                
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., UI Design Mega Prompt"
                  />
                </div>

                <div className="form-group">
                  <label>Prompt Text *</label>
                  <textarea
                    required
                    rows={12}
                    value={formData.prompt_text}
                    onChange={(e) => setFormData({...formData, prompt_text: e.target.value})}
                    placeholder="Paste the full prompt here..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Platforms</label>
                  <div className="platform-checkboxes">
                    {PLATFORMS.map(platform => (
                      <label key={platform} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.platforms.includes(platform)}
                          onChange={() => togglePlatform(platform)}
                        />
                        <span>{platform}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    placeholder="e.g., product design, web, mobile"
                  />
                </div>

                <div className="form-group">
                  <label>Source / Author</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({...formData, source: e.target.value})}
                    placeholder="e.g., Louis Gleeson, Twitter"
                  />
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="When to use this, why it's good, etc."
                  />
                </div>

                <button type="submit" className="btn-primary btn-large">
                  Save Prompt
                </button>
              </form>
            )}
          </div>
        )}

        {view === 'detail' && selectedPrompt && (
          <div className="detail-view">
            <button 
              className="back-button"
              onClick={() => {
                setView('browse')
                setSelectedPrompt(null)
              }}
            >
              ← Back to Library
            </button>

            <div className="detail-header">
              <div>
                <h2>{selectedPrompt.title}</h2>
                <span className="category-badge">{selectedPrompt.category}</span>
              </div>
              <div className="detail-actions">
                <button
                  onClick={() => handleDelete(selectedPrompt.id)}
                  className="btn-danger"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {selectedPrompt.platforms?.length > 0 && (
              <div className="detail-platforms">
                {selectedPrompt.platforms.map(p => (
                  <span key={p} className="platform-tag">{p}</span>
                ))}
              </div>
            )}

            <div className="prompt-text">
              <pre>{selectedPrompt.prompt_text}</pre>
            </div>

            <div className="copy-section">
              <button
                onClick={() => handleCopy(selectedPrompt.prompt_text, selectedPrompt.id)}
                className="btn-copy-prompt"
              >
                {copiedId === selectedPrompt.id ? (
                  <>
                    <Check size={20} />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy size={20} />
                    Copy This Prompt
                  </>
                )}
              </button>
              {copiedId === selectedPrompt.id && (
                <p className="copy-hint">Now paste it into Claude, ChatGPT, or Gemini</p>
              )}
            </div>

            {selectedPrompt.tags && (
              <div className="detail-section">
                <h3>Tags</h3>
                <p>{selectedPrompt.tags}</p>
              </div>
            )}

            {selectedPrompt.source && (
              <div className="detail-section">
                <h3>Source</h3>
                <p>{selectedPrompt.source}</p>
              </div>
            )}

            {selectedPrompt.notes && (
              <div className="detail-section">
                <h3>Notes</h3>
                <p>{selectedPrompt.notes}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App