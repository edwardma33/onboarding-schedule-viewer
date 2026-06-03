import {
  onboardingSchedule,
  type ScheduleItem,
} from "@/data/onboarding-schedule"

export function App() {
  const schedule: ScheduleItem[] = onboardingSchedule

  return (
    <div className="w-screen h-screen" data-schedule-count={schedule.length}></div>
  )
}

export default App
