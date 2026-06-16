import Memcached from "memcached";

let client: Memcached | null = null;

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
