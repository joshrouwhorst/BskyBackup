import { Governor } from '../governor'

describe('Governor', () => {
  it('should not wait the first time called', async () => {
    const governor = new Governor(1000)

    const start = Date.now()
    await governor.wait()
    const end = Date.now()

    expect(end - start).toBeLessThan(1000)
  })

  it('should not wait the first time called with a custom wait time', async () => {
    const governor = new Governor(1000)

    const start = Date.now()
    await governor.wait(500)
    const end = Date.now()

    expect(end - start).toBeLessThan(500)
  })

  it('should wait the second time called', async () => {
    const governor = new Governor(1000)

    const start = Date.now()
    await governor.wait()
    const end = Date.now()

    expect(end - start).toBeLessThan(1000)

    const start2 = Date.now()
    await governor.wait()
    const end2 = Date.now()

    expect(end2 - start2).toBeGreaterThanOrEqual(1000)
  })

  it('should not wait if the minimum time has already passed', async () => {
    const governor = new Governor(500)

    await governor.wait() // First call to set lastCall
    await timeout(600) // Wait more than minWait

    const start = Date.now()
    await governor.wait() // This should not wait
    const end = Date.now()

    expect(end - start).toBeLessThan(100) // Should be almost immediate
  })

  it('should handle multiple rapid calls correctly', async () => {
    const governor = new Governor(300)

    const start = Date.now()
    await Promise.all([governor.wait(), governor.wait(), governor.wait()]) // Three rapid calls
    const end = Date.now()

    expect(end - start).toBeGreaterThanOrEqual(600) // At least two waits of 300ms
  })

  it('should handle multiple rapid sequential calls correctly', async () => {
    const governor = new Governor(300)

    const start = Date.now()
    await governor.wait()
    await governor.wait()
    await governor.wait()
    const end = Date.now()

    expect(end - start).toBeGreaterThanOrEqual(600) // At least two waits of 300ms
  })

  it('should serialize calls correctly', async () => {
    const governor = new Governor(300)

    const start = Date.now()
    await Promise.all([
      (async () => {
        await governor.wait()
      })(),
      (async () => {
        await governor.wait()
      })(),
      (async () => {
        await governor.wait()
      })(),
    ])
    const end = Date.now()
    expect(end - start).toBeGreaterThanOrEqual(600) // At least two waits of 300ms
  })

  it('should respect custom wait times', async () => {
    const governor = new Governor(500)

    const start = Date.now()
    await governor.wait(200) // Custom wait time less than minWait
    const end = Date.now()

    expect(end - start).toBeLessThan(500) // Should wait less than minWait

    const start2 = Date.now()
    await governor.wait(700) // Custom wait time greater than minWait
    const end2 = Date.now()

    expect(end2 - start2).toBeGreaterThanOrEqual(700) // Should wait at least custom wait time

    const start3 = Date.now()
    await governor.wait() // Default wait time (minWait)
    const end3 = Date.now()

    expect(end3 - start3).toBeGreaterThanOrEqual(500) // Should wait at least minWait
  })
})

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
