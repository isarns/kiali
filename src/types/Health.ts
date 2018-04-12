export interface Health {
  envoy: EnvoyHealth;
  deploymentStatuses: DeploymentStatus[];
}

export interface EnvoyHealth {
  healthy: number;
  total: number;
}

export interface DeploymentStatus {
  name: string;
  replicas: number;
  available: number;
}
