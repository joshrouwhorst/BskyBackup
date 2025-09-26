export class Governor {
  private lastCall: number = 0
  private minWait: number
  private queue: Promise<void> = Promise.resolve()

  constructor(minWaitMilliseconds: number) {
    this.minWait = minWaitMilliseconds
  }

  async wait(waitTime?: number): Promise<void> {
    // Chain the waits to ensure serialization
    this.queue = this.queue.then(async () => {
      const now = Date.now()
      const elapsed = now - this.lastCall
      const effectiveWait = waitTime !== undefined ? waitTime : this.minWait
      const finalWaitTime = Math.max(0, effectiveWait - elapsed)

      if (finalWaitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, finalWaitTime))
      }

      this.lastCall = Date.now()
    })
    return this.queue
  }
}
