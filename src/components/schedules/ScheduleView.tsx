import { Schedule, ScheduleFrequency } from "@/types/scheduler";
import { displayTime } from "@/helpers/utils";

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function ScheduleListItem({
  schedule,
  onEdit,
  onDelete,
}: {
  schedule: Schedule;
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          {schedule.name}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          Group: {schedule.group ?? "NONE"}
        </p>
        <div className="flex items-center mt-2 space-x-4">
          <FrequencyOutput frequency={schedule.frequency} />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span
          className={`w-3 h-3 rounded-full ${
            schedule.isActive ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
          }`}
        />
      </div>
    </div>
  );
}

function FrequencyOutput({ frequency }: { frequency: ScheduleFrequency }) {
  const parts = [];
  switch (frequency.interval.unit) {
    case "minutes":
      parts.push(
        `Every ${frequency.interval.every} minute${frequency.interval.every > 1 ? "s" : ""}`,
      );
      break;
    case "hours":
      parts.push(
        `Every ${frequency.interval.every} hour${frequency.interval.every > 1 ? "s" : ""}`,
      );
      break;
    case "days":
      parts.push(
        `Every ${frequency.interval.every} day${frequency.interval.every > 1 ? "s" : ""}`,
      );
      break;
    case "weeks":
      parts.push(
        `Every ${frequency.interval.every} week${frequency.interval.every > 1 ? "s" : ""}`,
      );
      break;
    case "months":
      parts.push(
        `Every ${frequency.interval.every} month${frequency.interval.every > 1 ? "s" : ""}`,
      );
      break;
    default:
      parts.push("Unknown interval");
  }

  if (frequency.dayOfWeek !== undefined) {
    parts.push(`on ${daysOfWeek[frequency.dayOfWeek]}`);
  }

  if (frequency.dayOfMonth !== undefined) {
    parts.push(`on day ${frequency.dayOfMonth}`);
  }

  if (frequency.timeOfDay) {
    parts.push(`at ${displayTime(frequency.timeOfDay)}`);
  }

  if (frequency.timeZone) {
    parts.push(`(${frequency.timeZone})`);
  }

  return parts.join(" ");
}
