'use client'

import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { FleetTech } from '@/types/ops'

interface MapMarkerProps {
  tech: FleetTech
  onClick: () => void
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function getMarkerColor(tech: FleetTech): string {
  if (tech.hosColor === 'red') return '#f85149'
  if (tech.hosColor === 'yellow') return '#d29922'
  if (tech.currentTicket?.priority === 'Critical') return '#f85149'
  if (tech.dispatch.some((d) => d.status === 'In Progress')) return '#58a6ff'
  return '#3fb950'
}

function createCustomIcon(tech: FleetTech): L.DivIcon {
  const color = getMarkerColor(tech)
  const initials = getInitials(tech.name)

  return L.divIcon({
    className: 'custom-fleet-marker',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: ${color}33;
        border: 2px solid ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
        font-weight: 700;
        box-shadow: 0 2px 8px ${color}44;
        ${tech.heading !== undefined ? `transform: rotate(0deg);` : ''}
      ">
        ${initials}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  })
}

export function MapMarker({ tech, onClick }: MapMarkerProps) {
  if (!tech.lat || !tech.lng) return null

  const icon = createCustomIcon(tech)

  return (
    <Marker
      position={[tech.lat, tech.lng]}
      icon={icon}
      eventHandlers={{
        click: onClick,
      }}
    >
      <Popup className="fleet-popup">
        <div style={{ minWidth: '180px', color: '#e6edf3', fontFamily: 'system-ui' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
            {tech.name}
          </div>
          <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '6px' }}>
            {tech.truckName}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: tech.speed > 0 ? '#3fb950' : '#8b949e' }}>
              {tech.speed > 0 ? `${tech.speed} mph` : 'Parked'}
            </span>
            <span style={{
              color: tech.hosColor === 'red' ? '#f85149' : tech.hosColor === 'yellow' ? '#d29922' : '#3fb950'
            }}>
              HOS: {tech.hosRemaining}
            </span>
          </div>
          {tech.currentTicket && (
            <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '6px', borderTop: '1px solid #30363d', paddingTop: '6px' }}>
              #{tech.currentTicket.id} — {tech.currentTicket.summary}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  )
}
