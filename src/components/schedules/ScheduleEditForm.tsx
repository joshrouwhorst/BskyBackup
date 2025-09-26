import React from "react";
import { Schedule, CreateScheduleRequest } from "@/types/scheduler";
import { useScheduleContext } from "@/providers/ScheduleProvider";
import FrequencyInput from "./FrequencyInput";
import { Input, Label, Checkbox, Button } from "../ui/forms";
import TimezoneSelect from "./TimezoneSelect";
import { GroupSelect } from "../GroupSelect";

export default function ScheduleEditForm({
  schedule,
  editForm,
  setEditForm,
  onSave,
  setIsEditing,
}: {
  schedule: Schedule | null;
  editForm: Partial<Schedule>;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<Schedule>>>;
  onSave: () => void;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { createSchedule, updateSchedule } = useScheduleContext();

  const handleSave = async () => {
    if (!editForm.name || !editForm.frequency) {
      alert("Name and Frequency are required");
      return;
    }

    if (schedule && editForm.id) {
      // Update existing schedule
      const updatedSchedule: Schedule = {
        id: editForm.id,
        name: editForm.name,
        isActive: editForm.isActive || false,
        frequency: editForm.frequency,
        platforms: editForm.platforms || [],
        group: editForm.group || "default",
      };
      await updateSchedule(updatedSchedule);
    } else {
      // Create new schedule
      const newSchedule: CreateScheduleRequest = {
        name: editForm.name || "",
        isActive: editForm.isActive || false,
        frequency: editForm.frequency,
        platforms: editForm.platforms || [],
        group: editForm.group || "default",
      };
      await createSchedule(newSchedule);
    }
    await onSave();
  };
  return (
    <>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="name">Name</Label>
          <Input
            type="text"
            id="name"
            value={editForm.name || ""}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="group">Group</Label>
          <GroupSelect
            value={editForm.group}
            onChange={(group) => {
              setEditForm((prev) => ({
                ...prev,
                group,
              }));
            }}
          />
        </div>
      </div>
      <div>
        <FrequencyInput
          value={editForm.frequency}
          onChange={(frequency) => {
            setEditForm((prev) => ({
              ...prev,
              frequency,
            }));
          }}
        />
      </div>
      <div className="flex items-center">
        <Label htmlFor="isActive" className="text-sm text-gray-700">
          <Checkbox
            id="isActive"
            checked={editForm.isActive || false}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                isActive: e.target.checked,
              }))
            }
            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Active
        </Label>
      </div>
      <div className="flex space-x-3 pt-4">
        <Button onClick={handleSave} color="primary" variant="primary">
          Save
        </Button>
        <Button
          onClick={() => {
            setIsEditing(false);
            setEditForm({});
          }}
          color="secondary"
          variant="primary"
        >
          Cancel
        </Button>
      </div>
    </>
  );
}
