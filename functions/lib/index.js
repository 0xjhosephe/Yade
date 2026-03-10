"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEspnData = exports.getLunarCrushData = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const node_fetch_1 = __importDefault(require("node-fetch"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
const CACHE_COLLECTION = "api_cache";
const ADMIN_WALLET = "STTARKRG00YXYFT3AXVAWR45C3QKN26A345CHKGZ";
// Cache TTLs in ms
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
const ADMIN_TTL = 12 * 60 * 60 * 1000; // 12 hours
/**
 * Helper to check and get from Firestore cache
 */
async function getFromCache(key, userAddress) {
    try {
        const doc = await db.collection(CACHE_COLLECTION).doc(key).get();
        if (!doc.exists)
            return null;
        const data = doc.data();
        if (!data || !data.timestamp || !data.payload)
            return null;
        // Determine TTL
        const ttl = (userAddress && userAddress.toUpperCase() === ADMIN_WALLET.toUpperCase())
            ? ADMIN_TTL
            : DEFAULT_TTL;
        const age = Date.now() - data.timestamp;
        // If data is empty/null, we always want to refetch regardless of TTL
        if (age < ttl && data.payload) {
            return data.payload;
        }
        return null;
    }
    catch (error) {
        console.error("Error reading cache from Firestore:", error);
        return null;
    }
}
/**
 * Helper to set Firestore cache
 */
async function setCache(key, payload) {
    try {
        await db.collection(CACHE_COLLECTION).doc(key).set({
            payload,
            timestamp: Date.now(),
        });
    }
    catch (error) {
        console.error("Error writing cache to Firestore:", error);
    }
}
// Ensure the API key is passed via environment variables during deployment
const lunarApiKey = (0, params_1.defineSecret)("LUNAR_CRUSH_API_KEY");
/**
 * Callable function to act as a proxy for LunarCrush API
 */
exports.getLunarCrushData = (0, https_1.onCall)({ secrets: [lunarApiKey] }, async (request) => {
    const { endpoint, userAddress } = request.data;
    if (!endpoint || typeof endpoint !== 'string') {
        throw new https_1.HttpsError("invalid-argument", "Missing or invalid endpoint parameter");
    }
    const cacheKey = `lunar_${Buffer.from(endpoint).toString('hex')}`;
    const cachedData = await getFromCache(cacheKey, userAddress);
    if (cachedData) {
        console.log(`[LunarCrush] Cache hit for ${endpoint} (User: ${userAddress || 'Anonymous'})`);
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
            headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!response.ok) {
            console.error(`[LunarCrush] Fetch failed with status: ${response.status}`);
            throw new https_1.HttpsError("internal", `LunarCrush API failed: ${response.status}`);
        }
        const json = await response.json();
        const resultData = json.data;
        // Only store if data is not empty
        if (resultData) {
            await setCache(cacheKey, resultData);
        }
        return resultData;
    }
    catch (error) {
        console.error(`[LunarCrush] Error fetching ${endpoint}:`, error);
        throw new https_1.HttpsError("internal", error.message || "Unknown error occurred");
    }
});
/**
 * Callable function to act as a proxy for ESPN API
 */
exports.getEspnData = (0, https_1.onCall)(async (request) => {
    const { url, userAddress } = request.data;
    if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
        throw new https_1.HttpsError("invalid-argument", "Missing or invalid URL parameter");
    }
    const cacheKey = `espn_${Buffer.from(url).toString('hex')}`;
    const cachedData = await getFromCache(cacheKey, userAddress);
    if (cachedData) {
        console.log(`[ESPN] Cache hit for ${url} (User: ${userAddress || 'Anonymous'})`);
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
        if (json) {
            await setCache(cacheKey, json);
        }
        return json;
    }
    catch (error) {
        console.error(`[ESPN] Error fetching ${url}:`, error);
        throw new https_1.HttpsError("internal", error.message || "Unknown error occurred");
    }
});
//# sourceMappingURL=index.js.map