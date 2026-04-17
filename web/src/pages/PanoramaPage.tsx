import { Navigate, useParams, useSearchParams } from 'react-router-dom'

export function PanoramaPage() {
  const { poiId } = useParams()
  const [searchParams] = useSearchParams()
  const city = searchParams.get('city')?.trim()

  const params = new URLSearchParams()
  params.set('view', 'immersive')

  if (city) {
    params.set('city', city)
  }

  if (poiId) {
    params.set('poi', poiId)
  }

  return <Navigate replace to={`/map?${params.toString()}`} />
}
