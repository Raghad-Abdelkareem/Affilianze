/**
 * aiService.ts
 * Centralized AI utility for Affiliance — uses Gemini multimodal
 */

const GEMINI_MODEL = 'gemini-2.5-flash-lite'
const GEMINI_KEY   = () => (import.meta as any).env.VITE_GEMINI_API_KEY as string
const GROQ_KEY     = () => (import.meta as any).env.VITE_GROQ_API_KEY as string

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

async function callAIWithFile(fileBase64: string, mimeType: string, prompt: string, retryCount = 0): Promise<string> {
  try {
    return await callGeminiWithFile(fileBase64, mimeType, prompt)
  } catch (err: any) {
    if (err.message?.includes('429') && retryCount < 1) {
      console.warn('Gemini Vision busy, retrying in 2s...')
      await new Promise(r => setTimeout(r, 2000))
      return await callAIWithFile(fileBase64, mimeType, prompt, retryCount + 1)
    }
    console.warn('Gemini Vision failed, falling back to Groq Vision:', err.message)
    return await callGroqWithFile(fileBase64, mimeType, prompt)
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

async function callGeminiWithFile(
  fileBase64: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  const key = GEMINI_KEY()
  if (!key) throw new Error('VITE_GEMINI_API_KEY missing')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: fileBase64 } },
            { text: prompt }
          ]
        }],
        generationConfig: { maxOutputTokens: 1024, temperature: 0.3 }
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

async function callGroqWithFile(
  fileBase64: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  const key = GROQ_KEY()
  if (!key) throw new Error('VITE_GROQ_API_KEY missing')

  // PDF to Text fallback for Groq since it doesn't support PDF directly easily via simple chat API
  // But for images, we use Llama-4-Scout (Multimodal)
  const model = mimeType.includes('pdf') ? 'llama-3.3-70b-versatile' : 'meta-llama/llama-4-scout-17b-16e-instruct'
  
  const content: any[] = [{ type: 'text', text: prompt }]
  if (!mimeType.includes('pdf')) {
    content.push({ type: 'image_url', image_url: { url: `data:${mimeType};base64,${fileBase64}` } })
  } else {
    // If PDF, we can't send it to Groq directly as image, we just send the prompt
    // In a real app, we'd use a PDF parser here. For now, it will just try to analyze text context.
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content }],
      temperature: 0.2,
      max_tokens: 1024
    })
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data?.choices?.[0]?.message?.content || ''
}

// ─── File to base64 ──────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
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
  const base64   = await fileToBase64(file)
  const mimeType = file.type || 'application/pdf'

  const prompt = `
You are an expert HR analyst for an affiliate marketing platform.
Analyze this CV/Resume document and extract the following information.
Return ONLY a valid JSON object — no markdown, no code fences, no explanation:

{
  "fullName": "Full name of the person (or empty string if not found)",
  "bio": "A professional 2-3 sentence bio in first person, max 300 characters, suitable for an affiliate marketing profile",
  "niche": "Comma-separated list of 3-5 marketing niches that match this person (e.g. Fashion & Beauty, Technology, Health & Fitness)",
  "skills": "Comma-separated list of 5-8 key marketing and professional skills extracted from the CV",
  "experienceLevel": "Junior or Mid-Level or Senior",
  "summary": "One sentence describing this person's overall profile"
}

Be specific. Extract real information from the document.
  `.trim()

  const raw = await callAIWithFile(base64, mimeType, prompt)

  // Parse JSON safely
  try {
    const clean = raw.replace(/```json|```/g, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean)
    
    // Ensure we have at least some data, otherwise trigger fallback
    if (!parsed.skills && !parsed.niche && !parsed.bio) {
       throw new Error('Empty AI response')
    }

    return {
      fullName: parsed.fullName || '',
      bio: parsed.bio || 'Professional marketer',
      niche: parsed.niche || 'Digital Marketing',
      skills: parsed.skills || 'Marketing',
      experienceLevel: parsed.experienceLevel || 'Mid-Level',
      summary: parsed.summary || 'Ready for affiliate campaigns'
    }
  } catch {
    // Fallback if parsing fails or result is empty
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
  const base64   = await fileToBase64(file)
  const mimeType = file.type || 'image/jpeg'

  const prompt = `
You are a document verification specialist.
Analyze this ID document image and extract the following information. 
Respond ONLY in JSON format (no markdown):

{
  "isValid": true or false (is this a legitimate government-issued ID card or passport?),
  "name": "Full name visible on the ID, or 'not readable' if unclear",
  "idNumber": "The unique ID number/National ID, or null if not readable",
  "address": "The address visible on the ID, or null if not readable",
  "message": "A friendly 1-2 sentence message. If valid: confirm it looks like a valid ID. If invalid: explain the issue (blurry, not an ID, expired, etc.)"
}

Be professional and privacy-conscious.
  `.trim()

  const raw = await callAIWithFile(base64, mimeType, prompt)

  try {
    const clean = raw.replace(/```json|```/g, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    return JSON.parse(jsonMatch ? jsonMatch[0] : clean)
  } catch {
    return {
      isValid: false,
      name: 'Not readable',
      message: 'Could not process the document. Please upload a clear image of your National ID.'
    }
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