import { useEffect, useState } from "react";
import { Dialog } from "../../packages/excalidraw/components/Dialog";
import type { ExcalidrawImperativeAPI } from "../../packages/excalidraw/types";
import { StoreAction } from "../../packages/excalidraw";
import {
  deleteScene,
  listScenes,
  loadScene,
  type SceneListEntry,
} from "../data/SceneRemoteAdapter";

interface Props {
  excalidrawAPI: ExcalidrawImperativeAPI;
  onClose: () => void;
}

export const ImportSceneDialog = ({ excalidrawAPI, onClose }: Props) => {
  const [scenes, setScenes] = useState<SceneListEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    listScenes()
      .then(setScenes)
      .catch(() => setError("Não foi possível carregar a lista de cenas."));
  }, []);

  const handleLoad = async (id: string) => {
    setLoadingId(id);
    try {
      const restored = await loadScene(id);
      excalidrawAPI.addFiles(Object.values(restored.files));
      excalidrawAPI.updateScene({
        elements: restored.elements,
        appState: restored.appState,
        storeAction: StoreAction.CAPTURE,
      });
      onClose();
    } catch {
      setError("Não foi possível carregar essa cena.");
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteScene(id);
      setScenes((prev) => prev?.filter((scene) => scene.id !== id) ?? null);
    } catch {
      setError("Não foi possível apagar essa cena.");
    }
  };

  return (
    <Dialog onCloseRequest={onClose} title="Importar cena" size="small">
      {error && <div style={{ color: "var(--color-danger)" }}>{error}</div>}
      {scenes === null && !error && <div>Carregando...</div>}
      {scenes?.length === 0 && <div>Nenhuma cena salva ainda.</div>}
      {scenes && scenes.length > 0 && (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          {scenes.map((scene) => (
            <div
              key={scene.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
                padding: "0.5rem",
                border: "1px solid var(--default-border-color)",
                borderRadius: "var(--border-radius-md)",
              }}
            >
              <button
                type="button"
                onClick={() => handleLoad(scene.id)}
                disabled={loadingId !== null}
                style={{
                  flex: 1,
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <div>{scene.name}</div>
                <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>
                  {new Date(scene.updatedAt).toLocaleString("pt-BR")}
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(scene.id)}
                disabled={loadingId !== null}
                aria-label="Apagar"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}
    </Dialog>
  );
};
