interface ContractError {
  errorName?: string;
  data?: {
    errorName?: string;
  };
  message?: string;
  shortMessage?: string;
  code?: string | number;
  [key: string]: unknown;
}

export const parseVaultError = (
  err: unknown,
  actionName?: string,
  stakeAmount?: string,
  vaultData?: {
    nxdBalance?: string;
    stakedBalance?: string;
    cooldownRequest?: { amount: string } | null;
  }
): string => {
  const errorObj = (err || {}) as ContractError;
  const errorName = errorObj.errorName || errorObj.data?.errorName || '';
  const message = errorObj.message || '';
  const shortMessage = errorObj.shortMessage || '';
  const errString = JSON.stringify(errorObj) || '';

  if (
    (errorName === 'Cooldown' ||
      message.includes('Cooldown') ||
      shortMessage.includes('Cooldown') ||
      errString.includes('0xb0782df7')) &&
    actionName !== 'withdrawPenalty'
  ) {
    if (actionName === 'withdraw') {
      return 'Active 24-hour cooldown in progress! Calling this function during cooldown is not allowed.';
    }
    if (actionName === 'withdrawCooldown') {
      return 'Active 24-hour cooldown in progress! Cannot finalize withdrawal yet.';
    }
    return 'Active 24-hour cooldown in progress! Calling again at this time is not allowed.';
  }
  if (
    errorName === 'NoRequest' ||
    message.includes('NoRequest') ||
    shortMessage.includes('NoRequest')
  ) {
    return 'No active withdrawal request to process.';
  }
  if (
    (actionName === 'withdraw' ||
      actionName === 'withdrawPenalty' ||
      actionName === 'emergencyWithdraw') &&
    (errorName === 'Underflow' ||
      errorName === 'InsufficientBalance' ||
      message.includes('Underflow') ||
      message.includes('InsufficientBalance') ||
      message.includes('insufficient balance') ||
      message.includes('exceeds balance') ||
      message.includes('execution reverted') ||
      message.includes('unknown custom error') ||
      shortMessage.includes('Underflow') ||
      shortMessage.includes('InsufficientBalance') ||
      (vaultData && vaultData.stakedBalance && parseFloat(vaultData.stakedBalance) === 0) ||
      (stakeAmount &&
        vaultData &&
        vaultData.stakedBalance &&
        (() => {
          const maxAvail = vaultData.cooldownRequest
            ? Math.max(
                0,
                parseFloat(vaultData.stakedBalance) - parseFloat(vaultData.cooldownRequest.amount)
              )
            : parseFloat(vaultData.stakedBalance);
          return parseFloat(stakeAmount) > maxAvail;
        })()))
  ) {
    return 'The withdrawal exceeds available funds.';
  }
  if (
    actionName === 'deposit' &&
    (errorName === 'Underflow' ||
      errorName === 'ERC20InsufficientBalance' ||
      message.includes('Underflow') ||
      message.includes('ERC20InsufficientBalance') ||
      message.includes('insufficient balance') ||
      message.includes('exceeds balance') ||
      message.includes('execution reverted') ||
      message.includes('unknown custom error') ||
      shortMessage.includes('Underflow') ||
      shortMessage.includes('ERC20InsufficientBalance') ||
      (stakeAmount &&
        vaultData?.nxdBalance &&
        parseFloat(stakeAmount) > parseFloat(vaultData.nxdBalance)))
  ) {
    return 'Insufficient NXD balance or allowance. Please check your wallet balance.';
  }
  if (
    errorName === 'InsufficientBalance' ||
    message.includes('InsufficientBalance') ||
    shortMessage.includes('InsufficientBalance')
  ) {
    return 'Insufficient balance for this operation.';
  }
  if (
    errorName === 'ZeroAmount' ||
    message.includes('ZeroAmount') ||
    shortMessage.includes('ZeroAmount')
  ) {
    return 'Amount must be greater than zero.';
  }
  if (errorName === 'AlreadyStaked' || message.includes('AlreadyStaked')) {
    return 'Already staked or active request exists.';
  }
  if (
    errorObj.code === 'ACTION_REJECTED' ||
    errorObj.code === 4001 ||
    errorName.toLowerCase().includes('rejected') ||
    message.includes('user rejected') ||
    shortMessage.includes('user rejected')
  ) {
    return 'Transaction rejected by user.';
  }

  return (
    errorObj.shortMessage ||
    errorObj.message ||
    'Vault operation failed. Please check transaction parameters.'
  );
};

export const parseProtocolError = (err: unknown, actionName?: string): string | null => {
  const errorObj = (err || {}) as ContractError;
  const errorName = errorObj.errorName || errorObj.data?.errorName || '';
  const message = (errorObj.message || '').toLowerCase();
  const shortMessage = (errorObj.shortMessage || '').toLowerCase();

  if (
    errorObj.code === 'ACTION_REJECTED' ||
    errorObj.code === 4001 ||
    errorName.toLowerCase().includes('rejected') ||
    message.includes('user rejected') ||
    shortMessage.includes('user rejected')
  ) {
    return null; // Don't show toast if user rejected
  }

  if (errorName === 'Paused' || message.includes('paused')) {
    return 'Protocol is currently paused.';
  }
  if (
    errorName === 'NotAuthorized' ||
    message.includes('not authorized') ||
    message.includes('ownable: caller is not the owner')
  ) {
    return 'Caller is not authorized (Admin only).';
  }
  if (errorName === 'ZeroAmount' || message.includes('zero amount')) {
    return 'Amount cannot be zero.';
  }
  if (
    actionName === 'collectFees' &&
    (message.includes('insufficient') || message.includes('reverted'))
  ) {
    return 'No fees available to collect or transfer failed.';
  }
  if (
    actionName === 'processTax' &&
    (message.includes('insufficient') || message.includes('reverted'))
  ) {
    return 'Tax processing failed or nothing to process.';
  }

  return errorObj.shortMessage || errorObj.message || 'Protocol operation failed.';
};

export const parseDepositError = (err: unknown): string => {
  const errorObj = (err || {}) as ContractError;
  const errorName = errorObj.errorName || errorObj.data?.errorName || '';
  const message = errorObj.message || '';
  const shortMessage = errorObj.shortMessage || '';

  if (
    errorObj.code === 'ACTION_REJECTED' ||
    errorObj.code === 4001 ||
    errorName.toLowerCase().includes('rejected') ||
    message.includes('user rejected') ||
    shortMessage.includes('user rejected')
  ) {
    return 'Transaction rejected by user.';
  }

  if (errorName === 'MintingFinished' || message.includes('mintingfinished')) {
    return 'Minting has been finished for this tier.';
  }
  if (errorName === 'InvalidTier' || message.includes('invalidtier')) {
    return 'Invalid tier specified.';
  }
  if (
    errorName === 'InsufficientPayment' ||
    message.includes('insufficientpayment') ||
    message.includes('insufficient value')
  ) {
    return 'Insufficient ETH/payment provided for minting.';
  }

  return errorObj.shortMessage || errorObj.message || 'Deposit operation failed.';
};
