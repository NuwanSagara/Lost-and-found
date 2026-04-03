const AnthropicModule = require('@anthropic-ai/sdk');

const Anthropic = AnthropicModule.default || AnthropicModule;

const TEXT_SYSTEM_PROMPT = `You are an item matching engine for a university lost and found system.
You will receive two item descriptions. Determine how likely they refer to the same physical object.

Consider synonyms, color variations, and vague descriptions:
- "black water bottle" ~= "dark flask" ~= "matte black tumbler"
- "AirPods" ~= "white earbuds" ~= "apple earphones"
- "blue JanSport" ~= "navy backpack with patches"
- "spectacles" ~= "glasses" ~= "eyewear"

Respond ONLY with valid JSON. No markdown. No extra text:
{
  "score": <number 0-100>,
  "reason": "<one sentence>",
  "key_matches": ["<matched attribute>"],
  "confidence": "<low|medium|high>"
}`;

const IMAGE_SYSTEM_PROMPT = `You are a visual item matching engine for a lost and found system.
You receive two images of physical objects. Determine how likely they show the same item.

Focus on: object type, color, size, brand markings, condition,
distinctive features, damage or wear patterns.

Respond ONLY with valid JSON. No markdown. No extra text:
{
  "score": <number 0-100>,
  "visual_matches": ["<feature>"],
  "visual_differences": ["<difference>"],
  "reason": "<one sentence>",
  "confidence": "<low|medium|high>"
}`;

const textFallback = {
    score: 0,
    reason: 'AI unavailable',
    key_matches: [],
    confidence: 'low',
    fallback: true,
};

const imageFallback = {
    score: 0,
    reason: 'AI unavailable',
    visual_matches: [],
    visual_differences: [],
    confidence: 'low',
    fallback: true,
};

let anthropicClient = null;

const getAnthropicClient = () => {
    if (!process.env.ANTHROPIC_API_KEY) {
        return null;
    }

    if (!anthropicClient) {
        anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }

    return anthropicClient;
};

const extractTextResponse = (message) => {
    if (!message || !Array.isArray(message.content)) {
        return '';
    }

    return message.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n')
        .trim();
};

const safeParseClaudeJson = (rawText, fallback) => {
    try {
        return {
            ...fallback,
            ...JSON.parse(String(rawText || '').trim()),
        };
    } catch (error) {
        return fallback;
    }
};

const withTimeout = async (executor) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        return await executor(controller.signal);
    } finally {
        clearTimeout(timeout);
    }
};

const stripDataUrlPrefix = (base64Value) =>
    String(base64Value || '').replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');

const callClaudeTextMatch = async (descA, descB) => {
    const client = getAnthropicClient();

    if (!client) {
        return { ...textFallback };
    }

    try {
        const response = await withTimeout((signal) =>
            client.messages.create(
                {
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 300,
                    system: TEXT_SYSTEM_PROMPT,
                    messages: [
                        {
                            role: 'user',
                            content: `Item A (Lost): ${descA}\nItem B (Found): ${descB}`,
                        },
                    ],
                },
                { signal }
            )
        );

        const parsed = safeParseClaudeJson(extractTextResponse(response), textFallback);
        return {
            ...parsed,
            score: Number(parsed.score) || 0,
            key_matches: Array.isArray(parsed.key_matches) ? parsed.key_matches : [],
            confidence: parsed.confidence || 'low',
            fallback: false,
        };
    } catch (error) {
        console.error('Claude text match failed:', error.message);
        return { ...textFallback };
    }
};

const callClaudeImageMatch = async (base64A, base64B) => {
    const client = getAnthropicClient();

    if (!client) {
        return { ...imageFallback };
    }

    try {
        const response = await withTimeout((signal) =>
            client.messages.create(
                {
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 400,
                    system: IMAGE_SYSTEM_PROMPT,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'image',
                                    source: {
                                        type: 'base64',
                                        media_type: 'image/jpeg',
                                        data: stripDataUrlPrefix(base64A),
                                    },
                                },
                                {
                                    type: 'image',
                                    source: {
                                        type: 'base64',
                                        media_type: 'image/jpeg',
                                        data: stripDataUrlPrefix(base64B),
                                    },
                                },
                                {
                                    type: 'text',
                                    text: 'Are these the same item? Item A was reported lost. Item B was reported found.',
                                },
                            ],
                        },
                    ],
                },
                { signal }
            )
        );

        const parsed = safeParseClaudeJson(extractTextResponse(response), imageFallback);
        return {
            ...parsed,
            score: Number(parsed.score) || 0,
            visual_matches: Array.isArray(parsed.visual_matches) ? parsed.visual_matches : [],
            visual_differences: Array.isArray(parsed.visual_differences)
                ? parsed.visual_differences
                : [],
            confidence: parsed.confidence || 'low',
            fallback: false,
        };
    } catch (error) {
        console.error('Claude image match failed:', error.message);
        return { ...imageFallback };
    }
};

module.exports = {
    callClaudeTextMatch,
    callClaudeImageMatch,
    stripDataUrlPrefix,
};
