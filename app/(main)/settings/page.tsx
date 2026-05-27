import { readSettings } from "@/app/actions/config";
import { SettingsForm } from "@/components/settings/settings-form";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await readSettings();
  const versionRow = await db.setting.findUnique({
    where: { key: "ytdlpVersion" },
  });

  return (
    <div className="mx-auto max-w-2xl p-6 pt-12 space-y-10">
      <h1 className="text-xl font-medium text-text-primary">Configurações</h1>
      <SettingsForm
        settings={settings}
        version={versionRow?.value ?? "desconhecida"}
      />
    </div>
  );
}
