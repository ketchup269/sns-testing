import { formatNumber } from '@/app/[locale]/(dashboard)/analytics/AnalyticsClient'
import { getWeekDays, statusColor, statusLabel } from '@/app/[locale]/(dashboard)/calendar/CalendarClient'
import { firstImageUrl } from '@/lib/utils'

describe('formatNumber', () => {
    test.each([
        [0, '0'],
        [500, '500'],
        [999, '999'],
        [1000, '1.0K'],
        [1500, '1.5K'],
        [10000, '10.0K'],
    ])('should correctly format %i as "%s"', (input, expected) => {
        expect(formatNumber(input)).toBe(expected)
    })
})

describe('firstImageUrl', () => {
    test.each([
        ['https://a.com/1.jpg', 'https://a.com/1.jpg'],
        ['["url1","url2"]', 'url1'],
        ['[]', '[]'],
        ['', ''],
        ['[invalid', '[invalid'],
    ])('should extract first URL from "%s" as "%s"', (input, expected) => {
        expect(firstImageUrl(input)).toBe(expected)
    })
})

describe('Calendar Helpers', () => {
    describe('getWeekDays', () => {
        beforeEach(() => {
            jest.useFakeTimers()
            // 2025-06-11 is a Wednesday
            jest.setSystemTime(new Date('2025-06-11T12:00:00Z').getTime())
        })

        afterEach(() => {
            jest.useRealTimers()
        })

        it('should return exactly 7 days starting from Monday of the current week', () => {
            const days = getWeekDays(0)
            expect(days).toHaveLength(7)
            expect(days[0].name).toBe('Monday')
            expect(days[0].fullDate.getDay()).toBe(1) // 1 = Monday
            // Jun 11 (Wed) -> Mon should be Jun 9
            expect(days[0].fullDate.getDate()).toBe(9)
        })

        it('should return next week when offset is 1', () => {
            const days = getWeekDays(1)
            expect(days[0].fullDate.getDate()).toBe(16) // 9 + 7
        })

        it('should return previous week when offset is -1', () => {
            const days = getWeekDays(-1)
            expect(days[0].fullDate.getDate()).toBe(2) // 9 - 7
        })
    })

    describe('statusColor', () => {
        test.each([
            ['PUBLISHED', 'text-green-600'],
            ['PENDING', 'text-purple-600'],
            ['FAILED', 'text-red-600'],
            ['DRAFT', 'text-orange-500'],
        ])('should return the correct color class for status "%s"', (status, expected) => {
            expect(statusColor(status)).toBe(expected)
        })
    })

    describe('statusLabel', () => {
        const mockT = (key: string) => {
            const map: any = { published: '公開済み', scheduled: '予約済み', processing: '処理中', failed: '失敗' }
            return map[key] || key
        }

        test.each([
            ['PUBLISHED', '公開済み'],
            ['PENDING', '予約済み'],
            ['PROCESSING', '処理中'],
            ['FAILED', '失敗'],
            ['OTHER', 'OTHER'],
        ])('should return the correct Japanese label for status "%s"', (status, expected) => {
            expect(statusLabel(status, mockT)).toBe(expected)
        })
    })
})
