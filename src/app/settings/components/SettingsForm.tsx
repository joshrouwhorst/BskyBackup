"use client";
import React, { useState, useEffect } from "react";
import { useSettingsContext } from "@/providers/SettingsProvider";
import { Settings } from "@/types/types";
import { Button, Input, Checkbox, Label } from "@/components/ui/forms";
import Toast, { ToastProps } from "@/components/Toast";

export default function SettingsForm() {
  const { settings, update, isLoading, error, refresh } = useSettingsContext();
  const [formState, setFormState] = useState<Partial<Settings>>({});
  const [toastMessage, setToastMessage] = useState<ToastProps | null>(null);

  useEffect(() => {
    if (settings) {
      setFormState(settings);
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormState((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await update(formState);
    setToastMessage({
      message: "Settings updated successfully",
      type: "success",
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (isLoading && !settings) {
    return <div>Loading settings...</div>;
  }

  if (error) {
    return <div>Error loading settings: {error.message}</div>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-color-blue-200 dark:bg-blue-950 p-6 rounded-lg"
    >
      <div className="grid grid-cols-2 gap-4">
        <SettingsField
          label="Bluesky Display Name"
          name="bskyDisplayName"
          value={formState.bskyDisplayName || ""}
          type="text"
          onChange={handleChange}
        />
        <SettingsField
          label="Bluesky Identifier"
          name="bskyIdentifier"
          value={formState.bskyIdentifier || ""}
          type="text"
          onChange={handleChange}
        />
        <SettingsField
          label="Bluesky Password"
          name="bskyPassword"
          value={formState.bskyPassword || ""}
          type="password"
          onChange={handleChange}
        />
        <SettingsField
          label="Backup Location"
          name="backupLocation"
          value={formState.backupLocation || ""}
          type="text"
          onChange={handleChange}
        />
        <SettingsField
          label="Prune After Months"
          name="pruneAfterMonths"
          value={formState.pruneAfterMonths || 6}
          type="number"
          onChange={handleChange}
        />
      </div>

      {toastMessage && <Toast {...toastMessage} />}
      <Button type="submit" disabled={isLoading}>
        Save
      </Button>
    </form>
  );
}

function SettingsField({
  label,
  name,
  value,
  type,
  onChange,
}: {
  label: string;
  name: string;
  value: string | number | boolean;
  type: "text" | "number" | "checkbox" | "password";
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="mb-4">
      <Label htmlFor={name}>{label}</Label>
      {type === "checkbox" ? (
        <Checkbox
          name={name}
          id={name}
          checked={value as boolean}
          onChange={onChange}
        />
      ) : (
        <Input
          type={type}
          name={name}
          id={name}
          value={
            typeof value === "boolean" ? (value ? "true" : "false") : value
          }
          onChange={onChange}
        />
      )}
    </div>
  );
}
