import { useCallback, useEffect, useState } from 'react'

type InstallPromptOutcome = 'accepted' | 'dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: InstallPromptOutcome
    platform: string
  }>
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean
}

function isStandaloneDisplayMode() {
  if (typeof window === 'undefined') {
    return false
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as NavigatorWithStandalone).standalone)
  )
}

export function usePwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneDisplayMode())

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
      setIsInstalled(isStandaloneDisplayMode())
    }

    const handleAppInstalled = () => {
      setInstallPrompt(null)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!installPrompt) {
      return false
    }

    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    setInstallPrompt(null)

    if (choice.outcome === 'accepted') {
      setIsInstalled(true)
      return true
    }

    return false
  }, [installPrompt])

  return {
    canInstall: !isInstalled && Boolean(installPrompt),
    isInstalled,
    promptInstall,
  }
}
