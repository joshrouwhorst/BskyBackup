"use client";
import { useState } from "react";
import { Schedule } from "@/types/scheduler";
import AppDataProvider from "@/providers/AppDataProvider";
import ScheduleList from "@/components/schedules/ScheduleList";
import ScheduleDisplay from "@/components/schedules/ScheduleDisplay";
import ScheduleEditForm from "@/components/schedules/ScheduleEditForm";
import ScheduleProvider from "@/providers/ScheduleProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import DraftProvider from "@/providers/DraftsProvider";

export default function SchedulesPage() {
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Schedule>>({});

  const handleEdit = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setEditForm(schedule);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsEditing(false);
    setSelectedSchedule(null);
    setEditForm({});
  };

  const handleDelete = async (id: string) => {
    setSelectedSchedule(null);
  };

  const handleCreateNew = () => {
    setSelectedSchedule(null);
    setEditForm({});
    setIsEditing(true);
  };

  return (
    <AppDataProvider>
      <DraftProvider>
        <ScheduleProvider>
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                Schedules
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage posting schedules for drafts.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Schedule List */}
              <ErrorBoundary>
                <ScheduleList
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onCreateNew={handleCreateNew}
                  selectedSchedule={selectedSchedule}
                  setSelectedSchedule={setSelectedSchedule}
                />
              </ErrorBoundary>

              {/* Edit Panel */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {isEditing
                      ? selectedSchedule
                        ? "Edit Schedule"
                        : "Create Schedule"
                      : "Schedule Details"}
                  </h2>
                </div>
                <div className="p-6">
                  {selectedSchedule || isEditing ? (
                    <div className="space-y-4">
                      {isEditing ? (
                        <ErrorBoundary>
                          <ScheduleEditForm
                            schedule={selectedSchedule}
                            editForm={editForm}
                            setEditForm={setEditForm}
                            onSave={handleSave}
                            setIsEditing={setIsEditing}
                          />
                        </ErrorBoundary>
                      ) : (
                        <ErrorBoundary>
                          <ScheduleDisplay
                            schedule={selectedSchedule!}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        </ErrorBoundary>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      Select a schedule to view details
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScheduleProvider>
      </DraftProvider>
    </AppDataProvider>
  );
}
