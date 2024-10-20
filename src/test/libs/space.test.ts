import { Space } from '@/libs/space/space.lib'
import v0_5_0 from '@/libs/space/version/v0.5.0'
import v0_6_0 from '@/libs/space/version/v0.6.0'
import v0_7_0 from '@/libs/space/version/v0.7.0'
import v0_8_0 from '@/libs/space/version/v0.8.0'
import v1_1_0 from '@/libs/space/version/v1.1.0'
import v1_3_0 from '@/libs/space/version/v1.3.0'
import v1_4_0 from '@/libs/space/version/v1.4.0'
import v1_5_0 from '@/libs/space/version/v1.5.0'
import v1_6_0 from '@/libs/space/version/v1.6.0'
import v1_7_0 from '@/libs/space/version/v1.7.0'
import { InvalidVersionException } from '@exceptions/InvalidVersionException'

describe('space install version', () => {
    it('should get v0.5.0', () => {
        expect(Space.getInstallInfo('0.5.0')).toBe(v0_5_0)
    })

    it('should get v0.6.0', () => {
        expect(Space.getInstallInfo('0.6.0')).toBe(v0_6_0)
    })

    it('should get v0.7.0', () => {
        expect(Space.getInstallInfo('0.7.0')).toBe(v0_7_0)
    })

    it('should get v0.8.0', () => {
        expect(Space.getInstallInfo('0.8.0')).toBe(v0_8_0)
    })

    it('should get v1.1.0', () => {
        expect(Space.getInstallInfo('1.1.0')).toBe(v1_1_0)
    })

    it('should get v1.3.0', () => {
        expect(Space.getInstallInfo('1.3.0')).toBe(v1_3_0)
    })

    it('should get v1.4.0', () => {
        expect(Space.getInstallInfo('1.4.0')).toBe(v1_4_0)
    })

    it('should get v1.5.0', () => {
        expect(Space.getInstallInfo('1.5.0')).toBe(v1_5_0)
    })

    it('should get v1.6.0', () => {
        expect(Space.getInstallInfo('1.6.0')).toBe(v1_6_0)
    })

    it('should get v1.7.0', () => {
        expect(Space.getInstallInfo('1.7.0')).toBe(v1_7_0)
    })

    it('should get latest', () => {
        expect(Space.getInstallInfo('latest')).toBe(v1_7_0)
    })

    it('should throw error with unknown version', () => {
        expect(() => Space.getInstallInfo('1.0.0')).toThrowError(InvalidVersionException)
    })
})
