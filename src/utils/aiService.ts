/**
 * aiService.ts
 * Centralized AI utility for Affiliance — uses Gemini multimodal
 */

const GEMINI_MODEL = 'gemini-2.5-flash-lite'
const GEMINI_KEY   = () => (import.meta as any).env.VITE_GEMINI_API_KEY as string
const GROQ_KEY     = () => (import.meta as any).env.VITE_GROQ_API_KEY as string
const HF_AI_BASE   = () => ((import.meta as any).env.VITE_HF_AI_BASE_URL as string) || 'https://swordha5-aiproject.hf.space'
const HF_CV_ANALYSIS_BASE = () => ((import.meta as any).env.VITE_HF_CV_ANALYSIS_URL as string) || 'https://swordha-cvanalysis.hf.space'

export interface PersonalityTestServiceResult {
  personalityScore?: number
  personalityType?: string | null
  description?: string | null
  testDate?: string
}

function booleanAnswerFromScale(value: number): boolean {
  return value >= 4
}

function computePersonalityScoreFromResponse(data: any): number {
  const numericValues: number[] = []
  const dimensions = data?.dimensions || {}
  const mapping = data?.big_five_mapping || {}

  for (const value of Object.values(dimensions)) {
    if (typeof value === 'number') numericValues.push(value)
  }
  for (const value of Object.values(mapping)) {
    if (typeof value === 'number') numericValues.push(value)
  }

  if (numericValues.length === 0) return 85
  return Math.round(numericValues.reduce((sum, n) => sum + n, 0) / numericValues.length)
}

export async function submitPersonalityTest(
  answers: Record<number, number>
): Promise<PersonalityTestServiceResult> {
  const ordered = Object.keys(answers)
    .map(Number)
    .sort((a, b) => a - b)
    .map((questionId) => booleanAnswerFromScale(answers[questionId]))

  if (ordered.length === 0) {
    throw new Error('Please answer all personality questions before submitting.')
  }

  const res = await fetch(`${HF_AI_BASE()}/api/v1/personality/analyze-personality`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers: ordered })
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.detail || data?.message || 'Personality API failed')
  }

  return {
    personalityType: data?.mbti_type || null,
    personalityScore: computePersonalityScoreFromResponse(data),
    description: data?.marketing_explanation || data?.personality_summary || (data?.marketing_categories ? data.marketing_categories.join(', ') : null),
    testDate: new Date().toISOString()
  }
}

export interface CVGenerateRequest {
  personal: {
    name: string
    email: string
    phone: string
    linkedin?: string | null
    github?: string | null
    location?: string | null
    website?: string | null
    summary?: string | null
  }
  education?: Array<{
    institution: string
    degree?: string | null
    field?: string | null
    start_date?: string | null
    end_date?: string | null
    gpa?: string | null
    achievements?: string[] | null
  }> | null
  experience?: Array<{
    company: string
    title?: string | null
    start_date?: string | null
    end_date?: string | null
    location?: string | null
    bullets?: string[] | null
  }> | null
  skills?: {
    technical?: string[] | null
    soft?: string[] | null
    tools?: string[] | null
  } | null
  projects?: Array<{
    name: string
    description?: string | null
    tech_stack?: string[] | null
    url?: string | null
    bullets?: string[] | null
  }> | null
  certifications?: Array<{
    name: string
    issuer?: string | null
    date?: string | null
    url?: string | null
  }> | null
  target_job_title?: string | null
}

export interface CVGenerateResponse {
  cv_text: string
  ats_score: number
  ats_grade: string
  ats_breakdown?: any | null
  matched_keywords?: string[] | null
  missing_keywords?: string[] | null
  suggestions?: string[] | null
  pdf_url?: string | null
  download_filename?: string | null
}

export async function generateCVWithAI(request: CVGenerateRequest): Promise<CVGenerateResponse> {
  const res = await fetch(`${HF_AI_BASE()}/api/v1/cv/generate-cv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.detail || data?.message || 'CV generation failed')
  }

  return data
}

export async function downloadCVFromAI(filename: string): Promise<Blob> {
  const res = await fetch(`${HF_AI_BASE()}/api/v1/cv/download-cv/${encodeURIComponent(filename)}`)
  if (!res.ok) {
    let message = 'CV download failed'
    try {
      const errorData = await res.json()
      message = errorData?.detail || errorData?.message || message
    } catch {
      // ignore non-json error body
    }
    throw new Error(message)
  }
  return await res.blob()
}

// ─── Core AI Calls with Fallback ──────────────────────────────────────────────

async function callAI(prompt: string, retryCount = 0): Promise<string> {
  try {
    return await callGemini(prompt)
  } catch (err: any) {
    if (err.message?.includes('429') && retryCount < 1) {
      console.warn('Gemini busy, retrying in 2s...')
      await new Promise(r => setTimeout(r, 2000))
      return await callAI(prompt, retryCount + 1)
    }
    console.warn('Gemini failed, falling back to Groq:', err.message)
    return await callGroq(prompt)
  }
}

// ─── Gemini Implementations ──────────────────────────────────────────────────

async function callGemini(prompt: string): Promise<string> {
  const key = GEMINI_KEY()
  if (!key) throw new Error('VITE_GEMINI_API_KEY missing')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1024, temperature: 0.4 }
      })
    }
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from Gemini')
  return text
}

// ─── Groq Implementations (Fallback) ──────────────────────────────────────────

async function callGroq(prompt: string): Promise<string> {
  const key = GROQ_KEY()
  if (!key) throw new Error('VITE_GROQ_API_KEY missing')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 1024
    })
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data?.choices?.[0]?.message?.content || ''
}

// ─── CV Analysis ─────────────────────────────────────────────────────────────

export interface CVAnalysisResult {
  fullName: string
  bio: string
  niche: string
  skills: string
  experienceLevel: string
  summary: string
}

export async function analyzeCVWithAI(file: File): Promise<CVAnalysisResult> {
  try {
    // Use HF CV Analysis endpoint with multipart form data
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${HF_CV_ANALYSIS_BASE()}/api/analyze-cv`, {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData?.detail || errorData?.message || `CV analysis failed: ${res.status}`)
    }

    const data = await res.json()

    // Map HF API response to CVAnalysisResult
    return {
      fullName: data.fullName || data.full_name || '',
      bio: data.bio || data.professional_summary || 'Professional marketer',
      niche: data.niche || data.marketing_niches || 'Digital Marketing',
      skills: data.skills || 'Marketing',
      experienceLevel: data.experienceLevel || data.experience_level || 'Mid-Level',
      summary: data.summary || 'Ready for affiliate campaigns'
    }
  } catch (err: any) {
    console.error('CV Analysis error:', err)
    // Fallback if analysis fails
    return {
      fullName: '',
      bio: 'A passionate digital marketer with experience in content creation and audience growth.',
      niche: 'Digital Marketing, Social Media, E-commerce',
      skills: 'Content Creation, SEO, Social Media Marketing, Analytics, Copywriting',
      experienceLevel: 'Mid-Level',
      summary: 'A versatile marketer well-suited for affiliate campaigns.'
    }
  }
}

