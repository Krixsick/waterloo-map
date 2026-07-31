import Memcached from "memcached";

let client: Memcached | null = null;
const memoryCache = new Map<string, { expiresAt: number; value: unknown }>();
const inFlight = new Map<string, Promise<unknown>>();

function getClient() {
  client ??= new Memcached(process.env.MEMCACHED_URL ?? "localhost:11211");
  return client;
}

export async function getCache<T>(key: string): Promise<T | null> {
  return new Promise((resolve, reject) => {
    getClient().get(key, (error, data) => {
      if (error) return reject(error);
      if (data === undefined || data === null) return resolve(null);

      try {
        resolve(JSON.parse(data) as T);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    getClient().set(key, JSON.stringify(value), ttlSeconds, (error) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  try {
    const cached = await getCache<T>(key);

    if (cached !== null) {
      console.log(`CACHE HIT: ${key}`);
      return cached;
    }

    console.log(`CACHE MISS: ${key}`);
  } catch (error) {
    console.warn(`Cache read failed for ${key}:`, error);
  }

  const fresh = await loader();

  try {
    await setCache(key, fresh, ttlSeconds);
    console.log(`CACHE SET: ${key}`);
  } catch (error) {
    console.warn(`Cache write failed for ${key}:`, error);
  }

  return fresh;
}

export async function withMemoryCache<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value as T;

  const activeRequest = inFlight.get(key);
  if (activeRequest) return activeRequest as Promise<T>;

  const request = loader()
    .then((value) => {
      memoryCache.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
      return value;
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, request);
  return request;
}
