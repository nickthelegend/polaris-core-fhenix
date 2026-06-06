// Feature: polaris-credit-bnpl, Property 10: Merchant app record round-trip
import * as fc from "fast-check";
import {
  createMerchantAppRecord,
  findMerchantAppByClientId,
  MerchantAppRecord,
} from "@/lib/credit-utils";

/**
 * **Validates: Requirements 7.2**
 *
 * Property 10: Merchant app record round-trip
 * For any valid merchant app creation input (name, category, wallet address),
 * storing the record and then retrieving it by clientId shall return a record
 * with all original fields preserved.
 */
describe("Property 10: Merchant app record round-trip", () => {
  const arbName = fc.string({ minLength: 1, maxLength: 100 });
  const arbCategory = fc.string({ minLength: 1, maxLength: 50 });
  const arbWallet = fc.hexaString({ minLength: 40, maxLength: 40 }).map((h) => `0x${h}`);

  it("creating a record and finding it by clientId preserves all original fields", () => {
    fc.assert(
      fc.property(arbName, arbCategory, arbWallet, (name, category, wallet) => {
        const record = createMerchantAppRecord(name, category, wallet);
        const store: MerchantAppRecord[] = [record];
        const found = findMerchantAppByClientId(store, record.client_id);

        expect(found).toBeDefined();
        expect(found!.name).toBe(name);
        expect(found!.category).toBe(category);
        expect(found!.wallet_address).toBe(wallet);
        expect(found!.client_id).toBeTruthy();
        expect(found!.client_secret).toBeTruthy();
        expect(found!.status).toBe("active");
      }),
      { numRuns: 100 }
    );
  });

  it("finding by a non-existent clientId returns undefined", () => {
    fc.assert(
      fc.property(arbName, arbCategory, arbWallet, (name, category, wallet) => {
        const record = createMerchantAppRecord(name, category, wallet);
        const store: MerchantAppRecord[] = [record];
        const found = findMerchantAppByClientId(store, "nonexistent_id");

        expect(found).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it("round-trip works for multiple records in the same store", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(arbName, arbCategory, arbWallet),
          { minLength: 2, maxLength: 20 }
        ),
        (inputs) => {
          const store: MerchantAppRecord[] = inputs.map(([n, c, w]) =>
            createMerchantAppRecord(n, c, w)
          );

          for (let i = 0; i < store.length; i++) {
            const found = findMerchantAppByClientId(store, store[i].client_id);
            expect(found).toBeDefined();
            expect(found!.name).toBe(inputs[i][0]);
            expect(found!.category).toBe(inputs[i][1]);
            expect(found!.wallet_address).toBe(inputs[i][2]);
            expect(found!.status).toBe("active");
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
