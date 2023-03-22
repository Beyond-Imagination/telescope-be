import { Space } from '@/libs/space/space.lib'
import v0_5_0 from '@/libs/space/version/v0.5.0'
import { InvalidVersionException } from '@exceptions/InvalidVersionException'

describe('space install version', () => {
    const space = new Space()

    it('should get v0.5.0', () => {
        expect(space.getInstallInfo('v0.5.0')).toBe(v0_5_0)
    })

    it('should get latest', () => {
        expect(space.getInstallInfo('latest')).toBe(v0_5_0)
    })

    it('should throw error with unknown version', () => {
        expect(() => space.getInstallInfo('v1.0.0')).toThrowError(InvalidVersionException)
    })
})
