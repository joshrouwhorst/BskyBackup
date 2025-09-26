"use client";

import React from "react";
import { RefreshCw, Download, Trash2 } from "lucide-react";

import { useBskyBackupContext } from "@/providers/BskyBackupProvider";
import { useAppDataContext } from "@/providers/AppDataProvider";
import { Button } from "./ui/forms";

export default function BackupToolBar() {
  const { refresh: adRefresh } = useAppDataContext();
  const { refresh: bskyRefresh, runBackup, pruneBsky } = useBskyBackupContext();

  const refresh = async () => {
    await bskyRefresh();
    await adRefresh();
  };

  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      <Button
        type="button"
        variant="primary"
        color="primary"
        onClick={refresh}
        aria-label="Refresh posts"
        title="Refresh posts"
      >
        <RefreshCw className="w-5 h-5" /> <span>Refresh</span>
      </Button>

      <Button
        type="button"
        variant="primary"
        color="tertiary"
        onClick={async () => {
          await runBackup();
          await refresh();
        }}
        aria-label="Backup data"
        title="Backup data"
      >
        <Download className="w-5 h-5" /> <span>Backup</span>
      </Button>

      <Button
        type="button"
        variant="primary"
        color="danger"
        onClick={async () => {
          if (!confirm("Are you sure you want to prune old data?")) {
            return;
          }
          await pruneBsky();
          await refresh();
        }}
        aria-label="Prune data"
        title="Prune data"
      >
        <Trash2 className="w-5 h-5" /> <span>Prune</span>
      </Button>
    </div>
  );
}
