'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import type { Map as LeafletMap } from 'leaflet'
import type { FleetTech } from '@/types/ops'
import { MapMarker } from './MapMarker'

const TILE_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

interface FleetMapProps {
  techs: FleetTech[]
  onSelectTech: (tech: FleetTech) => void
}

function useTheme(): 'dark' | 'light' {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  useEffect(() => {
    const check = () => setTheme(document.documentElement.classList.contains('light') ? 'light' : 'dark')
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return theme
}

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
  const theme = useTheme()

  const defaultCenter: [number, number] = [30.2672, -97.7431]

  return (
    <MapContainer
      center={defaultCenter}
      zoom={11}
      className="h-full w-full"
      ref={mapRef}
      zoomControl={true}
      style={{ minHeight: '400px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url={theme === 'light' ? TILE_LIGHT : TILE_DARK}
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
