import { useEffect, useMemo, useRef, useState } from "react"
import {
  CalendarDays,
  Clock,
  Hourglass,
  Moon,
  Sun,
  Timer,
  UserRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "@/components/theme-provider"
import {
  onboardingSchedule,
  type ScheduleItem,
} from "@/data/onboarding-schedule"

type TimedScheduleItem = ScheduleItem & {
  startsAt: Date
  endsAt: Date
}

const ONBOARDING_YEAR = 2026

const monthLookup: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
}

function parseDateLabel(dateLabel: string) {
  const match = dateLabel.match(/^([A-Za-z]+)\s+(\d+)/)

  if (!match) {
    return null
  }

  const month = monthLookup[match[1].toLowerCase()]
  const day = Number(match[2])

  if (month === undefined || Number.isNaN(day)) {
    return null
  }

  return { month, day }
}

function parseStartTime(startTime: string) {
  const match = startTime.trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i)

  if (!match) {
    return null
  }

  const minute = Number(match[2])
  const period = match[3].toUpperCase()
  let hour = Number(match[1])

  if (period === "PM" && hour !== 12) {
    hour += 12
  }

  if (period === "AM" && hour === 12) {
    hour = 0
  }

  return { hour, minute }
}

function toTimedScheduleItem(item: ScheduleItem): TimedScheduleItem | null {
  if (!item.startTime || item.durationHours === null) {
    return null
  }

  const date = parseDateLabel(item.day.date)
  const time = parseStartTime(item.startTime)

  if (!date || !time) {
    return null
  }

  const startsAt = new Date(
    ONBOARDING_YEAR,
    date.month,
    date.day,
    time.hour,
    time.minute
  )
  const endsAt = new Date(startsAt.getTime() + item.durationHours * 60 * 60_000)

  return {
    ...item,
    startsAt,
    endsAt,
  }
}

function getScheduleDayStart(item: ScheduleItem) {
  const date = parseDateLabel(item.day.date)

  if (!date) {
    return null
  }

  return new Date(ONBOARDING_YEAR, date.month, date.day)
}

function getTodayStart(now: Date) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function formatDuration(milliseconds: number) {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60_000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes}m`
  }

  if (minutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${minutes}m`
}

