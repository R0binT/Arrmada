# Pull-to-refresh (library lists + home + queue)

## Goal

On mobile, drag down on the current screen to refresh that screen’s data only.

## Screens

| Screen | Scroll | Refresh target |
|--------|--------|----------------|
| Home | `Animated.ScrollView` | `useHomeData` + `useUpcoming` |
| Movies | `FlatList` | movies query |
| Series | `FlatList` | series query |
| Queue | `FlatList` | radarr + sonarr queue |

## Behaviour

- Native `RefreshControl`; spinner while refetching; keep existing content visible.
- Theme tint via `colors.text`.
- PTR available on populated, empty, and error scrollable states where practical.
- Out of scope: detail/add/upcoming standalone, custom web PTR.

## Approach

Native `RefreshControl` on each screen’s primary vertical scroll; extend hooks with `refetch`/`isRefetching` (home: `refetchAll`) as needed.
