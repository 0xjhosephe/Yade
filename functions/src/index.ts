import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import fetch from "node-fetch";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();
const CACHE_COLLECTION = "api_cache";
const ADMIN_WALLET = "STTARKRG00YXYFT3AXVAWR45C3QKN26A345CHKGZ";

// Cache TTLs in ms
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
const ADMIN_TTL = 12 * 60 * 60 * 1000;   // 12 hours

/**
 * Helper to check and get from Firestore cache
 */
async function getFromCache(key: string, userAddress?: string) {
    try {
        const doc = await db.collection(CACHE_COLLECTION).doc(key).get();
        if (!doc.exists) return null;

        const data = doc.data();
        if (!data || !data.timestamp || !data.payload) return null;

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
    } catch (error) {
        console.error("Error reading cache from Firestore:", error);
        return null;
    }
}

/**
 * Helper to set Firestore cache
 */
async function setCache(key: string, payload: any) {
    try {
        await db.collection(CACHE_COLLECTION).doc(key).set({
            payload,
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error("Error writing cache to Firestore:", error);
    }
}

// Ensure the API key is passed via environment variables during deployment
const lunarApiKey = defineSecret("LUNAR_CRUSH_API_KEY");

/**
 * Callable function to act as a proxy for LunarCrush API
 */
export const getLunarCrushData = onCall({ secrets: [lunarApiKey] }, async (request: CallableRequest<any>) => {
    const { endpoint, userAddress } = request.data;

    if (!endpoint || typeof endpoint !== 'string') {
        throw new HttpsError("invalid-argument", "Missing or invalid endpoint parameter");
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
        throw new HttpsError("internal", "API config missing");
    }

    try {
        console.log(`[LunarCrush] Fetching ${endpoint} from remote...`);
        const response = await fetch(`https://lunarcrush.com/api4/public${endpoint}`, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!response.ok) {
            console.error(`[LunarCrush] Fetch failed with status: ${response.status}`);
            throw new HttpsError("internal", `LunarCrush API failed: ${response.status}`);
        }

        const json = await response.json() as any;
        const resultData = json.data;

        // Only store if data is not empty
        if (resultData) {
            await setCache(cacheKey, resultData);
        }

        return resultData;
    } catch (error: any) {
        console.error(`[LunarCrush] Error fetching ${endpoint}:`, error);
        throw new HttpsError("internal", error.message || "Unknown error occurred");
    }
});

/**
 * Callable function to act as a proxy for ESPN API
 */
export const getEspnData = onCall(async (request: CallableRequest<any>) => {
    const { url, userAddress } = request.data;

    if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
        throw new HttpsError("invalid-argument", "Missing or invalid URL parameter");
    }

    const cacheKey = `espn_${Buffer.from(url).toString('hex')}`;

    const cachedData = await getFromCache(cacheKey, userAddress);
    if (cachedData) {
        console.log(`[ESPN] Cache hit for ${url} (User: ${userAddress || 'Anonymous'})`);
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

        if (json) {
            await setCache(cacheKey, json);
        }

        return json;
    } catch (error: any) {
        console.error(`[ESPN] Error fetching ${url}:`, error);
        throw new HttpsError("internal", error.message || "Unknown error occurred");
    }
});

/**
 * Get global mock data visibility status from Firestore
 */
export const getGlobalMockStatus = onCall(async () => {
    try {
        const doc = await db.collection("settings").doc("global").get();
        if (!doc.exists) return { showMockData: false };
        return doc.data();
    } catch (error) {
        console.error("Error reading global settings:", error);
        return { showMockData: false };
    }
});

/**
 * Set global mock data visibility status (Admin only)
 */
export const setGlobalMockStatus = onCall(async (request: CallableRequest<any>) => {
    const { showMockData, userAddress } = request.data;

    if (!userAddress || userAddress.toUpperCase() !== ADMIN_WALLET.toUpperCase()) {
        throw new HttpsError("permission-denied", "Only admin can change global settings");
    }

    try {
        await db.collection("settings").doc("global").set({
            showMockData: !!showMockData,
            updatedBy: userAddress,
            timestamp: Date.now()
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error updating global settings:", error);
        throw new HttpsError("internal", error.message || "Failed to update settings");
    }
});