function formatClock(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function getCurrentAndNext(items: TimedScheduleItem[], now: Date) {
  const current =
    items.find((item) => item.startsAt <= now && now < item.endsAt) ?? null
  const next = items.find((item) => item.startsAt > now) ?? null

  return { current, next }
}

function getFacilitatorLabel(facilitator: string | null) {
  return facilitator ?? "No facilitator"
}

function getDurationLabel(durationHours: number | null) {
  if (durationHours === null) {
    return "Duration TBD"
  }

  return `${formatDuration(durationHours * 60 * 60_000)} block`
}

function isPastItem(item: ScheduleItem, now: Date) {
  const timedItem = toTimedScheduleItem(item)

  if (timedItem) {
    return timedItem.endsAt < now
  }

  const dayStart = getScheduleDayStart(item)

  if (!dayStart) {
    return false
  }

  return dayStart < getTodayStart(now)
}

function DashboardCard({
  label,
  item,
  metric,
  emptyLabel,
}: {
  label: string
  item: TimedScheduleItem | null
  metric: string
  emptyLabel: string
}) {
  return (
    <Card
      size="sm"
      className="gap-2 border border-border/70 bg-card/95 py-3 shadow-sm backdrop-blur sm:gap-4 sm:py-4"
    >
      <CardHeader className="gap-1 px-3 sm:gap-2 sm:px-4">
        <CardDescription className="flex items-center gap-1.5 text-[0.65rem] font-medium tracking-wider uppercase sm:gap-2 sm:text-xs">
          <Timer className="size-3.5" />
          {label}
        </CardDescription>
        <CardTitle className="line-clamp-1 text-sm sm:text-lg">
          {item ? item.agendaItem : emptyLabel}
        </CardTitle>
        {item ? (
          <CardAction>
            <Badge variant="secondary" className="text-[0.65rem] sm:text-xs">
              {metric}
            </Badge>
          </CardAction>
        ) : null}
      </CardHeader>
      {item ? (
        <CardContent className="hidden flex-wrap gap-2 px-3 text-sm text-muted-foreground sm:flex sm:px-4">
          <Badge variant="outline" className="gap-1.5">
            <Clock className="size-3" />
            {formatClock(item.startsAt)} - {formatClock(item.endsAt)}
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <CalendarDays className="size-3" />
            Day {item.day.number} · {item.day.date}
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <UserRound className="size-3" />
            {getFacilitatorLabel(item.facilitator)}
          </Badge>
        </CardContent>
      ) : (
        <CardContent className="hidden px-3 text-sm text-muted-foreground sm:block sm:px-4">
          The timed schedule has no matching item for this state.
        </CardContent>
      )}
    </Card>
  )
}

function ScheduleCard({
  item,
  isPast,
}: {
  item: ScheduleItem
  isPast: boolean
}) {
  return (
    <Card
      size="sm"
      className={
        isPast
          ? "border border-border/50 bg-muted/35 text-muted-foreground opacity-60 shadow-none"
          : "border border-border/70 shadow-none"
      }
    >
      <CardHeader>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <Badge variant={item.startTime ? "default" : "secondary"}>
            {item.startTime ?? "Untimed"}
          </Badge>
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="size-3.5" />
            {getFacilitatorLabel(item.facilitator)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Hourglass className="size-3.5" />
            {getDurationLabel(item.durationHours)}
          </span>
        </CardDescription>
        <CardTitle>{item.agendaItem}</CardTitle>
      </CardHeader>
      {item.instructions ? (
        <CardContent className="text-sm leading-6 text-muted-foreground">
          {item.instructions}
        </CardContent>
      ) : null}
    </Card>
  )
}

export function App() {
  const schedule: ScheduleItem[] = onboardingSchedule
  const { resolvedTheme, setTheme } = useTheme()
  const [now, setNow] = useState(() => new Date())
  const [activeWeek, setActiveWeek] = useState("week-1")
  const [showPastItems, setShowPastItems] = useState(false)
  const initialScrollTargetRef = useRef<HTMLDivElement | null>(null)
  const hasScrolledToCurrentRef = useRef(false)

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 30_000)

    return () => window.clearInterval(intervalId)
  }, [])

  const timedSchedule = useMemo(
    () =>
      schedule
        .map(toTimedScheduleItem)
        .filter((item): item is TimedScheduleItem => item !== null)
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
    [schedule]
  )

  const weeks = useMemo(
    () =>
      [...new Set(schedule.map((item) => item.week))].sort(
        (first, second) => first - second
      ),
    [schedule]
  )

  const { current, next } = getCurrentAndNext(timedSchedule, now)
  const initialScrollTarget = current ?? next

  useEffect(() => {
    if (!initialScrollTarget || hasScrolledToCurrentRef.current) {
      return
    }

    setActiveWeek(`week-${initialScrollTarget.week}`)
  }, [initialScrollTarget])

  useEffect(() => {
    if (!initialScrollTarget || hasScrolledToCurrentRef.current) {
      return
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      initialScrollTargetRef.current?.scrollIntoView({
        block: "start",
        behavior: "smooth",
      })
      hasScrolledToCurrentRef.current = true
    })

    return () => window.cancelAnimationFrame(animationFrameId)
  }, [activeWeek, initialScrollTarget])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-4 pb-36 sm:px-6 sm:pb-72 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              ParMed Onboarding Schedule
            </h1>
          </div>
          <Label
            htmlFor="theme-mode"
            className="w-fit rounded-2xl border bg-card px-3 py-2 text-sm"
          >
            <Sun className="size-4" />
            <Switch
              id="theme-mode"
              size="sm"
              checked={resolvedTheme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
            />
            <Moon className="size-4" />
          </Label>
        </div>

        <Alert variant={"destructive"}>
          <AlertTitle>Schedule disclaimer</AlertTitle>
          <AlertDescription>
            This application reflects the original onboarding schedule and does
            not show schedule changes.
          </AlertDescription>
        </Alert>

        <Tabs
          value={activeWeek}
          onValueChange={setActiveWeek}
          className="gap-5"
        >
          <div className="sticky top-0 z-20 -mx-4 border-b bg-background/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <Label
                  htmlFor="show-past-items"
                  className="rounded-2xl border bg-card px-3 py-2 text-sm"
                >
                  <Switch
                    id="show-past-items"
                    size="sm"
                    checked={showPastItems}
                    onCheckedChange={setShowPastItems}
                  />
                  Show past
                </Label>
                <TabsList>
                  {weeks.map((week) => (
                    <TabsTrigger key={week} value={`week-${week}`}>
                      Week {week}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </div>
          </div>

          {weeks.map((week) => {
            const weekItems = schedule.filter((item) => item.week === week)
            const days = [...new Set(weekItems.map((item) => item.day.number))]

            return (
              <TabsContent key={week} value={`week-${week}`}>
                <div className="grid gap-6">
                  {days.map((dayNumber) => {
                    const allDayItems = weekItems.filter(
                      (item) => item.day.number === dayNumber
                    )
                    const dayItems = showPastItems
                      ? allDayItems
                      : allDayItems.filter((item) => !isPastItem(item, now))
                    const day = allDayItems[0]?.day

                    if (dayItems.length === 0) {
                      return null
                    }

                    return (
                      <section key={dayNumber} className="grid gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge variant="secondary">Day {dayNumber}</Badge>
                          <h3 className="text-xl font-semibold">{day?.date}</h3>
                          <Separator className="min-w-10 flex-1" />
                        </div>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {dayItems.map((item, index) => (
                            <div
                              key={`${item.week}-${item.day.number}-${item.startTime ?? "untimed"}-${index}`}
                              ref={
                                item === initialScrollTarget
                                  ? initialScrollTargetRef
                                  : undefined
                              }
                              className="scroll-mt-32"
                            >
                              <ScheduleCard
                                item={item}
                                isPast={isPastItem(item, now)}
                              />
                            </div>
                          ))}
                        </div>
                      </section>
                    )
                  })}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </div>

      <section className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-3 py-2 shadow-[0_-12px_40px_rgb(0_0_0/0.08)] backdrop-blur-xl sm:px-6 sm:py-4 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-2 sm:gap-3 lg:grid-cols-2">
          <DashboardCard
            label="Current"
            item={current}
            metric={
              current
                ? `${formatDuration(current.endsAt.getTime() - now.getTime())} remaining`
                : ""
            }
            emptyLabel="No active session"
          />
          <DashboardCard
            label="Next"
            item={next}
            metric={
              next
                ? `Starts in ${formatDuration(next.startsAt.getTime() - now.getTime())}`
                : ""
            }
            emptyLabel="Schedule complete"
          />
        </div>
      </section>
    </main>
  )
}

export default App
