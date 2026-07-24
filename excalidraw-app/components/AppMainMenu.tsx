import React, { useState } from "react";
import {
  save,
  LoadIcon,
  eyeIcon,
} from "../../packages/excalidraw/components/icons";
import type { Theme } from "../../packages/excalidraw/element/types";
import { MainMenu } from "../../packages/excalidraw/index";
import type { ExcalidrawImperativeAPI } from "../../packages/excalidraw/types";
import { LanguageList } from "../app-language/LanguageList";
import { saveDebugState } from "./DebugCanvas";
import { SaveSceneDialog } from "./SaveSceneDialog";
import { ImportSceneDialog } from "./ImportSceneDialog";

export const AppMainMenu: React.FC<{
  onCollabDialogOpen: () => any;
  isCollaborating: boolean;
  isCollabEnabled: boolean;
  theme: Theme | "system";
  setTheme: (theme: Theme | "system") => void;
  refresh: () => void;
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}> = React.memo((props) => {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  return (
    <>
      <MainMenu>
        <MainMenu.DefaultItems.LoadScene />
        <MainMenu.DefaultItems.SaveToActiveFile />
        {props.excalidrawAPI && (
          <>
            <MainMenu.Item
              icon={save}
              onClick={() => setIsSaveDialogOpen(true)}
            >
              Salvar cena
            </MainMenu.Item>
            <MainMenu.Item
              icon={LoadIcon}
              onClick={() => setIsImportDialogOpen(true)}
            >
              Importar cena
            </MainMenu.Item>
          </>
        )}
        <MainMenu.DefaultItems.Export />
        <MainMenu.DefaultItems.SaveAsImage />
        {props.isCollabEnabled && (
          <MainMenu.DefaultItems.LiveCollaborationTrigger
            isCollaborating={props.isCollaborating}
            onSelect={() => props.onCollabDialogOpen()}
          />
        )}
        <MainMenu.DefaultItems.CommandPalette className="highlighted" />
        <MainMenu.DefaultItems.SearchMenu />
        <MainMenu.DefaultItems.Help />
        <MainMenu.DefaultItems.ClearCanvas />
        {import.meta.env.DEV && (
          <MainMenu.Item
            icon={eyeIcon}
            onClick={() => {
              if (window.visualDebug) {
                delete window.visualDebug;
                saveDebugState({ enabled: false });
              } else {
                window.visualDebug = { data: [] };
                saveDebugState({ enabled: true });
              }
              props?.refresh();
            }}
          >
            Visual Debug
          </MainMenu.Item>
        )}
        <MainMenu.Separator />
        <MainMenu.DefaultItems.ToggleTheme
          allowSystemTheme
          theme={props.theme}
          onSelect={props.setTheme}
        />
        <MainMenu.ItemCustom>
          <LanguageList style={{ width: "100%" }} />
        </MainMenu.ItemCustom>
        <MainMenu.DefaultItems.ChangeCanvasBackground />
      </MainMenu>
      {isSaveDialogOpen && props.excalidrawAPI && (
        <SaveSceneDialog
          excalidrawAPI={props.excalidrawAPI}
          onClose={() => setIsSaveDialogOpen(false)}
        />
      )}
      {isImportDialogOpen && props.excalidrawAPI && (
        <ImportSceneDialog
          excalidrawAPI={props.excalidrawAPI}
          onClose={() => setIsImportDialogOpen(false)}
        />
      )}
    </>
  );
});
