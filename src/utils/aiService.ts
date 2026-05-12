/**
 * aiService.ts
 * Centralized AI utility for Affiliance — uses Gemini multimodal
 */

const GEMINI_MODEL = 'gemini-2.5-flash-lite'
const GEMINI_KEY   = () => (import.meta as any).env.VITE_GEMINI_API_KEY as string

// ─── Core Gemini call ────────────────────────────────────────────────────────

async function callGemini(prompt: string): Promise<string> {
  const key = GEMINI_KEY()
  if (!key) throw new Error('VITE_GEMINI_API_KEY is not set in .env')

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
  if (!key) throw new Error('VITE_GEMINI_API_KEY is not set in .env')

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

  const raw = await callGeminiWithFile(base64, mimeType, prompt)

  // Parse JSON safely
  try {
    const clean = raw.replace(/```json|```/g, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    return JSON.parse(jsonMatch ? jsonMatch[0] : clean)
  } catch {
    // Fallback if parsing fails
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

  const raw = await callGeminiWithFile(base64, mimeType, prompt)

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

  const raw = await callGemini(prompt)

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