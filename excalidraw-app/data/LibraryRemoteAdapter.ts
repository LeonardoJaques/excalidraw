import type {
  LibraryPersistedData,
  LibraryPersistenceAdapter,
} from "../../packages/excalidraw/data/library";
import { LibraryIndexedDBAdapter } from "./LocalData";

const API_URL = `${import.meta.env.BASE_URL}api/library`;

/**
 * Persists the library to a small server-side endpoint so it's available
 * across devices/browsers, falling back to the local IndexedDB cache when
 * the server is unreachable (offline) or has no data yet.
 */
export const LibraryRemoteAdapter: LibraryPersistenceAdapter = {
  async load() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`unexpected status ${response.status}`);
      }
      const data: LibraryPersistedData = await response.json();
      if (data?.libraryItems?.length) {
        // keep local cache in sync for offline fallback
        LibraryIndexedDBAdapter.save(data);
        return data;
      }
    } catch (error) {
      console.error("library: failed to load from server", error);
    }

    // server unreachable or empty -> fall back to local cache (also covers
    // migrating items that existed locally before this sync was added)
    return LibraryIndexedDBAdapter.load();
  },

  async save(data: LibraryPersistedData) {
    // always keep a local cache for offline fallback
    LibraryIndexedDBAdapter.save(data);

    try {
      const response = await fetch(API_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`unexpected status ${response.status}`);
      }
    } catch (error) {
      console.error("library: failed to save to server", error);
    }
  },
};
