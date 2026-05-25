import { parseImageUrls, serializeImageUrls, isFileItem, isUrlItem, isVideoFile, isVideoUrl, isVideoItem } from '@/app/[locale]/(dashboard)/create/types'

describe('parseImageUrls', () => {
    test.each([
        ['https://a.com/1.jpg', ['https://a.com/1.jpg']],
        ['["url1","url2"]', ['url1', 'url2']],
        ['', []],
        ['[', ['[']],
        ['[]', ['[]']],
    ])('should parse "%s" correctly', (input, expected) => {
        expect(parseImageUrls(input)).toEqual(expected)
    })
})

describe('serializeImageUrls', () => {
    test.each([
        [[], ''],
        [['url1'], 'url1'],
        [['a', 'b'], '["a","b"]'],
    ])('should serialize %p to "%s"', (input, expected) => {
        expect(serializeImageUrls(input)).toEqual(expected)
    })

    it('should maintain round-trip consistency for non-empty arrays', () => {
        const urls = ['https://a.com/1', 'https://a.com/2']
        expect(parseImageUrls(serializeImageUrls(urls))).toEqual(urls)
        
        const single = ['https://a.com/1']
        expect(parseImageUrls(serializeImageUrls(single))).toEqual(single)
    })
})

describe('Type Guards', () => {
    const mockFile = (type: string) => ({ name: 'test', type } as File)
    const fileItem = (type: string): any => ({ type: 'file', file: mockFile(type), id: '1' })
    const urlItem = (isVideo: boolean): any => ({ type: 'url', url: 'http', isVideo, id: '2' })

    it('isFileItem should identify file items correctly', () => {
        expect(isFileItem(fileItem('image/jpeg'))).toBe(true)
        expect(isFileItem(urlItem(false))).toBe(false)
    })

    it('isUrlItem should identify url items correctly', () => {
        expect(isUrlItem(urlItem(false))).toBe(true)
        expect(isUrlItem(fileItem('image/jpeg'))).toBe(false)
    })

    it('isVideoFile should return true for video files and false for others', () => {
        expect(isVideoFile(fileItem('video/mp4'))).toBe(true)
        expect(isVideoFile(fileItem('image/jpeg'))).toBe(false)
        expect(isVideoFile(urlItem(true))).toBe(false)
    })

    it('isVideoUrl should return true for video urls and false for others', () => {
        expect(isVideoUrl(urlItem(true))).toBe(true)
        expect(isVideoUrl(urlItem(false))).toBe(false)
        expect(isVideoUrl(fileItem('video/mp4'))).toBe(false)
    })

    it('isVideoItem should return true for any video item and false for images', () => {
        expect(isVideoItem(fileItem('video/mp4'))).toBe(true)
        expect(isVideoItem(urlItem(true))).toBe(true)
        expect(isVideoItem(fileItem('image/jpeg'))).toBe(false)
        expect(isVideoItem(urlItem(false))).toBe(false)
    })
})
