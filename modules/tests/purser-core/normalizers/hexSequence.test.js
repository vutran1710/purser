import { hexSequenceNormalizer } from '@vutr/purser-core/normalizers';

jest.dontMock('@vutr/purser-core/utils');
jest.dontMock('@vutr/purser-core/normalizers');

const unPrefixedHexString = 'ead7de0ec184a6c8a';
const prefixedHexString = '0xead7de0ec184a6c8a';

describe('`Core` Module', () => {
  describe('`addressNormalizer()` normalizer', () => {
    test('Adds a prefix to an hex string seqeunce', () => {
      expect(hexSequenceNormalizer(unPrefixedHexString)).toEqual(
        prefixedHexString,
      );
    });
    test('Removes prefix to an hex string seqeunce', () => {
      expect(hexSequenceNormalizer(prefixedHexString, false)).toEqual(
        unPrefixedHexString,
      );
    });
  });
});
