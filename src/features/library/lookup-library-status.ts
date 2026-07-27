export type LookupLibraryBadge = "none" | "inLibrary" | "alreadyDownloaded";

export type LookupLibraryStatus = {
  readonly badge: LookupLibraryBadge;
  readonly episodeProgress:
    | { readonly have: number; readonly total: number }
    | undefined;
};

export const getMovieLookupLibraryStatus = (input: {
  readonly inLibrary: boolean;
  readonly hasFile: boolean;
}): LookupLibraryStatus => {
  if (!input.inLibrary) {
    return { badge: "none", episodeProgress: undefined };
  }
  return {
    badge: input.hasFile ? "alreadyDownloaded" : "inLibrary",
    episodeProgress: undefined,
  };
};

export const getSeriesLookupLibraryStatus = (input: {
  readonly inLibrary: boolean;
  readonly episodeFileCount: number;
  readonly episodeCount: number;
}): LookupLibraryStatus => {
  if (!input.inLibrary) {
    return { badge: "none", episodeProgress: undefined };
  }
  const isComplete =
    input.episodeCount > 0 &&
    input.episodeFileCount >= input.episodeCount;
  const showProgress =
    input.episodeFileCount !== 0 || input.episodeCount !== 0;
  return {
    badge: isComplete ? "alreadyDownloaded" : "inLibrary",
    episodeProgress: showProgress
      ? { have: input.episodeFileCount, total: input.episodeCount }
      : undefined,
  };
};
