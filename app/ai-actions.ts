export type AiActionType =
  | "generateCompleteIdea"
  | "regenerateTitle"
  | "regenerateLocation"
  | "regenerateImportantObject"
  | "regenerateActionOrTrap"
  | "regenerateEndingOrPayoff"
  | "generateProductionPack"
  | "fixQualityIssue"
  | "fixAllQualityIssues";

export const CREDITS_ENABLED = false;

// A server-side billing adapter can replace these development defaults without
// changing UI behavior. Internal diversity retries remain one customer action.
export const aiActionCreditCost: Record<AiActionType, number> = {
  generateCompleteIdea: 1,
  regenerateTitle: 1,
  regenerateLocation: 1,
  regenerateImportantObject: 1,
  regenerateActionOrTrap: 1,
  regenerateEndingOrPayoff: 1,
  generateProductionPack: 1,
  fixQualityIssue: 1,
  fixAllQualityIssues: 1,
};

export type CreditReservation = { action: AiActionType; reserved: boolean };

export function reserveAiAction(action: AiActionType): CreditReservation {
  return { action, reserved: CREDITS_ENABLED };
}

export function settleAiAction(_reservation: CreditReservation, _successful: boolean) {
  // Development mode has no customer balance. Production adapters commit or
  // release their server-side reservation here after the validated response.
}
