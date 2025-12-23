import client from 'prom-client';

// Create a Registry which registers the metrics
export const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
    app: 'x4pn-platform'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Custom Metrics
export const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

export const activeSessionsGauge = new client.Gauge({
    name: 'x4pn_active_sessions_total',
    help: 'Total number of active VPN sessions'
});

export const activeNodesGauge = new client.Gauge({
    name: 'x4pn_active_nodes_total',
    help: 'Total number of active Nodes'
});

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(activeSessionsGauge);
register.registerMetric(activeNodesGauge);
