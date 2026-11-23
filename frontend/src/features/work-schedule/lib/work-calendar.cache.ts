import type { QueryClient } from '@tanstack/react-query'
import { calendarExceptionQueryKeys, calendarPreviewQueryKeys, workScheduleQueryKeys } from './work-calendar.query-keys'

export function invalidateCalendarVersion(client: QueryClient, versionId: string) {
  return Promise.all([
    client.invalidateQueries({ queryKey: calendarExceptionQueryKeys.versionLists(versionId) }),
    client.invalidateQueries({ queryKey: calendarExceptionQueryKeys.versionDetails(versionId) }),
    client.invalidateQueries({ queryKey: calendarPreviewQueryKeys.versionPreviews(versionId) }),
  ])
}

export function invalidateCalendarMutation(client: QueryClient, versionId: string) {
  return Promise.all([
    invalidateCalendarVersion(client, versionId),
    client.invalidateQueries({ queryKey: workScheduleQueryKeys.detail(versionId) }),
    client.invalidateQueries({ queryKey: workScheduleQueryKeys.lists() }),
  ])
}
