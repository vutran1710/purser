import metamaskWallet from '@vutr/purser-metamask';
import { detect as detectHelper } from '@vutr/purser-metamask/helpers';

jest.dontMock('@vutr/purser-metamask');

/*
 * @TODO Fix manual mocks
 * This is needed since Jest won't see our manual mocks (because of our custom monorepo structure)
 * and will replace them with automatic ones
 */
jest.mock('@vutr/purser-metamask/helpers', () =>
  require('@mocks/purser-metamask/helpers'),
);

describe('Metamask` Wallet Module', () => {
  describe('`detect()` static method', () => {
    test('Calls the correct helper method', async () => {
      await metamaskWallet.detect();
      /*
       * Call the helper method
       */
      expect(detectHelper).toHaveBeenCalled();
    });
  });
});
