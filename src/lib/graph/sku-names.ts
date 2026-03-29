export const SKU_FRIENDLY_NAMES: Record<string, string> = {
  'ENTERPRISEPACK': 'Office 365 E3',
  'SPE_E3': 'Microsoft 365 E3',
  'SPE_E5': 'Microsoft 365 E5',
  'EXCHANGESTANDARD': 'Exchange Online Plan 1',
  'EXCHANGEENTERPRISE': 'Exchange Online Plan 2',
  'EMS': 'Enterprise Mobility + Security E3',
  'EMSPREMIUM': 'Enterprise Mobility + Security E5',
  'POWER_BI_STANDARD': 'Power BI Free',
  'POWER_BI_PRO': 'Power BI Pro',
  'PROJECTPROFESSIONAL': 'Project Plan 3',
  'VISIOCLIENT': 'Visio Plan 2',
  'ATP_ENTERPRISE': 'Microsoft Defender for Office 365 P1',
  'THREAT_INTELLIGENCE': 'Microsoft Defender for Office 365 P2',
  'FLOW_FREE': 'Power Automate Free',
  'TEAMS_EXPLORATORY': 'Microsoft Teams Exploratory',
  'STREAM': 'Microsoft Stream',
  'AAD_PREMIUM': 'Azure AD Premium P1',
  'AAD_PREMIUM_P2': 'Azure AD Premium P2',
  'INTUNE_A': 'Microsoft Intune Plan 1',
  'WIN_DEF_ATP': 'Microsoft Defender for Endpoint P2',
}

export function getSkuFriendlyName(skuPartNumber: string): string {
  return SKU_FRIENDLY_NAMES[skuPartNumber] ?? skuPartNumber.replace(/_/g, ' ')
}
