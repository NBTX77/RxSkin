export interface DocumentItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size: number | null;
  mimeType: string | null;
  extension: string | null;
  childCount: number | null;
  lastModifiedAt: string;
  lastModifiedBy: string;
  createdAt: string;
  webUrl: string;
  downloadUrl: string | null;
  parentPath: string;
  parentId: string | null;
}

export interface BreadcrumbSegment {
  id: string | null;
  name: string;
}

export interface DocumentListResponse {
  items: DocumentItem[];
  breadcrumb: BreadcrumbSegment[];
  hasMore: boolean;
  nextToken?: string;
}
