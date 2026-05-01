export interface ParticipantNotification {
  participantId: string;
  disputeId: string;
  summary: string;
}

export async function notifyDisputeResolved(notification: ParticipantNotification) {
  return {
    delivered: true,
    ...notification,
    sentAt: new Date().toISOString(),
  };
}
