import { DocumentItem, BreadcrumbSegment } from '@/types/documents';

export function normalizeDocumentItem(raw: Record<string, unknown>): DocumentItem {
  const folder = raw.folder as Record<string, unknown> | undefined;
  const file = raw.file as Record<string, unknown> | undefined;
  const isFolder = !!folder;
  const fileName = (raw.name as string) || '';
  const ext = isFolder ? null : fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() || null : null;
  const lastModifiedBy = raw.lastModifiedBy as Record<string, unknown> | undefined;
  const user = lastModifiedBy?.user as Record<string, unknown> | undefined;
  const parentRef = raw.parentReference as Record<string, unknown> | undefined;
  const parentPath = parentRef?.path as string | undefined;

  return {
    id: raw.id as string,
    name: fileName,
    type: isFolder ? 'folder' : 'file',
    size: isFolder ? null : (raw.size as number) || 0,
    mimeType: (file?.mimeType as string) || null,
    extension: ext,
    childCount: (folder?.childCount as number) ?? null,
    lastModifiedAt: (raw.lastModifiedDateTime as string) || '',
    lastModifiedBy: (user?.displayName as string) || 'Unknown',
    createdAt: (raw.createdDateTime as string) || '',
    webUrl: (raw.webUrl as string) || '',
    downloadUrl: (raw['@microsoft.graph.downloadUrl'] as string) || null,
    parentPath: parentPath?.replace(/.*root:/, '') || '/',
    parentId: (parentRef?.id as string) || null,
  };
}

export function buildBreadcrumb(pathSegments: Array<{ id: string; name: string }>): BreadcrumbSegment[] {
  return [
    { id: null, name: 'Documents' },
    ...pathSegments,
  ];
}

export function getFileIcon(extension: string | null, type: 'file' | 'folder'): string {
  if (type === 'folder') return 'Folder';
  switch (extension) {
    case 'pdf': return 'FileText';
    case 'doc': case 'docx': return 'FileText';
    case 'xls': case 'xlsx': return 'FileSpreadsheet';
    case 'ppt': case 'pptx': return 'Presentation';
    case 'jpg': case 'jpeg': case 'png': case 'gif': case 'webp': return 'Image';
    case 'mp4': case 'avi': case 'mov': return 'Video';
    case 'zip': case 'rar': case '7z': return 'FileArchive';
    case 'txt': return 'FileText';
    case 'csv': return 'FileSpreadsheet';
    default: return 'File';
  }
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
