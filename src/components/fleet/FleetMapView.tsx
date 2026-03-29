'use client'

import 'leaflet/dist/leaflet.css'

import { useState, useEffect, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Maximize2 } from 'lucide-react'
import { useFleetData } from '@/hooks/useFleetData'
import { FleetMarker } from './FleetMarker'
import { FleetTechList } from './FleetTechList'
import { FleetTechPanel } from './FleetTechPanel'
import { FleetStatusBar } from './FleetStatusBar'
import type { FleetTech, FleetTrailPoint } from '@/types/ops'

// ── Tile URLs ───────────────────────────────────────────────
const TILE_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION = '&copy; <a href="https://carto.com/">CARTO</a>'
const US_CENTER: [number, number] = [39.8283, -98.5795]
const DEFAULT_ZOOM = 5

// ── CSS for custom markers (injected once) ──────────────────
const MARKER_CSS = `
.fleet-marker-icon {
  background: transparent !important;
  border: none !important;
}
.fleet-marker-wrapper {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fleet-marker-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255,255,255,0.9);
  box-shadow: 0 2px 6px rgba(0,0,0,0.35);
  z-index: 2;
  transition: box-shadow 0.2s;
}
.fleet-marker-initials {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  line-height: 1;
  letter-spacing: 0.5px;
}
.fleet-marker-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid;
  opacity: 0;
  z-index: 1;
  animation: fleet-pulse 2s ease-out infinite;
}
@keyframes fleet-pulse {
  0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
}
.fleet-marker-arrow {
  position: absolute;
  top: -6px;
  left: 50%;
  margin-left: -5px;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 8px solid;
  z-index: 3;
  transform-origin: center 26px;
}
`

// ── Theme detection hook ────────────────────────────────────
function useTheme(): 'dark' | 'light' {
  const [theme, setTheme] = useState<'dark' | 'light'>('light')

  useEffect(() => {
    const check = () =>
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return theme
}

// ── Theme-aware tile layer ──────────────────────────────────
function ThemeTileLayer() {
  const theme = useTheme()
  return (
    <TileLayer
      attribution={TILE_ATTRIBUTION}
      url={theme === 'dark' ? TILE_DARK : TILE_LIGHT}
    />
  )
}

// ── Auto-fit bounds on initial load ─────────────────────────
function FitBounds({ techs }: { techs: FleetTech[] }) {
  const map = useMap()
  const fitted = useRef(false)

  useEffect(() => {
    if (fitted.current) return
    const valid = techs.filter((t) => t.lat !== 0 && t.lng !== 0)
    if (valid.length === 0) return

    const bounds = L.latLngBounds(valid.map((t) => [t.lat, t.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 })
    fitted.current = true
  }, [techs, map])

  return null
}

// ── Fly-to selected tech ────────────────────────────────────
function FlyToTech({ tech }: { tech: FleetTech | null }) {
  const map = useMap()

  useEffect(() => {
    if (!tech || (tech.lat === 0 && tech.lng === 0)) return
    map.flyTo([tech.lat, tech.lng], 14, { duration: 1.2 })
  }, [tech, map])

  return null
}

// ── GPS trail polyline ──────────────────────────────────────
function GpsTrail({ points }: { points: FleetTrailPoint[] }) {
  if (points.length < 2) return null

  const positions = points.map((p) => [p.lat, p.lng] as [number, number])

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: '#3b82f6',
        weight: 3,
        opacity: 0.7,
        dashArray: '8 6',
      }}
    />
  )
}

// ── Fit All button component ────────────────────────────────
function FitAllButton({ techs }: { techs: FleetTech[] }) {
  const map = useMap()

  const handleFitAll = useCallback(() => {
    const valid = techs.filter((t) => t.lat !== 0 && t.lng !== 0)
    if (valid.length === 0) return
    const bounds = L.latLngBounds(valid.map((t) => [t.lat, t.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 })
  }, [techs, map])

  return (
    <button
      onClick={handleFitAll}
      className="absolute bottom-20 right-3 z-[1000] p-2 rounded-lg backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700/50 shadow-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title="Fit all technicians"
    >
      <Maximize2 className="h-4 w-4" />
    </button>
  )
}

// ── Main FleetMapView ───────────────────────────────────────
export function FleetMapView() {
  const { data, isLoading, refetch, isFetching } = useFleetData()
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null)
  const [showTrail, setShowTrail] = useState(false)
  const [trailPoints, setTrailPoints] = useState<FleetTrailPoint[]>([])

  const techs = data?.techs ?? []
  const selectedTech = techs.find((t) => t.id === selectedTechId) ?? null

  // Inject marker CSS once
  useEffect(() => {
    const id = 'fleet-marker-styles'
    if (document.getElementById(id)) return
    const style = document.createElement('style')
    style.id = id
    style.textContent = MARKER_CSS
    document.head.appendChild(style)
  }, [])

  // Fetch trail when toggled on
  useEffect(() => {
    if (!showTrail || !selectedTech) {
      setTrailPoints([])
      return
    }

    let cancelled = false
    async function fetchTrail() {
      try {
        const res = await fetch('/api/fleet/trails')
        if (!res.ok) return
        const json = await res.json()
        if (cancelled) return
        const vehicleTrail = json.trails?.find(
          (t: { vehicleId: string }) => t.vehicleId === selectedTech?.vehicleId
        )
        setTrailPoints(vehicleTrail?.points ?? [])
      } catch {
        // Silently fail — trail is non-critical
      }
    }

    fetchTrail()
    return () => { cancelled = true }
  }, [showTrail, selectedTech])

  const handleSelectTech = useCallback((tech: FleetTech) => {
    setSelectedTechId(tech.id)
    setShowTrail(false)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedTechId(null)
    setShowTrail(false)
    setTrailPoints([])
  }, [])

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className="-m-4 lg:-m-6 h-[calc(100vh-3.5rem)] bg-gray-100 dark:bg-gray-950 flex items-center justify-center"
        data-feedback-component="FleetMap"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span className="text-sm text-gray-500">Loading fleet map...</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className="-m-4 lg:-m-6 h-[calc(100vh-3.5rem)] relative"
      data-feedback-component="FleetMap"
    >
      <MapContainer
        center={US_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={true}
        style={{ minHeight: '400px' }}
      >
        <ThemeTileLayer />
        <FitBounds techs={techs} />
        <FlyToTech tech={selectedTech} />

        {/* Tech markers */}
        {techs.map((tech) => (
          <FleetMarker
            key={tech.id}
            tech={tech}
            isSelected={selectedTechId === tech.id}
            onClick={() => handleSelectTech(tech)}
          />
        ))}

        {/* GPS trail */}
        {showTrail && trailPoints.length > 0 && <GpsTrail points={trailPoints} />}

        {/* Fit All button (inside map context for useMap access) */}
        <FitAllButton techs={techs} />
      </MapContainer>

      {/* Floating overlays */}
      <FleetStatusBar
        techs={techs}
        lastSync={data?.lastSync}
        isRefreshing={isFetching}
        onRefresh={() => refetch()}
      />

      <FleetTechList
        techs={techs}
        selectedTechId={selectedTechId}
        onSelectTech={handleSelectTech}
      />

      {selectedTech && (
        <FleetTechPanel
          tech={selectedTech}
          showTrail={showTrail}
          onToggleTrail={setShowTrail}
          onClose={handleClose}
        />
      )}
    </div>
  )
}
