/**
 * One page of Add-search candidates after TMDB fetch + Arr enrichment.
 */
export type LookupCandidatesPage<T> = {
  readonly items: readonly T[];
  readonly page: number;
  readonly totalPages: number;
  readonly hasMore: boolean;
};

export const lookupCandidatesPage = <T>(input: {
  readonly items: readonly T[];
  readonly page: number;
  readonly totalPages: number;
}): LookupCandidatesPage<T> => ({
  items: input.items,
  page: input.page,
  totalPages: input.totalPages,
  hasMore: input.page < input.totalPages,
});
