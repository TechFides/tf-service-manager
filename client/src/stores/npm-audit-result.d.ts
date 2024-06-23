interface NpmAuditOutput {
  auditReportVersion: number;
  vulnerabilities: Record<string, VulnerabilityDetails>;
  metadata: Metadata;
}
interface Metadata {
  vulnerabilities: VulnerabilityCount;
  dependencies: DependencyCount;
  devDependencies: DependencyCount;
  optionalDependencies: DependencyCount;
  totalDependencies: number;
}
interface VulnerabilityCount {
  info: number;
  low: number;
  moderate: number;
  high: number;
  critical: number;
}
interface DependencyCount {
  count: number;
  audited: number;
  unaudited: number;
}
interface VulnerabilityDetails {
  name: string;
  severity: "info" | "low" | "moderate" | "high" | "critical";
  isDirect: boolean;
  via: (string | ViaDetails)[];
  effects: string[];
  range: string;
  nodes: string[];
  fixAvailable: boolean | FixAvailableDetails;
  id: number;
  url: string;
  title: string;
  module_name: string;
  cwe: string[];
  cvss: CvssDetails;
  source: string;
  dependency: string;
  path: string;
  references: string[];
}
interface ViaDetails {
  source: number;
  name: string;
  dependency: string;
  title: string;
  url: string;
}
interface FixAvailableDetails {
  name: string;
  version: string;
  isSemVerMajor: boolean;
}
interface CvssDetails {
  score: number;
  vectorString: string;
}
export {
  NpmAuditOutput,
  Metadata,
  VulnerabilityCount,
  DependencyCount,
  VulnerabilityDetails,
  ViaDetails,
  FixAvailableDetails,
  CvssDetails,
};
