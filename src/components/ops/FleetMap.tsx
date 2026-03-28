'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Map as LeafletMap } from 'leaflet'
import type { FleetTech } from '@/types/ops'
import { MapMarker } from './MapMarker'

// Leaflet CSS must be imported for tiles to render correctly
import 'leaflet/dist/leaflet.css'

// Fix default marker icon paths (Webpack breaks them)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface FleetMapProps {
  techs: FleetTech[]
  onSelectTech: (tech: FleetTech) => void
}

/**
 * Helper component to auto-fit map bounds to all markers.
 */
function FitBounds({ techs }: { techs: FleetTech[] }) {
  const map = useMap()
  const hasSetInitialBounds = useRef(false)

  useEffect(() => {
    if (hasSetInitialBounds.current) return
    const validTechs = techs.filter((t) => t.lat !== 0 && t.lng !== 0)
    if (validTechs.length === 0) return

    const bounds = validTechs.map((t) => [t.lat, t.lng] as [number, number])
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 })
    hasSetInitialBounds.current = true
  }, [techs, map])

  return null
}

export function FleetMap({ techs, onSelectTech }: FleetMapProps) {
  const mapRef = useRef<LeafletMap | null>(null)

  // Default center: Austin, TX
  const defaultCenter: [number, number] = [30.2672, -97.7431]

  return (
    <MapContainer
      center={defaultCenter}
      zoom={11}
      className="h-full w-full rounded-xl"
      ref={mapRef}
      zoomControl={true}
      style={{ minHeight: '400px', height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <FitBounds techs={techs} />
      {techs
        .filter((t) => t.lat !== 0 && t.lng !== 0)
        .map((tech) => (
          <MapMarker
            key={tech.id}
            tech={tech}
            onClick={() => onSelectTech(tech)}
          />
        ))}
    </MapContainer>
  )
}
