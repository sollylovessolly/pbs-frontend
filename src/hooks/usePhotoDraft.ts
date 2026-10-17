"use client";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
  type RefObject,
} from "react";

const DATABASE = "pbs-photo-drafts";
const MAX_AGE = 24 * 60 * 60 * 1000;
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function access(
  key: string,
  value?: unknown,
  remove = false,
): Promise<unknown> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("drafts", "readwrite");
    const store = tx.objectStore("drafts");
    const request = remove
      ? store.delete(key)
      : value === undefined
        ? store.get(key)
        : store.put(value, key);
    tx.oncomplete = () => {
      db.close();
      resolve(request.result);
    };
    tx.onerror = tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}
async function pack(
  value: unknown,
  cache: Map<string, Promise<Blob>>,
): Promise<unknown> {
  if (typeof value === "string" && value.startsWith("blob:")) {
    if (!cache.has(value))
      cache.set(
        value,
        fetch(value).then((response) => {
          if (!response.ok) throw new Error("Photo unavailable");
          return response.blob();
        }),
      );
    return cache.get(value)!;
  }
  if (Array.isArray(value))
    return Promise.all(value.map((item) => pack(item, cache)));
  if (value && typeof value === "object")
    return Object.fromEntries(
      await Promise.all(
        Object.entries(value).map(async ([key, item]) => [
          key,
          await pack(item, cache),
        ]),
      ),
    );
  return value;
}
function unpack(value: unknown, urls: Set<string>): unknown {
  if (value instanceof Blob) {
    const url = URL.createObjectURL(value);
    urls.add(url);
    return url;
  }
  if (Array.isArray(value)) return value.map((item) => unpack(item, urls));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, unpack(item, urls)]),
    );
  return value;
}

export function usePhotoDraft<T>(
  key: string,
  value: T[],
  setValue: Dispatch<SetStateAction<T[]>>,
  urls: RefObject<Set<string>>,
  enabled = true,
) {
  const [loaded, setLoaded] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const pending = useRef<Promise<unknown>>(Promise.resolve());
  const cache = useRef(new Map<string, Promise<Blob>>());
  const completed = useRef(false);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    completed.current = false;
    async function restore() {
      try {
        const saved = (await access(key)) as
          { savedAt: number; value: unknown[] } | undefined;
        if (saved && Date.now() - saved.savedAt >= MAX_AGE)
          await access(key, undefined, true);
        if (cancelled) return;
        if (
          saved &&
          Date.now() - saved.savedAt < MAX_AGE &&
          Array.isArray(saved.value)
        ) {
          setValue(unpack(saved.value, urls.current) as T[]);
          if (saved.value.length) setNotice("Your unfinished design is back.");
        }
      } catch {
        if (!cancelled)
          setNotice(
            "Draft saving is unavailable in this browser. Keep this tab open until you add your photos to the cart.",
          );
      } finally {
        if (!cancelled) setLoaded(key);
      }
    }
    void restore();
    return () => {
      cancelled = true;
    };
  }, [key, enabled, setValue, urls]);
  useEffect(() => {
    if (!enabled || loaded !== key || completed.current) return;
    // Start reading blob URLs immediately, before the editor can revoke them on navigation.
    const snapshot = pack(value, cache.current).then((value) => ({
      value,
      savedAt: Date.now(),
    }));
    const handled = snapshot.catch(() => null);
    pending.current = pending.current
      .catch(() => {})
      .then(async () => {
        const record = await handled;
        if (!record) throw new Error("Draft unavailable");
        await access(key, record);
      })
      .catch(() =>
        setNotice(
          "Your latest changes couldn’t be saved on this device. Keep this tab open until you add them to the cart.",
        ),
      );
  }, [value, key, enabled, loaded]);
  async function finish() {
    completed.current = true;
    await pending.current;
    try {
      await access(key, undefined, true);
    } catch {
      /* Cart is already saved; never block checkout on local storage. */
    }
    cache.current.clear();
  }
  return {
    ready: !enabled || loaded === key,
    notice,
    finish,
    discard: () => {
      cache.current.clear();
      setValue([]);
      setNotice("");
    },
  };
}
