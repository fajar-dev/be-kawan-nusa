export enum PointAdjustmentStatus {
    PENDING_APPROVAL = "pending_approval",
    NEEDS_REVISION = "needs_revision",
    APPROVED_PENDING_CREDIT = "approved_pending_credit",
    COMPLETED = "completed",
}

export enum PointAdjustmentAction {
    SUBMITTED = "submitted",
    RETURNED_FOR_REVISION = "returned_for_revision",
    RESUBMITTED = "resubmitted",
    APPROVED = "approved",
    CREDITED = "credited",
}
