import { useContext } from 'react'
import { TravelAppContext } from './travelAppStore'

export function useTravelApp() {
  const context = useContext(TravelAppContext)

  if (!context) {
    throw new Error('useTravelApp must be used within TravelAppProvider')
  }

  return context
}
