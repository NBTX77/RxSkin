'use client'

import { useEffect, useRef } from 'react'
import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import type { FleetTech } from '@/types/ops'

interface FleetMarkerProps {
  tech: FleetTech
  isSelected: boolean
  onClick: () => void
}

function getHosColor(hosColor: FleetTech['hosColor']): string {
  switch (hosColor) {
    case 'green': return '#22c55e'
    case 'yellow': return '#eab308'
    case 'red': return '#ef4444'
    default: return '#6b7280'
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function createMarkerIcon(tech: FleetTech, isSelected: boolean): L.DivIcon {
  const color = getHosColor(tech.hosColor)
  const initials = getInitials(tech.name)
  const hasTicket = !!tech.currentTicket
  const heading = tech.heading ?? 0
  const isMoving = tech.speed > 2

  const pulseRing = hasTicket
    ? `<span class="fleet-marker-pulse" style="border-color: ${color};"></span>`
    : ''

  const headingArrow = isMoving
    ? `<span class="fleet-marker-arrow" style="transform: rotate(${heading}deg); border-bottom-color: ${color};"></span>`
    : ''

  const selectedRing = isSelected ? 'box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.7);' : ''

  const html = `
    <div class="fleet-marker-wrapper">
      ${pulseRing}
      <div class="fleet-marker-circle" style="background: ${color}; ${selectedRing}">
        <span class="fleet-marker-initials">${initials}</span>
      </div>
      ${headingArrow}
    </div>
  `

  return L.divIcon({
    html,
    className: 'fleet-marker-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

export function FleetMarker({ tech, isSelected, onClick }: FleetMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setIcon(createMarkerIcon(tech, isSelected))
    }
  }, [tech, isSelected])

  if (tech.lat === 0 && tech.lng === 0) return null

  return (
    <Marker
      ref={markerRef}
      position={[tech.lat, tech.lng]}
      icon={createMarkerIcon(tech, isSelected)}
      eventHandlers={{ click: onClick }}
    >
      <Tooltip direction="top" offset={[0, -24]} opacity={0.95}>
        <div className="text-xs leading-tight">
          <div className="font-semibold">{tech.name}</div>
          <div className="opacity-80">{tech.truckName}</div>
          <div className="opacity-70">
            {tech.speed > 0 ? `${Math.round(tech.speed)} mph` : 'Stationary'}
            {' · '}
            {tech.hosRemaining} remaining
          </div>
        </div>
      </Tooltip>
    </Marker>
  )
}
