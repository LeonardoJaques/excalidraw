import { clearAppStateForDatabase } from "../../packages/excalidraw/appState";
import { clearElementsForDatabase } from "../../packages/excalidraw/element";
import type { ExcalidrawElement } from "../../packages/excalidraw/element/types";
import {
  EXPORT_DATA_TYPES,
  EXPORT_SOURCE,
  VERSIONS,
} from "../../packages/excalidraw/constants";
import { restore } from "../../packages/excalidraw/data/restore";
import type { AppState, BinaryFiles } from "../../packages/excalidraw/types";

const API_URL = `${import.meta.env.BASE_URL}api/scenes`;

export interface SceneListEntry {
  id: string;
  name: string;
  updatedAt: string;
}

const request = async (path: string, init?: RequestInit) => {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) {
    throw new Error(`unexpected status ${response.status}`);
  }
  return response;
};

export const saveScene = async (
  name: string,
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  files: BinaryFiles,
) => {
  const data = {
    type: EXPORT_DATA_TYPES.excalidraw,
    version: VERSIONS.excalidraw,
    source: EXPORT_SOURCE,
    elements: clearElementsForDatabase(elements),
    appState: clearAppStateForDatabase(appState),
    files,
  };
  const response = await request("", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, data }),
  });
  const saved = (await response.json()) as {
    id: string;
    name: string;
    updated_at: string;
  };
  return { id: saved.id, name: saved.name, updatedAt: saved.updated_at };
};

export const listScenes = async (): Promise<SceneListEntry[]> => {
  const response = await request("");
  const { scenes } = (await response.json()) as {
    scenes: { id: string; name: string; updated_at: string }[];
  };
  return scenes.map((scene) => ({
    id: scene.id,
    name: scene.name,
    updatedAt: scene.updated_at,
  }));
};

export const loadScene = async (id: string) => {
  const response = await request(`/${id}`);
  const { data } = (await response.json()) as { data: unknown };
  return restore(data as Parameters<typeof restore>[0], null, null);
};

export const deleteScene = async (id: string) => {
  await request(`/${id}`, { method: "DELETE" });
};
