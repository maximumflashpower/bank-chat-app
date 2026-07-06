/**
 * Tipos de métricas de monitoreo de servicios
 * Función: MONITOR-RT-001 a 010
 */
export enum MetricType {
  UPTIME = 'uptime',
  LATENCY = 'latency',
  ERROR_RATE = 'error_rate',
  THROUGHPUT = 'throughput',
  CPU = 'cpu',
  MEMORY = 'memory',
  DISK = 'disk',
  NETWORK = 'network',
  CUSTOM = 'custom',
}
