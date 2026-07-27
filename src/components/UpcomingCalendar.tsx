import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { Availability, CalendarEvent } from "@/arr-client";
import { upcomingDayKey } from "@/arr-client";
import { UpcomingRow } from "@/components/UpcomingRow";
import { availabilityLabel, getI18nLocale, localeToBcp47, t } from "@/i18n";
import { colors, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { IconButton, pressScaleStyle, Text, useReduceMotion } from "@/ui";

type UpcomingCalendarProps = {
  readonly events: readonly CalendarEvent[];
  readonly month: Date;
  readonly onMonthChange: (month: Date) => void;
  readonly onPressItem: (item: CalendarEvent) => void;
};

const WEEKDAY_LABELS = (): readonly string[] =>
  t("calendar.weekdays").split(",");
const MAX_CHIPS = 2;

const startOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date: Date, delta: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + delta, 1);

const toDayKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const mondayIndex = (date: Date): number => {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
};

const chipBackground = (availability: Availability): string => {
  switch (availability) {
    case "dispo":
      return colors.success;
    case "aTelecharger":
      return colors.accent;
    case "aVenir":
      return colors.surfaceRaised;
    default: {
      const _exhaustive: never = availability;
      return _exhaustive;
    }
  }
};

const chipTextColor = (availability: Availability): string => {
  switch (availability) {
    case "dispo":
      return colors.bg;
    case "aTelecharger":
      return colors.bg;
    case "aVenir":
      return colors.textMuted;
    default: {
      const _exhaustive: never = availability;
      return _exhaustive;
    }
  }
};

const chipLabel = (event: CalendarEvent): string => {
  if (event.kind === "episode" && event.subtitle) {
    return `${event.title} ${event.subtitle.split(" · ")[0] ?? ""}`.trim();
  }
  return event.title;
};

