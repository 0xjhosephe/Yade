import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import fetch from "node-fetch";

// In-memory cache
// Since instances stay alive for a while, this provides free memory caching per instance.
const cache: Record<string, { data: any; timestamp: number }> = {};

// Helper to check and get from cache
function getFromCache(key: string, ttlMs: number) {
    const cached = cache[key];
    if (cached && Date.now() - cached.timestamp < ttlMs) {
        return cached.data;
    }
    return null;
}

// Helper to set cache
function setCache(key: string, data: any) {
    cache[key] = {
        data,
        timestamp: Date.now(),
    };
}

// Ensure the API key is passed via environment variables during deployment
// firebase functions:secrets:set LUNAR_CRUSH_API_KEY
const lunarApiKey = defineSecret("LUNAR_CRUSH_API_KEY");

/**
 * Callable function to act as a proxy for LunarCrush API
 * Caches responses to reduce rate limit issues.
 */
export const getLunarCrushData = onCall({ secrets: [lunarApiKey] }, async (request: CallableRequest<any>) => {
    const endpoint = request.data.endpoint; // e.g., "/topic/bitcoin/v1"

    if (!endpoint || typeof endpoint !== 'string') {
        throw new HttpsError("invalid-argument", "Missing or invalid endpoint parameter");
    }

    // Cache TTL: 5 minutes for LunarCrush
    const CACHE_TTL = 5 * 60 * 1000;
    const cacheKey = `lunar_${endpoint}`;

    const cachedData = getFromCache(cacheKey, CACHE_TTL);
    if (cachedData) {
        console.log(`[LunarCrush] Cache hit for ${endpoint}`);
        return cachedData;
    }

    const apiKey = lunarApiKey.value();
    if (!apiKey) {
        console.error("LunarCrush API key is missing in backend environment.");
        throw new HttpsError("internal", "API config missing");
    }

    try {
        console.log(`[LunarCrush] Fetching ${endpoint} from remote...`);
        const response = await fetch(`https://lunarcrush.com/api4/public${endpoint}`, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });

        if (!response.ok) {
            console.error(`[LunarCrush] Fetch failed with status: ${response.status}`);
            throw new HttpsError("internal", `LunarCrush API failed: ${response.status}`);
        }

        const json = await response.json() as any;

        // Ensure standard structure
        const resultData = json.data;

        // Store in cache
        setCache(cacheKey, resultData);

        return resultData;
    } catch (error: any) {
        console.error(`[LunarCrush] Error fetching ${endpoint}:`, error);
        throw new HttpsError("internal", error.message || "Unknown error occurred");
    }
});

/**
 * Callable function to act as a proxy for ESPN API
 * Caches responses to avoid hitting standard public endpoints too often.
 */
export const getEspnData = onCall(async (request: CallableRequest<any>) => {
    const url = request.data.url; // e.g., "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"

    if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
        throw new HttpsError("invalid-argument", "Missing or invalid URL parameter");
    }

    // Cache TTL: 60 seconds for ESPN events / scores
    const CACHE_TTL = 60 * 1000;
    const cacheKey = `espn_${url}`;

    const cachedData = getFromCache(cacheKey, CACHE_TTL);
    if (cachedData) {
        console.log(`[ESPN] Cache hit for ${url}`);
        return cachedData;
    }

    try {
        console.log(`[ESPN] Fetching ${url} from remote...`);
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`[ESPN] Fetch failed with status: ${response.status}`);
            throw new HttpsError("internal", `ESPN API failed: ${response.status}`);
        }

        const json = await response.json() as any;

        // Store in cache
        setCache(cacheKey, json);

        return json;
    } catch (error: any) {
        console.error(`[ESPN] Error fetching ${url}:`, error);
        throw new HttpsError("internal", error.message || "Unknown error occurred");
    }
});
