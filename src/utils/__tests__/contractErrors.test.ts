import { describe, it, expect } from 'vitest';
import { parseVaultError, parseProtocolError, parseDepositError } from '../contractErrors';

describe('contractErrors', () => {
  describe('parseVaultError', () => {
    it('should handle Cooldown error', () => {
      const error = { errorName: 'Cooldown', message: 'Cooldown active' };
      const result = parseVaultError(error, 'withdraw');
      expect(result).toContain('cooldown');
    });

    it('should handle NoRequest error', () => {
      const error = { errorName: 'NoRequest', message: 'No request' };
      const result = parseVaultError(error, 'withdrawCooldown');
      expect(result).toContain('No active withdrawal request');
    });

    it('should handle InsufficientBalance error on withdraw', () => {
      const error = { errorName: 'InsufficientBalance', message: 'InsufficientBalance' };
      const result = parseVaultError(error, 'withdraw', '100', { stakedBalance: '50' });
      expect(result).toContain('exceeds available funds');
    });

    it('should handle ZeroAmount error', () => {
      const error = { errorName: 'ZeroAmount', message: 'ZeroAmount' };
      const result = parseVaultError(error, 'deposit');
      expect(result).toContain('greater than zero');
    });

    it('should handle AlreadyStaked error', () => {
      const error = { errorName: 'AlreadyStaked', message: 'AlreadyStaked' };
      const result = parseVaultError(error, 'deposit');
      expect(result).toContain('Already staked');
    });

    it('should handle user rejection', () => {
      const error = { code: 'ACTION_REJECTED', message: 'user rejected' };
      const result = parseVaultError(error, 'withdraw');
      expect(result).toContain('rejected by user');
    });

    it('should handle user rejection with code 4001', () => {
      const error = { code: 4001, message: 'User denied' };
      const result = parseVaultError(error, 'deposit');
      expect(result).toContain('rejected by user');
    });

    it('should handle unknown error with shortMessage', () => {
      const error = { shortMessage: 'Unknown error occurred' };
      const result = parseVaultError(error, 'withdraw');
      expect(result).toBe('Unknown error occurred');
    });

    it('should handle null error', () => {
      const result = parseVaultError(null, 'withdraw');
      expect(result).toBe('Vault operation failed. Please check transaction parameters.');
    });

    it('should handle empty error object', () => {
      const result = parseVaultError({}, 'withdraw');
      expect(result).toBe('Vault operation failed. Please check transaction parameters.');
    });
  });

  describe('parseProtocolError', () => {
    it('should return null for user rejection', () => {
      const error = { code: 'ACTION_REJECTED', message: 'user rejected' };
      const result = parseProtocolError(error, 'deposit');
      expect(result).toBeNull();
    });

    it('should handle Paused error', () => {
      const error = { errorName: 'Paused', message: 'Protocol paused' };
      const result = parseProtocolError(error, 'deposit');
      expect(result).toContain('paused');
    });

    it('should handle NotAuthorized error', () => {
      const error = { errorName: 'NotAuthorized', message: 'NotAuthorized' };
      const result = parseProtocolError(error, 'adminFunction');
      expect(result).toContain('not authorized');
    });

    it('should handle ZeroAmount error', () => {
      const error = { errorName: 'ZeroAmount', message: 'zero amount' };
      const result = parseProtocolError(error, 'deposit');
      expect(result).toContain('cannot be zero');
    });

    it('should handle collectFees insufficient', () => {
      const error = { message: 'insufficient funds' };
      const result = parseProtocolError(error, 'collectFees');
      expect(result).toContain('No fees available');
    });

    it('should handle processTax reverted', () => {
      const error = { message: 'execution reverted' };
      const result = parseProtocolError(error, 'processTax');
      expect(result).toContain('Tax processing failed');
    });

    it('should handle unknown error', () => {
      const error = { message: 'Something went wrong' };
      const result = parseProtocolError(error, 'deposit');
      expect(result).toBe('Something went wrong');
    });
  });

  describe('parseDepositError', () => {
    it('should handle user rejection', () => {
      const error = { code: 'ACTION_REJECTED', message: 'user rejected' };
      const result = parseDepositError(error);
      expect(result).toContain('rejected by user');
    });

    it('should handle MintingFinished error', () => {
      const error = { errorName: 'MintingFinished', message: 'mintingfinished' };
      const result = parseDepositError(error);
      expect(result).toContain('Minting has been finished');
    });

    it('should handle InvalidTier error', () => {
      const error = { errorName: 'InvalidTier', message: 'invalidtier' };
      const result = parseDepositError(error);
      expect(result).toContain('Invalid tier');
    });

    it('should handle InsufficientPayment error', () => {
      const error = { errorName: 'InsufficientPayment', message: 'insufficientpayment' };
      const result = parseDepositError(error);
      expect(result).toContain('Insufficient ETH');
    });

    it('should handle unknown error with message', () => {
      const error = { message: 'Unknown deposit error' };
      const result = parseDepositError(error);
      expect(result).toBe('Unknown deposit error');
    });

    it('should handle null error', () => {
      const result = parseDepositError(null);
      expect(result).toBe('Deposit operation failed.');
    });
  });
});
