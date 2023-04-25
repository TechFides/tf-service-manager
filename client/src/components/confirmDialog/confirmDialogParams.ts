interface ConfirmAction {
  (): void;
}

export interface ConfirmDialogParams {
  title: string;
  cancelBtnLabel?: string;
  confirmBtnLabel?: string;
  confirmAction: ConfirmAction;
}
