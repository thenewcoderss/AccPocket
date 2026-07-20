export const ACCOUNT_HISTORY_DELETE_REASON = "This wallet has transaction history and cannot be deleted.";
export const ACCOUNT_GOAL_DELETE_REASON = "This wallet is used by a savings goal and cannot be deleted.";
export const ACCOUNT_ACTIVE_GOAL_ARCHIVE_REASON = "Move, complete, or remove the active savings goal using this wallet before archiving it.";

export function accountActions(entryCount: number, goalCount: number, activeGoalCount: number, isArchived: boolean) {
  return {
    canDelete: entryCount === 0 && goalCount === 0,
    deleteBlockedReason: entryCount ? ACCOUNT_HISTORY_DELETE_REASON : goalCount ? ACCOUNT_GOAL_DELETE_REASON : undefined,
    canArchive: !isArchived && activeGoalCount === 0,
    archiveBlockedReason: activeGoalCount ? ACCOUNT_ACTIVE_GOAL_ARCHIVE_REASON : undefined
  };
}

export function isArchivedAccount(account: { archivedAt: Date | null }) {
  return account.archivedAt !== null;
}
