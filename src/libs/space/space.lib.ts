import { space } from '@/types/space.type'
import { InvalidVersionException } from '@exceptions/InvalidVersionException'
import version from './version'

export class Space {
    static getInstallInfo(targetVersion = 'latest'): space.installInfo {
        if (targetVersion in version) {
            return version[targetVersion]
        }
        throw new InvalidVersionException()
    }
}
