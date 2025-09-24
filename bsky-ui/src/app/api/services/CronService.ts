import { ScheduledTask, schedule as cronSchedule, getTasks, TaskOptions } from 'node-cron'
import Logger from '@/app/api/helpers/logger'
import { CRON_FREQUENCY_MINUTES } from '@/config'
import { getSchedules, getNextTriggerTime, publishNextPost } from '../services/SchedulePostService'
import { cron } from '@/app/api/helpers/cron'
import { Schedule } from '@/types/scheduler'

export class CronService {

  static async scheduleNextPosts() {
    const schedules = await getSchedules();
    for (const schedule of schedules) {
      if (!schedule.group || !schedule.id || !schedule.isActive) continue; // Skip if no group defined
      const id = `schedule-${schedule.group}`;
      if (cron.hasTask(id)) continue; // Task already scheduled

      let nextRun = getNextTriggerTime((schedule.lastTriggered ? new Date(schedule.lastTriggered) : new Date()), schedule.frequency);

      if (nextRun < new Date()) {
        nextRun = getNextTriggerTime(new Date(), schedule.frequency);
      }

      // Debug logging to trace scheduling

      console.log(`Next run for schedule ${schedule.group} is at ${nextRun.toISOString()}`);
      console.log(`Current time is ${new Date().toISOString()}`);
      console.log(`Schedule interval is every ${schedule.frequency.interval.every} ${schedule.frequency.interval.unit}`);

      const now = new Date();

      const success = cron.addTask(
        id,
        async () => {
          await this.job(schedule);
        }, 
        nextRun.getTime() - now.getTime()
      );
      if (success) Logger.log(`Scheduled next post for group ${schedule.group} at ${nextRun.toISOString()}`);
    }
  }

  static async unscheduleAll() {
    cron.clearAll();
    Logger.log('Cleared all scheduled tasks');
  }

  private static async job(schedule: Schedule) {
    try {
      await publishNextPost(schedule.id!);
    } catch (error) {
      Logger.error(`Error triggering scheduled post for group ${schedule.group}`, error);
    } finally {
      cron.removeTask(`schedule-${schedule.group}`);
      await this.scheduleNextPosts(); // Reschedule the next post
    }
  }
}