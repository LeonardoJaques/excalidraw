import { useState } from "react";
import { Dialog } from "../../packages/excalidraw/components/Dialog";
import DialogActionButton from "../../packages/excalidraw/components/DialogActionButton";
import { TextField } from "../../packages/excalidraw/components/TextField";
import type { ExcalidrawImperativeAPI } from "../../packages/excalidraw/types";
import { saveScene } from "../data/SceneRemoteAdapter";

interface Props {
  excalidrawAPI: ExcalidrawImperativeAPI;
  onClose: () => void;
}

export const SaveSceneDialog = ({ excalidrawAPI, onClose }: Props) => {
  const [name, setName] = useState(excalidrawAPI.getAppState().name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Informe um nome para a cena.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await saveScene(
        name.trim(),
        excalidrawAPI.getSceneElements(),
        excalidrawAPI.getAppState(),
        excalidrawAPI.getFiles(),
      );
      // clearAppStateForDatabase strips `name` before persisting, so the app
      // itself has to remember it to know which scene a future save updates.
      excalidrawAPI.updateScene({ appState: { name: name.trim() } });
      onClose();
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
      setIsSaving(false);
    }
  };

  return (
    <Dialog onCloseRequest={onClose} title="Salvar cena" size="small">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <TextField
          value={name}
          onChange={setName}
          placeholder="Nome da cena"
          label="Nome"
          fullWidth
          selectOnRender
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSave();
            }
          }}
        />
        {error && <div style={{ color: "var(--color-danger)" }}>{error}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <DialogActionButton
            label="Salvar"
            actionType="primary"
            isLoading={isSaving}
            onClick={handleSave}
          />
        </div>
      </div>
    </Dialog>
  );
};
