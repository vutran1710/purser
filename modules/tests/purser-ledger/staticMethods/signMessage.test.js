import * as utils from '@vutr/purser-core/utils';
import {
  derivationPathNormalizer,
  hexSequenceNormalizer,
} from '@vutr/purser-core/normalizers';
import {
  derivationPathValidator,
  messageValidator,
} from '@vutr/purser-core/validators';
import { messageOrDataValidator } from '@vutr/purser-core/helpers';

import { signMessage } from '@vutr/purser-ledger/staticMethods';
import {
  ledgerConnection,
  handleLedgerConnectionError,
} from '@vutr/purser-ledger/helpers';

jest.dontMock('@vutr/purser-ledger/staticMethods');

jest.mock('@vutr/purser-core/validators');
/*
 * @TODO Fix manual mocks
 * This is needed since Jest won't see our manual mocks (because of our custom monorepo structure)
 * and will replace them with automatic ones
 */
jest.mock('@vutr/purser-core/utils', () =>
  require('@mocks/purser-core/utils.js'),
);
jest.mock('@vutr/purser-core/helpers', () =>
  require('@mocks/purser-core/helpers.js'),
);
jest.mock('@vutr/purser-core/normalizers', () =>
  require('@mocks/purser-core/normalizers.js'),
);
jest.mock('@vutr/purser-ledger/helpers', () =>
  require('@mocks/purser-ledger/helpers.js'),
);

const derivationPath = 'mocked-derivation-path';
const message = 'mocked-message';
const mockedArgumentsObject = {
  message,
  derivationPath,
};

describe('`Ledger` Hardware Wallet Module Static Methods', () => {
  describe('`signMessage()` static method', () => {
    afterEach(() => {
      derivationPathNormalizer.mockClear();
      derivationPathValidator.mockClear();
      hexSequenceNormalizer.mockClear();
      messageValidator.mockClear();
      hexSequenceNormalizer.mockClear();
      ledgerConnection.mockClear();
      handleLedgerConnectionError.mockClear();
    });
    test('Calls the correct ledger app method', async () => {
      await signMessage(mockedArgumentsObject);
      expect(ledgerConnection.signPersonalMessage).toHaveBeenCalled();
      expect(ledgerConnection.signPersonalMessage).toHaveBeenCalledWith(
        /*
         * We only care if the derivation path is "correct"
         */
        derivationPath,
        expect.any(String),
      );
    });
    test('Validates message input values', async () => {
      /*
       * These values are not correct. Do not use the as reference.
       * If the validators wouldn't be mocked, they wouldn't pass.
       */
      await signMessage(mockedArgumentsObject);
      /*
       * Validates the derivation path
       */
      expect(derivationPathValidator).toHaveBeenCalled();
      expect(derivationPathValidator).toHaveBeenCalledWith(derivationPath);
      /*
       * Validates the message string
       */
      expect(messageOrDataValidator).toHaveBeenCalled();
      expect(messageOrDataValidator).toHaveBeenCalledWith(
        expect.objectContaining({ message }),
      );
    });
    test('Normalizes the derivation path before sending', async () => {
      await signMessage(mockedArgumentsObject);
      /*
       * Normalizes the derivation path
       */
      expect(derivationPathNormalizer).toHaveBeenCalled();
      expect(derivationPathNormalizer).toHaveBeenCalledWith(derivationPath);
    });
    test('Warns the user to check/confirm the device', async () => {
      await signMessage(mockedArgumentsObject);
      /*
       * Calls the warning util
       */
      expect(utils.warning).toHaveBeenCalled();
    });
    test('Normalizes the return hex string', async () => {
      const {
        r: rSignatureComponent,
        s: sSignatureComponent,
        v: recoveryParameter,
      } = ledgerConnection.signPersonalMessage();
      await signMessage(mockedArgumentsObject);
      expect(hexSequenceNormalizer).toHaveBeenCalled();
      expect(hexSequenceNormalizer).toHaveBeenCalledWith(
        `${rSignatureComponent}${sSignatureComponent}${recoveryParameter}`,
      );
    });
    test('Catches is something goes wrong along the way', async () => {
      /*
       * We're re-mocking the helpers just for this test so we can simulate
       * an error along the way
       */
      ledgerConnection.mockRejectedValueOnce(new Error());
      await signMessage(mockedArgumentsObject);
      /*
       * Handles the specific transport error
       */
      expect(handleLedgerConnectionError).toHaveBeenCalled();
    });
  });
});
