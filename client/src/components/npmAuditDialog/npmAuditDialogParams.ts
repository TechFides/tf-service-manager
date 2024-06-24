interface ConfirmAction {
  (params: {
    servicesToFix: string[];
    useForce: boolean;
    pushToOrigin: boolean;
    branch: string;
  }): void;
}

export interface NpmAuditDialogParams {
  confirmAction: ConfirmAction;
  servicesToFix: { name: string; fix: boolean }[];
}
