"use client";

import { useState } from "react";
import { ToggleRow } from "./toggle-row";
import { FolderPicker } from "./folder-picker";
import { UpdaterRow } from "./updater-row";
import { VolumeSlider } from "./volume-slider";
import { writeSetting } from "@/app/actions/config";
import { StaggerGroup, StaggerItem } from "@/components/primitives/stagger";
import {
  useSoundPrefs,
  setSoundPrefs,
} from "@/lib/use-sound";
import type { AppSettings } from "@/lib/config";

type Props = {
  settings: AppSettings;
  version: string;
};

export function SettingsForm({ settings, version }: Props) {
  const prefs = useSoundPrefs();
  const [volume, setVolume] = useState(prefs.soundVolume);

  return (
    <StaggerGroup className="space-y-10">
      <StaggerItem>
        <h2 className="text-base font-medium text-text-primary">
          Pasta de destino
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Onde os vídeos vão ser salvos.
        </p>
        <div className="mt-4">
          <FolderPicker initial={settings.downloadFolder} />
        </div>
      </StaggerItem>

      <StaggerItem>
        <h2 className="text-base font-medium text-text-primary">
          Pasta de vídeos limpos
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Onde caem os vídeos com metadados removidos (aba Limpar).
        </p>
        <div className="mt-4">
          <FolderPicker
            initial={settings.cleanFolder}
            settingKey="cleanFolder"
            promptLabel="Caminho da pasta de vídeos limpos:"
          />
        </div>
      </StaggerItem>

      <StaggerItem>
        <h2 className="text-base font-medium text-text-primary">
          Processamento
        </h2>
        <div className="mt-2 divide-y divide-border">
          <ToggleRow
            label="Remover metadados automaticamente"
            description="Limpa autor, GPS, encoder do arquivo final. Recomendado."
            defaultChecked={settings.autoStripMetadata}
            onChange={(v) => writeSetting("autoStripMetadata", v)}
          />
          <ToggleRow
            label="Sempre gerar MP3 junto"
            description="Cria um .mp3 320kbps a cada download."
            defaultChecked={settings.alwaysExtractMp3}
            onChange={(v) => writeSetting("alwaysExtractMp3", v)}
          />
        </div>
      </StaggerItem>

      <StaggerItem>
        <h2 className="text-base font-medium text-text-primary">
          Engine de download
        </h2>
        <div className="mt-4">
          <UpdaterRow version={version} />
        </div>
      </StaggerItem>

      <StaggerItem>
        <h2 className="text-base font-medium text-text-primary">
          Sons & efeitos
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Feedback sutil em probe, download e conclusão.
        </p>
        <div className="mt-2 divide-y divide-border">
          <ToggleRow
            label="Sons da interface"
            description="Tons curtos sintéticos em pontos de interação. Família baseada em A4 (440Hz)."
            defaultChecked={prefs.soundEnabled}
            onChange={(v) => setSoundPrefs({ soundEnabled: v })}
          />
          <VolumeSlider
            label="Volume"
            description="Volume relativo dos sons da interface."
            value={volume}
            onChange={(v) => {
              setVolume(v);
              setSoundPrefs({ soundVolume: v });
            }}
            disabled={!prefs.soundEnabled}
          />
          <ToggleRow
            label="Confetti ao concluir"
            description="Comemoração visual breve quando um download termina."
            defaultChecked={prefs.confettiEnabled}
            onChange={(v) => setSoundPrefs({ confettiEnabled: v })}
          />
        </div>
      </StaggerItem>

      <StaggerItem>
        <h2 className="text-base font-medium text-text-primary">Logs</h2>
        <div className="mt-2">
          <ToggleRow
            label="Logar URL completa"
            description="Por padrão, URLs são hasheadas pra privacidade. Ative só pra debugar."
            defaultChecked={settings.logRawUrl}
            onChange={(v) => writeSetting("logRawUrl", v)}
          />
        </div>
      </StaggerItem>
    </StaggerGroup>
  );
}
