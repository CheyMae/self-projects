import { geometry, type CosmosMode } from './geometry'
import { useViewport } from './useViewport'

export function useGeometry(mode: CosmosMode) {
  const { w, h } = useViewport()
  return geometry(mode, w, h)
}