export const UpcomingCalendar = ({
  events,
  month,
  onMonthChange,
  onPressItem,
}: UpcomingCalendarProps) => {
  const { space: scaledSpace, minTouchTarget, scale } = useUiSize();
  const reduceMotion = useReduceMotion();
  const dayCellMinHeight = Math.round(84 * scale);
  const chipPaddingH = Math.max(2, Math.round(3 * scale));
  const chipPaddingV = Math.max(1, Math.round(1 * scale));
  const chipGap = Math.max(2, Math.round(2 * scale));
  const legendSwatchSize = Math.max(8, Math.round(10 * scale));
  const [selectedDay, setSelectedDay] = useState(() => toDayKey(new Date()));
  const todayKey = toDayKey(new Date());

  useEffect(() => {
    const today = new Date();
    const isCurrentMonth =
      today.getFullYear() === month.getFullYear() &&
      today.getMonth() === month.getMonth();
    setSelectedDay(
      isCurrentMonth
        ? toDayKey(today)
        : toDayKey(new Date(month.getFullYear(), month.getMonth(), 1)),
    );
  }, [month]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = upcomingDayKey(event.date);
      if (!key) continue;
      const bucket = map.get(key) ?? [];
      bucket.push(event);
      map.set(key, bucket);
    }
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const first = startOfMonth(month);
    const leading = mondayIndex(first);
    const daysInMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();
    const total = Math.ceil((leading + daysInMonth) / 7) * 7;
    return Array.from({ length: total }, (_, index) => {
      const dayNumber = index - leading + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        return { key: `empty-${index}`, dayNumber: undefined, dayKey: "" };
      }
      const date = new Date(month.getFullYear(), month.getMonth(), dayNumber);
      return {
        key: toDayKey(date),
        dayNumber,
        dayKey: toDayKey(date),
      };
    });
  }, [month]);

  const selectedItems = eventsByDay.get(selectedDay) ?? [];
  const monthLabel = month.toLocaleDateString(localeToBcp47(getI18nLocale()), {
    month: "long",
    year: "numeric",
  });
  const weekdays = WEEKDAY_LABELS();

  return (
    <View style={[styles.container, { gap: scaledSpace.md }]}>
      <View style={styles.monthHeader}>
        <IconButton
          accessibilityLabel={t("calendar.prevMonthA11y")}
          icon="‹"
          onPress={() => onMonthChange(addMonths(month, -1))}
          variant="default"
        />
        <Text role="headline" style={styles.monthLabel}>
          {monthLabel}
        </Text>
        <IconButton
          accessibilityLabel={t("calendar.nextMonthA11y")}
          icon="›"
          onPress={() => onMonthChange(addMonths(month, 1))}
          variant="default"
        />
      </View>

      <View style={styles.weekdayRow}>
        {weekdays.map((label, index) => (
          <Text
            key={`${label}-${index}`}
            role="caption"
            style={styles.weekday}
            tone="muted"
          >
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell) => {
          if (cell.dayNumber === undefined) {
            return (
              <View
                key={cell.key}
                style={[styles.dayCell, { minHeight: dayCellMinHeight }]}
              />
            );
          }
          const dayEvents = eventsByDay.get(cell.dayKey) ?? [];
          const visible = dayEvents.slice(0, MAX_CHIPS);
          const overflow = dayEvents.length - visible.length;
          const isSelected = cell.dayKey === selectedDay;
          const isToday = cell.dayKey === todayKey;
          return (
            <Pressable
              key={cell.key}
              accessibilityLabel={
                dayEvents.length > 0
                  ? t(
                      dayEvents.length === 1
                        ? "calendar.dayA11yTitles"
                        : "calendar.dayA11yTitlesPlural",
                      { day: cell.dayNumber, count: dayEvents.length },
                    )
                  : t("calendar.dayA11y", { day: cell.dayNumber })
              }
              accessibilityRole="button"
              onPress={() => setSelectedDay(cell.dayKey)}
              style={({ pressed }) => [
                styles.dayCell,
                {
                  minHeight: dayCellMinHeight,
                  paddingHorizontal: chipPaddingH,
                  paddingVertical: chipPaddingV + 1,
                },
                isToday ? styles.dayToday : null,
                isSelected ? styles.daySelected : null,
                pressScaleStyle(pressed, reduceMotion),
              ]}
            >
              <Text
                role="caption"
                style={{ marginBottom: chipGap, textAlign: "center" }}
                tone={isSelected ? "accent" : "default"}
              >
                {cell.dayNumber}
              </Text>
              <View style={[styles.chips, { gap: chipGap }]}>
                {visible.map((event) => (
                  <Pressable
                    key={`${event.kind}-${event.id}`}
                    accessibilityLabel={`${chipLabel(event)}, ${availabilityLabel(event.availability)}`}
                    accessibilityRole="button"
                    onPress={() => onPressItem(event)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: chipBackground(event.availability),
                        paddingHorizontal: chipPaddingH,
                        paddingVertical: chipPaddingV,
                      },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      role="caption"
                      style={{ color: chipTextColor(event.availability) }}
                    >
                      {chipLabel(event)}
                    </Text>
                  </Pressable>
                ))}
                {overflow > 0 ? (
                  <Text
                    role="caption"
                    style={{ marginTop: chipPaddingV }}
                    tone="muted"
                  >
                    +{overflow}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.legend, { gap: scaledSpace.md }]}>
        <View style={[styles.legendItem, { gap: scaledSpace.xs }]}>
          <View
            style={[
              styles.legendSwatch,
              {
                backgroundColor: colors.success,
                height: legendSwatchSize,
                width: legendSwatchSize,
              },
            ]}
          />
          <Text role="caption" tone="muted">
            {t("availability.dispo")}
          </Text>
        </View>
        <View style={[styles.legendItem, { gap: scaledSpace.xs }]}>
          <View
            style={[
              styles.legendSwatch,
              {
                backgroundColor: colors.accent,
                height: legendSwatchSize,
                width: legendSwatchSize,
              },
            ]}
          />
          <Text role="caption" tone="muted">
            {t("availability.aTelecharger")}
          </Text>
        </View>
        <View style={[styles.legendItem, { gap: scaledSpace.xs }]}>
          <View
            style={[
              styles.legendSwatch,
              {
                backgroundColor: colors.textMuted,
                height: legendSwatchSize,
                width: legendSwatchSize,
              },
            ]}
          />
          <Text role="caption" tone="muted">
            {t("availability.aVenir")}
          </Text>
        </View>
      </View>

      <View style={[styles.dayList, { gap: scaledSpace.sm }]}>
        {selectedItems.length === 0 ? (
          <Text
            role="body"
            style={{ paddingVertical: scaledSpace.sm }}
            tone="muted"
          >
            {t("upcoming.nothingThatDay")}
          </Text>
        ) : (
          selectedItems.map((item) => (
            <UpcomingRow
              key={`${item.kind}-${item.id}`}
              item={item}
              onPress={() => onPressItem(item)}
            />
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  monthHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  monthLabel: {
    textTransform: "capitalize",
  },
  weekdayRow: {
    flexDirection: "row",
  },
  weekday: {
    flex: 1,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
  },
  dayToday: {
    borderColor: colors.accentGlow,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  daySelected: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
  },
  chips: {},
  chip: {
    borderRadius: radii.sm,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
  },
  legendSwatch: {
    borderRadius: radii.sm,
  },
  dayList: {},
});
