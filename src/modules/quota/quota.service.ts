/**
 * Returns Dummy Quota data
 */
export function handleQuota() {
  const resetDate = new Date();

  resetDate.setMonth(resetDate.getMonth() + 1);
  resetDate.setDate(1);
  resetDate.setHours(0);
  resetDate.setMinutes(0);
  resetDate.setSeconds(0);
  resetDate.setMilliseconds(0);

  return {
    quota: 1543091,
    unit: "gas",
    totalQuota: 5000000,
    resetDate: Math.floor(resetDate.getTime() / 1000),
  };
}
