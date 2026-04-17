function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

function safeMapCommand(command: () => void) {
  try {
    command()
  } catch {
    // AMap can throw during teardown or before the canvas fully settles.
  }
}

export async function waitForElementToHaveSize(
  element: HTMLElement,
  minimumSize = 120,
  maxFrames = 12,
) {
  for (let frame = 0; frame < maxFrames; frame += 1) {
    const { height, width } = element.getBoundingClientRect()
    if (width >= minimumSize && height >= minimumSize) {
      return true
    }

    await nextFrame()
  }

  return false
}

export function scheduleStabilizedResize(
  callback: () => void,
  delays: number[] = [0, 120, 320],
) {
  const animationFrames: number[] = []
  const timers: number[] = []

  const queueFrame = () => {
    const frameId = requestAnimationFrame(() => callback())
    animationFrames.push(frameId)
  }

  delays.forEach((delay) => {
    if (delay <= 0) {
      queueFrame()
      return
    }

    const timerId = window.setTimeout(() => queueFrame(), delay)
    timers.push(timerId)
  })

  return () => {
    animationFrames.forEach((frameId) => cancelAnimationFrame(frameId))
    timers.forEach((timerId) => window.clearTimeout(timerId))
  }
}

export function observeElementResize(
  element: HTMLElement,
  callback: () => void,
) {
  if (typeof ResizeObserver === 'undefined') {
    return () => {}
  }

  const observer = new ResizeObserver(() => callback())
  observer.observe(element)

  return () => observer.disconnect()
}

export function waitForMapComplete(map: AMapMap, timeoutMs = 2800) {
  return new Promise<void>((resolve) => {
    let settled = false

    const finish = () => {
      if (settled) {
        return
      }

      settled = true
      window.clearTimeout(timerId)
      if (typeof map.off === 'function') {
        safeMapCommand(() => map.off?.('complete', handleComplete))
      }
      resolve()
    }

    const handleComplete = () => finish()
    const timerId = window.setTimeout(() => finish(), timeoutMs)

    if (typeof map.on === 'function') {
      safeMapCommand(() => map.on('complete', handleComplete))
    }

    scheduleStabilizedResize(() => {
      safeMapCommand(() => map.resize())
    })
  })
}
