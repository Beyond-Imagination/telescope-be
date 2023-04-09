import { Space } from '@/libs/space/space.lib'
import v0_5_0 from '@/libs/space/version/v0.5.0'
import v0_6_0 from '@/libs/space/version/v0.6.0'
import { InvalidVersionException } from '@exceptions/InvalidVersionException'

describe('space install version', () => {
    it('should get v0.5.0', () => {
        expect(Space.getInstallInfo('0.5.0')).toBe(v0_5_0)
    })

    it('should get v0.6.0', () => {
        expect(Space.getInstallInfo('0.6.0')).toBe(v0_6_0)
    })

    it('should get latest', () => {
        expect(Space.getInstallInfo('latest')).toBe(v0_6_0)
    })

    it('should throw error with unknown version', () => {
        expect(() => Space.getInstallInfo('1.0.0')).toThrowError(InvalidVersionException)
    })
})
