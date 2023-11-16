/**
 * Returns Quota data based on type
 * Open for extensions if people are willing to implement them in QuotaModes enums
 */

export enum QuotaModes {
  DummyQuota = "DummyQuota",
  TokenQuotaTransactionsCount = "TokenQuotaTransactionsCount",
}

export function handleQuotas(quotaType: QuotaModes = QuotaModes.DummyQuota) {
  if (QuotaModes.TokenQuotaTransactionsCount === quotaType) {
    return {
      quota: 1,
      unit: "transactionCount",
      totalQuota: 1,
      resetDate: getDummyResetDate(new Date()),
    };
  }

  return handleDummyQuota();
}

function handleDummyQuota() {
  return {
    quota: 1543091,
    unit: "gas",
    totalQuota: 5000000,
    resetDate: getDummyResetDate(new Date()),
  };
}

function getDummyResetDate(resetDate: Date) {
  resetDate.setMonth(resetDate.getMonth() + 1);
  resetDate.setDate(1);
  resetDate.setHours(0);
  resetDate.setMinutes(0);
  resetDate.setSeconds(0);
  resetDate.setMilliseconds(0);
  return Math.floor(resetDate.getTime() / 1000);
}