// ─── National ID Verification ─────────────────────────────────────────────────

export interface IDVerificationResult {
  isValid: boolean
  name: string
  idNumber?: string
  address?: string
  message: string
}

export async function verifyNationalIDWithAI(file: File): Promise<IDVerificationResult> {
  const buildForm = () => {
    const formData = new FormData()
    formData.append('file', file)
    return formData
  }

  const localUrl = '/api/v1/id/verify-id'
  const externalUrl = `${HF_AI_BASE()}/api/v1/id/verify-id`

  let res: Response
  try {
    res = await fetch(localUrl, { method: 'POST', body: buildForm() })
    if (!res.ok && res.status === 404) {
      throw new Error('Local API route not found')
    }
  } catch (localErr) {
    try {
      res = await fetch(externalUrl, { method: 'POST', body: buildForm() })
    } catch (externalErr) {
      throw new Error('ID verification service unavailable. Please check the backend or internet connection.')
    }
  }

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.detail || data?.message || 'ID verification failed')
  }

  const idData = data?.data || {}
  const fullName = idData?.full_name || idData?.first_name ? `${idData.first_name || ''} ${idData.last_name || ''}`.trim() : 'Not readable'

  return {
    isValid: data?.verified ?? false,
    name: fullName || 'Not readable',
    idNumber: idData?.national_id || undefined,
    address: idData?.address || undefined,
    message: data?.message || (data?.verified ? 'ID verified successfully.' : 'ID could not be verified. Please provide a clear image.')
  }
}

// ─── Post Generator ───────────────────────────────────────────────────────────

export interface GeneratedPostResult {
  platform: string
  content: string
  hashtags: string
}

export async function generateMarketingPosts(
  campaignTitle: string,
  campaignDescription: string,
  customContext?: string
): Promise<GeneratedPostResult[]> {
  const prompt = `
You are an expert social media marketer. Create 3 unique marketing posts for different platforms.

Campaign: ${campaignTitle}
Description: ${campaignDescription}
${customContext ? `Additional Context: ${customContext}` : ''}

Return ONLY a valid JSON array (no markdown, no explanation):
[
  {"platform": "Instagram", "content": "engaging post with emojis (2-3 paragraphs)", "hashtags": "#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5"},
  {"platform": "Twitter",   "content": "concise tweet under 280 chars with emojis",   "hashtags": "#hashtag1 #hashtag2 #hashtag3"},
  {"platform": "LinkedIn",  "content": "professional post (2-3 paragraphs)",           "hashtags": "#hashtag1 #hashtag2 #hashtag3 #hashtag4"}
]
  `.trim()

  const raw = await callAI(prompt)

  try {
    const clean = raw.replace(/```json|```/g, '').trim()
    const jsonMatch = clean.match(/\[[\s\S]*\]/)
    return JSON.parse(jsonMatch ? jsonMatch[0] : clean)
  } catch {
    return [
      { platform: 'Instagram', content: `🔥 ${campaignTitle} is here! Don't miss your chance. 💰`, hashtags: '#affiliate #marketing #opportunity' },
      { platform: 'Twitter',   content: `💰 Join ${campaignTitle} and start earning today! 🚀`,    hashtags: '#affiliate #marketing' },
      { platform: 'LinkedIn',  content: `Excited to share: ${campaignTitle} — a great opportunity for marketers.`, hashtags: '#marketing #growth' }
    ]
  }
}

// ─── Translation Tool ─────────────────────────────────────────────────────────

export async function translatePostToArabic(content: string, hashtags: string): Promise<{ content: string; hashtags: string }> {
  const prompt = `
Translate the following marketing post to professional Arabic. 
1. Translate the main content to engaging Arabic, preserving emojis and structure.
2. Translate/adapt the hashtags to relevant Arabic marketing hashtags.

Return ONLY a valid JSON object:
{
  "content": "translated content here",
  "hashtags": "#hashtag1 #hashtag2 ..."
}

Content:
${content}

Hashtags:
${hashtags}
  `.trim()

  const raw = await callAI(prompt)
  try {
    const clean = raw.replace(/```json|```/g, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean)
    return {
      content: parsed.content || content,
      hashtags: parsed.hashtags || hashtags
    }
  } catch {
    return { content, hashtags }
  }
}