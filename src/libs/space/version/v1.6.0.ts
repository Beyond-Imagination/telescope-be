import { space } from '@/types/space.type'
import v1_5_0 from '@/libs/space/version/v1.5.0'

const data: space.installInfo = {
    version: '1.6.0',
    webhooks: v1_5_0.webhooks,
    uiExtension: {
        contextIdentifier: v1_5_0.uiExtension.contextIdentifier,
        extension: v1_5_0.uiExtension.extension,
        startedUiExtension: {
            className: 'GettingStartedUiExtensionIn',
            gettingStartedUrl: '/extensions/installedApplications/{applicationName}/homepage',
            gettingStartedTitle: 'go to Telescope',
        },
    },
    right: v1_5_0.right,
}

export default data
