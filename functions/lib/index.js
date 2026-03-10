"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEspnData = exports.getLunarCrushData = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const node_fetch_1 = __importDefault(require("node-fetch"));
// In-memory cache
// Since instances stay alive for a while, this provides free memory caching per instance.
const cache = {};
// Helper to check and get from cache
function getFromCache(key, ttlMs) {
    const cached = cache[key];
    if (cached && Date.now() - cached.timestamp < ttlMs) {
        return cached.data;
    }
    return null;
}
// Helper to set cache
function setCache(key, data) {
    cache[key] = {
        data,
        timestamp: Date.now(),
    };
}
// Ensure the API key is passed via environment variables during deployment
// firebase functions:secrets:set LUNAR_CRUSH_API_KEY
const lunarApiKey = (0, params_1.defineSecret)("LUNAR_CRUSH_API_KEY");
/**
 * Callable function to act as a proxy for LunarCrush API
 * Caches responses to reduce rate limit issues.
 */
exports.getLunarCrushData = (0, https_1.onCall)({ secrets: [lunarApiKey] }, async (request) => {
    const endpoint = request.data.endpoint; // e.g., "/topic/bitcoin/v1"
    if (!endpoint || typeof endpoint !== 'string') {
        throw new https_1.HttpsError("invalid-argument", "Missing or invalid endpoint parameter");
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
        throw new https_1.HttpsError("internal", "API config missing");
    }
    try {
        console.log(`[LunarCrush] Fetching ${endpoint} from remote...`);
        const response = await (0, node_fetch_1.default)(`https://lunarcrush.com/api4/public${endpoint}`, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });
        if (!response.ok) {
            console.error(`[LunarCrush] Fetch failed with status: ${response.status}`);
            throw new https_1.HttpsError("internal", `LunarCrush API failed: ${response.status}`);
        }
        const json = await response.json();
        // Ensure standard structure
        const resultData = json.data;
        // Store in cache
        setCache(cacheKey, resultData);
        return resultData;
    }
    catch (error) {
        console.error(`[LunarCrush] Error fetching ${endpoint}:`, error);
        throw new https_1.HttpsError("internal", error.message || "Unknown error occurred");
    }
});
/**
 * Callable function to act as a proxy for ESPN API
 * Caches responses to avoid hitting standard public endpoints too often.
 */
exports.getEspnData = (0, https_1.onCall)(async (request) => {
    const url = request.data.url; // e.g., "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"
    if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
        throw new https_1.HttpsError("invalid-argument", "Missing or invalid URL parameter");
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
        const response = await (0, node_fetch_1.default)(url);
        if (!response.ok) {
            console.error(`[ESPN] Fetch failed with status: ${response.status}`);
            throw new https_1.HttpsError("internal", `ESPN API failed: ${response.status}`);
        }
        const json = await response.json();
        // Store in cache
        setCache(cacheKey, json);
        return json;
    }
    catch (error) {
        console.error(`[ESPN] Error fetching ${url}:`, error);
        throw new https_1.HttpsError("internal", error.message || "Unknown error occurred");
    }
});
//# sourceMappingURL=index.js.map