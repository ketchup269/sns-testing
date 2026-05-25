import { get30DayActivityData } from '@/app/[locale]/(dashboard)/analytics/page'

describe('get30DayActivityData', () => {
    beforeEach(() => {
        jest.useFakeTimers()
        jest.setSystemTime(new Date('2025-06-15T00:00:00Z').getTime())
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('should return exactly 30 entries with count=0 and height=2 when no posts provided', () => {
        const result = get30DayActivityData([])
        expect(result).toHaveLength(30)
        expect(result.every(d => d.count === 0)).toBe(true)
        expect(result.every(d => d.height === 2)).toBe(true)
    })

    it('should count a post created today in the most recent entry', () => {
        const posts = [{ createdAt: new Date('2025-06-15T12:00:00Z'), schedules: [] }]
        const result = get30DayActivityData(posts)
        expect(result[29].count).toBe(1)
    })

    it('should ignore posts created more than 30 days ago', () => {
        const posts = [{ createdAt: new Date('2025-05-15T00:00:00Z'), schedules: [] }]
        const result = get30DayActivityData(posts)
        expect(result.every(d => d.count === 0)).toBe(true)
    })

    it('should set height to 100 for the highest activity day and others proportional', () => {
        const posts = [
            ...Array(10).fill(0).map(() => ({ createdAt: new Date('2025-06-15T12:00:00Z'), schedules: [] })),
            { createdAt: new Date('2025-06-14T12:00:00Z'), schedules: [] }
        ]
        const result = get30DayActivityData(posts)
        expect(result[29].count).toBe(10)
        expect(result[29].height).toBe(100)
        expect(result[28].count).toBe(1)
        expect(result[28].height).toBe(10)
    })

    it('should increment publishedCount when a post has a PUBLISHED schedule', () => {
        const posts = [{ createdAt: new Date('2025-06-15T12:00:00Z'), schedules: [{ status: 'PUBLISHED' }] }]
        const result = get30DayActivityData(posts)
        expect(result[29].publishedCount).toBe(1)
        expect(result[29].pubHeight).toBe(100)
    })

    it('should NOT increment publishedCount for DRAFT or PENDING posts', () => {
        const posts = [{ createdAt: new Date('2025-06-15T12:00:00Z'), schedules: [{ status: 'PENDING' }] }]
        const result = get30DayActivityData(posts)
        expect(result[29].publishedCount).toBe(0)
        expect(result[29].pubHeight).toBe(0)
    })

    it('should never return a height below 2 to maintain visual visibility', () => {
        const posts = [{ createdAt: new Date('2025-06-15T12:00:00Z'), schedules: [] }]
        const result = get30DayActivityData(posts)
        expect(result[0].height).toBe(2)
        expect(result[0].count).toBe(0)
    })

    it('should return pubHeight as 0 when there are no published posts', () => {
        const posts = [{ createdAt: new Date('2025-06-15T12:00:00Z'), schedules: [] }]
        const result = get30DayActivityData(posts)
        expect(result[29].pubHeight).toBe(0)
    })

    it('should provide labels every 6 days', () => {
        const result = get30DayActivityData([])
        const labels = result.map(d => d.label)
        // i=24, 18, 12, 6, 0 satisfy i%6 === 0
        // Loop runs i from 29 down to 0
        // result[0] is i=29
        // result[5] is i=24 (label exists)
        // result[11] is i=18 (label exists)
        // result[17] is i=12 (label exists)
        // result[23] is i=6 (label exists)
        // result[29] is i=0 (label exists)
        expect(labels[5]).not.toBe('')
        expect(labels[11]).not.toBe('')
        expect(labels[17]).not.toBe('')
        expect(labels[23]).not.toBe('')
        expect(labels[29]).not.toBe('')
        expect(labels[0]).toBe('')
    })
})
