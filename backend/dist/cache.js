"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCache = getCache;
exports.setCache = setCache;
exports.withCache = withCache;
const memcached_1 = __importDefault(require("memcached"));
let client = null;
function getClient() {
    client ??= new memcached_1.default(process.env.MEMCACHED_URL ?? "localhost:11211");
    return client;
}
async function getCache(key) {
    return new Promise((resolve, reject) => {
        getClient().get(key, (error, data) => {
            if (error)
                return reject(error);
            if (data === undefined || data === null)
                return resolve(null);
            try {
                resolve(JSON.parse(data));
            }
            catch (parseError) {
                reject(parseError);
            }
        });
    });
}
async function setCache(key, value, ttlSeconds) {
    return new Promise((resolve, reject) => {
        getClient().set(key, JSON.stringify(value), ttlSeconds, (error) => {
            if (error)
                return reject(error);
            resolve();
        });
    });
}
async function withCache(key, ttlSeconds, loader) {
    try {
        const cached = await getCache(key);
        if (cached !== null) {
            console.log(`CACHE HIT: ${key}`);
            return cached;
        }
        console.log(`CACHE MISS: ${key}`);
    }
    catch (error) {
        console.warn(`Cache read failed for ${key}:`, error);
    }
    const fresh = await loader();
    try {
        await setCache(key, fresh, ttlSeconds);
        console.log(`CACHE SET: ${key}`);
    }
    catch (error) {
        console.warn(`Cache write failed for ${key}:`, error);
    }
    return fresh;
}
