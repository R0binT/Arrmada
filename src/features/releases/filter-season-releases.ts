import type { ReleaseOffer } from "@/arr-client";

export const isSeasonPack = (offer: ReleaseOffer): boolean =>
  offer.isFullSeason || offer.episodeId === undefined;

export const filterSeasonReleases = (
  offers: readonly ReleaseOffer[],
  seasonNumber: number,
  seriesId?: number,
): ReleaseOffer[] =>
  offers.filter((offer) => {
    if (offer.seasonNumber !== seasonNumber) return false;
    if (
      seriesId !== undefined &&
      offer.seriesId !== undefined &&
      offer.seriesId !== seriesId
    ) {
      return false;
    }
    return true;
  });

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
