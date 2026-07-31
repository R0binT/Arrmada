import type { ReleaseOffer } from "@/arr-client";

export const isSeasonPack = (offer: ReleaseOffer): boolean =>
  offer.episodeId === undefined;

export const filterSeasonReleases = (
  offers: readonly ReleaseOffer[],
  seasonNumber: number,
): ReleaseOffer[] =>
  offers.filter((offer) => offer.seasonNumber === seasonNumber);

export const sortReleaseOffers = (
  offers: readonly ReleaseOffer[],
): ReleaseOffer[] =>
  [...offers].sort((left, right) => {
    const packDelta =
      Number(isSeasonPack(right)) - Number(isSeasonPack(left));
    if (packDelta !== 0) return packDelta;
    const quality = right.qualityWeight - left.qualityWeight;
    if (quality !== 0) return quality;
    const seeders = (right.seeders ?? 0) - (left.seeders ?? 0);
    if (seeders !== 0) return seeders;
    return right.size - left.size;
  });
