/**
 * LearnSphere AI Learning Assistant - Qubrid Platform Integration
 * 
 * Setup:
 * 1. Get your API key from https://platform.qubrid.com/
 * 2. Add VITE_QUBRID_API_KEY=your_api_key_here to your .env file
 * 3. Restart the dev server
 * 
 * Uses Qubrid's OpenAI-compatible endpoint with Llama 3.3 70B Instruct.
 */

const QUBRID_API_KEY = import.meta.env.VITE_QUBRID_API_KEY || '';

// Qubrid OpenAI-compatible endpoint
// In development, we use Vite proxy to avoid CORS issues
// The proxy rewrites /api/qubrid → https://platform.qubrid.com/api/v1/qubridai
const rawBaseUrl = import.meta.env.VITE_QUBRID_BASE_URL || 'https://platform.qubrid.com/api/v1/qubridai';
const QUBRID_BASE_URL = import.meta.env.DEV ? '/api/qubrid' : rawBaseUrl;

// Model to use — Llama 3.3 70B Instruct (as shown in Qubrid playground)
const MODEL = 'meta-llama/Llama-3.3-70B-Instruct';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 60000; // 60 seconds timeout

// System prompt that constrains the AI to learning-related topics only
const SYSTEM_PROMPT = `You are "LearnSphere AI", an Academic Learning Assistant embedded in the LearnSphere Learning Management System.

Your role:
- You are a supportive, professional academic mentor
- You ONLY help with learning-related topics
- You provide course guidance, study plans, concept explanations, score analysis, and FAQ support
- You motivate learners and help them stay consistent

Capabilities:
1. Course Guidance: Suggest next courses, explain roadmaps, recommend based on skill level
2. Score & Progress Analysis: Analyze performance, suggest improvement areas, motivate
3. Concept Explanation: Explain technical topics clearly with simple examples and short summaries
4. Study Planner: Create weekly study plans, time management suggestions
5. FAQ: Course availability, certification info, enrollment help

Rules:
- NEVER discuss topics unrelated to education, learning, courses, or academic growth
- If asked about unrelated topics, politely redirect to learning-related assistance
- Keep responses concise, structured, and actionable
- Use bullet points and numbered lists for clarity
- Be encouraging and supportive in tone
- Format responses with markdown when helpful

Tone: Professional, supportive, motivating, structured.
You represent a university-grade Academic Intelligence Layer.`;

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

/**
 * Build the messages array for the OpenAI-compatible chat completions API.
 */
function buildMessages(
    message: string,
    conversationHistory: ChatMessage[]
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Add conversation history (last 10 messages to stay within context window)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
        messages.push({
            role: msg.role,
            content: msg.content,
        });
    }

    // Add the current user message
    messages.push({ role: 'user', content: message });

    return messages;
}

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function askAI(
    message: string,
    conversationHistory: ChatMessage[] = []
): Promise<string> {
    if (!QUBRID_API_KEY || QUBRID_API_KEY === 'your_qubrid_api_key_here') {
        console.error('❌ [LearnSphere AI] API key is missing or invalid in environment variables. Please check your .env file.');
        throw new Error('AI Assistant API key is missing. Please configure VITE_QUBRID_API_KEY.');
    }

    try {
        const chatMessages = buildMessages(message, conversationHistory);

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const url = `${QUBRID_BASE_URL}/chat/completions`;

                console.log(`[LearnSphere AI] Sending request to ${url} (attempt ${attempt + 1}/${MAX_RETRIES + 1})...`);

                const response = await fetchWithTimeout(
                    url,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${QUBRID_API_KEY}`,
                        },
                        body: JSON.stringify({
                            model: MODEL,
                            messages: chatMessages,
                            max_tokens: 4096,
                            temperature: 0.7,
                            top_p: 0.9,
                            stream: false,
                        }),
                    },
                    REQUEST_TIMEOUT_MS
                );

                // Rate limited — wait and retry
                if (response.status === 429) {
                    console.warn(`[Learnsphere AI] Rate limited, attempt ${attempt + 1}/${MAX_RETRIES + 1}`);
                    if (attempt < MAX_RETRIES) {
                        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
                        continue;
                    }
                    return "⏳ **Rate limit reached.**\n\nThe AI service is receiving too many requests. Please wait a moment and try again.";
                }

                // Model is loading or temporarily unavailable
                if (response.status === 503) {
                    console.warn(`[Learn2PSG AI] Service temporarily unavailable, attempt ${attempt + 1}/${MAX_RETRIES + 1}`);
                    if (attempt < MAX_RETRIES) {
                        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
                        continue;
                    }
                    return "⏳ **Model is loading.**\n\nThe AI model is warming up. Please wait 20-30 seconds and try again.";
                }

                // Invalid API key
                if (response.status === 401 || response.status === 403) {
                    return "⚠️ **Invalid API Key.**\n\nYour Qubrid API key appears to be invalid or expired.\n\nPlease:\n1. Check your API key at [Qubrid Platform](https://platform.qubrid.com/)\n2. Update `VITE_QUBRID_API_KEY` in your `.env` file\n3. Restart the dev server";
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`[LearnSphere AI] API error response body:`, errorText);

                    let errorData = null;
                    try {
                        errorData = JSON.parse(errorText);
                    } catch (e) {
                        // ignore json parse error
                    }
                    console.error(`[LearnSphere AI] API error details: status ${response.status}`, errorData || errorText);

                    // Handle Qubrid Free Tier Limits natively
                    if (response.status === 400 && errorData?.message?.includes('free inference limit')) {
                        return "💳 **Qubrid API Free Limit Reached**\n\nYour Qubrid API Key has exhausted its free inference quota.\n\nTo continue chatting with LearnSphere AI:\n1. Log into your [Qubrid Platform](https://platform.qubrid.com/)\n2. Add credits to your account.\n3. Come back and continue chatting!";
                    }

                    throw new Error(`API request failed with status ${response.status}: ${errorText}`);
                }

                const data = await response.json();
                console.log('[LearnSphere AI] Response received successfully');

                // Log response structure (safely)
                console.log('[LearnSphere AI] Response structure:', Object.keys(data));

                // Support both Qubrid native format and OpenAI-compatible format
                const text = (data?.content || data?.choices?.[0]?.message?.content || "").trim();

                if (!text) {
                    console.error('[LearnSphere AI] Unexpected AI response format:', {
                        keys: Object.keys(data),
                        model: data?.model,
                        usage: data?.usage
                    });
                    throw new Error('No response text received from Qubrid API');
                }

                return text;
            } catch (fetchError) {
                if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
                    console.warn(`[LearnSphere AI] Request timed out, attempt ${attempt + 1}/${MAX_RETRIES + 1}`);
                } else {
                    console.warn(`[LearnSphere AI] Attempt ${attempt + 1} failed:`, fetchError);
                }

                if (attempt === MAX_RETRIES) {
                    console.error('[LearnSphere AI] All retries exhausted');
                }
            }
        }

        // All retries exhausted
        return "I'm experiencing high demand right now. Please wait a moment and try again. 🎓\n\n_If this keeps happening, please check your API key configuration and try again._";
    } catch (error) {
        console.error('[LearnSphere AI] Fatal error:', error);
        return `I'm having trouble connecting right now. Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your API key configuration and try again.`;
    }
}
