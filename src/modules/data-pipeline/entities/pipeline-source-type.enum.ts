/**
 * Tipos de fuente para pipelines de ingestion de datos
 * Función: BBC-DLP-V3-001
 */
export enum PipelineSourceType {
  KAFKA = 'kafka',
  CDC = 'cdc',
  API = 'api',
  STREAM = 'stream',
  BATCH = 'batch',
}
