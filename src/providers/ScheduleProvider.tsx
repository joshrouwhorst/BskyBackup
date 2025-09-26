"use client";

import React, { createContext, useContext, ReactNode } from "react";
import {
  CreateScheduleRequest,
  Schedule,
  ScheduleLookups,
} from "@/types/scheduler";
import { useSchedules } from "@/hooks/useSchedules";
import { DraftPost } from "@/types/drafts";

interface SchedulesContextType {
  schedules: Schedule[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  createSchedule: (input: CreateScheduleRequest) => Promise<Schedule>;
  updateSchedule: (input: Schedule) => Promise<Schedule>;
  deleteSchedule: (id: string) => Promise<void>;
  triggerSchedule: (scheduleId: string) => Promise<void>;
  getScheduleLookups: (scheduleId: string) => Promise<ScheduleLookups | null>;
}

// Create the context
const ScheduleContext = createContext<SchedulesContextType | undefined>(
  undefined,
);

interface ScheduleProviderProps {
  children: ReactNode;
}

export default function ScheduleProvider({ children }: ScheduleProviderProps) {
  const {
    schedules,
    loading,
    refresh,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    triggerSchedule,
    getScheduleLookups,
  } = useSchedules();

  const contextValue: SchedulesContextType = {
    schedules,
    isLoading: loading,
    refresh,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    triggerSchedule,
    getScheduleLookups,
  };

  return (
    <ScheduleContext.Provider value={contextValue}>
      {children}
    </ScheduleContext.Provider>
  );
}

export const useScheduleContext = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error(
      "useScheduleContext must be used within a ScheduleProvider",
    );
  }
  return context;
};
