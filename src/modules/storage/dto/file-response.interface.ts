export interface FileUploadResponse {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  status: string;
}
