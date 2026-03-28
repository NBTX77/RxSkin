# RX Skin - Integrations Reference

## ConnectWise Manage (Primary)
API: REST v2022.1+, Basic Auth, ~40 req/sec. Client: src/lib/cw/client.ts.
Endpoints: /service/tickets, /time/entries, /schedule/entries, /company/companies, /system/members

## Samsara (Fleet/GPS)
API: REST, Bearer token, 100 req/min. Client: src/lib/samsara/client.ts.
Merge: src/lib/fleet/merge.ts (vehicles + drivers + CW members + schedule -> FleetTech[])
Endpoints: /fleet/vehicles/locations, /fleet/vehicles/stats, /fleet/drivers, /fleet/hos/clocks

## ConnectWise Control (ScreenConnect)
Server: https://control.rxtech.com, Basic Auth.
Session GUID: POST /Services/PageService.ashx/GetHostSessionInfo
Launch URL: https://control.rxtech.com/Host#Access/All%20Machines//<GUID>/Join

## ConnectWise Automate (RMM)
Auth: API Key + session token. Endpoints: /Computers, /Scripts, /Scripts/{id}/execute

## Microsoft Graph (Phase 2)
OAuth2 per-user, Azure AD multi-tenant. Scopes: Mail.Read Mail.Send Calendars.ReadWrite Presence.Read.All Chat.Read

## Webex (Phase 2)
OAuth2 per-user. Scopes: spark:calling spark:messages_read spark:messages_write

## Future (Phase 3)
Auvik, Meraki, Datto BCDR, Acronis, Fortinet, SentinelOne, Passportal, ScalePad

Last updated: 2026-03-28
