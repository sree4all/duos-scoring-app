export interface DisqualificationApproval {
  requiresSecondAdmin: boolean;
  reviewerApproved: boolean;
  finalApproverApproved?: boolean;
}

export function canApplyDisqualification(input: DisqualificationApproval): boolean {
  if (!input.requiresSecondAdmin) {
    return input.reviewerApproved;
  }
  return input.reviewerApproved === true && input.finalApproverApproved === true;
}
