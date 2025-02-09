import { ETHEREUM_COIN_ICON } from '../utils/constants.js'
import { ActiveAddress, ExportedSettings, Page } from '../types/exportedSettingsTypes.js'
import { Settings } from '../types/interceptor-messages.js'
import { Semaphore } from '../utils/semaphore.js'
import { EthereumAddress } from '../types/wire-types.js'
import { WebsiteAccessArray } from '../types/websiteAccessTypes.js'
import { BlockExplorer, RpcNetwork } from '../types/rpc.js'
import { browserStorageLocalGet, browserStorageLocalSafeParseGet, browserStorageLocalSet } from '../utils/storageUtils.js'
import { getUserAddressBookEntries, updateUserAddressBookEntries } from './storageVariables.js'
import { getUniqueItemsByProperties } from '../utils/typed-arrays.js'
import { AddressBookEntries, AddressBookEntry } from '../types/addressBookTypes.js'

export const defaultActiveAddresses: AddressBookEntries = [

	{
		type: 'contact' as const,
		entrySource: 'User' as const,
		name: 'conduit 2',
		address: 0x1dBC89Ef233899EeB4819f71D1007877A13163B4n,
		useAsActiveAddress: true
	}, {
		type: 'contact' as const,
		entrySource: 'User' as const,
		name: 'conduit',
		address: 0xaf4F62EBe8732A090E402335706d44d642ce130Dn,
		useAsActiveAddress: true
	},
	{
		type: 'contact' as const,
		entrySource: 'User' as const,
		name: 'anvil',
		address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266n,
		askForAddressAccess: false,
		useAsActiveAddress: true,
		chainId: 'AllChains',
	},
]

export const defaultRpcs = [
	{
		name: 'Conduit',
		chainId: 911867n,
		httpsRpc: 'https://odyssey.ithaca.xyz',
		currencyName: 'Ether',
		currencyTicker: 'ETH',
		currencyLogoUri: ETHEREUM_COIN_ICON,
		primary: true,
		minimized: true,
	},
	{
		name: 'Anvil',
		chainId: 31337n,
		httpsRpc: 'http://localhost:8545',
		currencyName: 'Ether',
		currencyTicker: 'ETH',
		currencyLogoUri: ETHEREUM_COIN_ICON,
		primary: true,
		minimized: true,
	},
	{
		name: 'Ethereum Mainnet',
		chainId: 1n,
		httpsRpc: 'https://ethereum.dark.florist',
		currencyName: 'Ether',
		currencyTicker: 'ETH',
		currencyLogoUri: ETHEREUM_COIN_ICON,
		primary: true,
		minimized: true,
	},
	{
		name: 'Sepolia',
		chainId: 11155111n,
		httpsRpc: 'https://sepolia.dark.florist',
		currencyName: 'Sepolia Testnet ETH',
		currencyTicker: 'SEETH',
		currencyLogoUri: ETHEREUM_COIN_ICON,
		primary: true,
		minimized: true,
	},
	{
		name: 'Holesky',
		chainId: 17000n,
		httpsRpc: 'https://holesky.dark.florist',
		currencyName: 'Holesky Testnet ETH',
		currencyTicker: 'HOETH',
		currencyLogoUri: ETHEREUM_COIN_ICON,
		primary: true,
		minimized: true,
	}
] as const

const wethForChainId = new Map<string, EthereumAddress>([
	['1', 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2n], // Mainnet
	['11155111', 0x105083929bf9bb22c26cb1777ec92661170d4285n], // Sepolia
	['10', 0x4200000000000000000000000000000000000006n], //OP Mainnet
	['8453', 0x4200000000000000000000000000000000000006n], // Base
	['42161', 0x82af49447d8a07e3bd95bd0d56f35241523fbab1n], // Arbitrum
])

const defaultBlockExplorer = new Map<string, { apiUrl: string, apiKey: string }>([
	['1', { apiUrl: 'https://api.etherscan.io/api', apiKey: 'PSW8C433Q667DVEX5BCRMGNAH9FSGFZ7Q8' }],
	['17000', { apiUrl: 'https://api-holesky.etherscan.io/api', apiKey: 'PSW8C433Q667DVEX5BCRMGNAH9FSGFZ7Q8' }],
	['11155111', { apiUrl: 'https://api-sepolia.etherscan.io/api', apiKey: 'PSW8C433Q667DVEX5BCRMGNAH9FSGFZ7Q8' }],
	['10', { apiUrl: 'https://api-optimistic.etherscan.io/api', apiKey: '4E726IGJ2FAU4IDHZ1TJF5HA9JZ1YKRFK9' }],
	['420', { apiUrl: 'https://api-goerli-optimistic.etherscan.io/api', apiKey: '4E726IGJ2FAU4IDHZ1TJF5HA9JZ1YKRFK9' }],
	['8453', { apiUrl: 'https://api.basescan.org/api', apiKey: 'HHH4UCPI43IYIJGP9MV16Q5REIRSDTAACA' }],
	['84532', { apiUrl: 'https://api-sepolia.basescan.org/api', apiKey: 'HHH4UCPI43IYIJGP9MV16Q5REIRSDTAACA' }],
	['42161', { apiUrl: 'https://api.arbiscan.io/api', apiKey: 'DDP8M43XJYSRBMB8RJGTJ2CW3M8K73CIY6' }],
])

export const getDefaultBlockExplorer = (chainId: bigint): BlockExplorer | undefined => defaultBlockExplorer.get(chainId.toString())

export const getWethForChainId = (chainId: bigint) => wethForChainId.get(chainId.toString())

export async function getSettings(): Promise<Settings> {
	const resultsPromise = browserStorageLocalGet([
		'activeSimulationAddress',
		'openedPageV2',
		'useSignersAddressAsActiveAddress',
		'websiteAccess',
		'simulationMode',
	])
	const activeRpcNetwork = (await browserStorageLocalSafeParseGet('activeRpcNetwork'))?.activeRpcNetwork
	const results = await resultsPromise
	if (defaultRpcs[0] === undefined || defaultActiveAddresses[0] === undefined) throw new Error('default rpc or default address was missing')
	return {
		activeSimulationAddress: 'activeSimulationAddress' in results ? results.activeSimulationAddress : defaultActiveAddresses[0].address,
		openedPage: results.openedPageV2 ?? { page: 'Home' },
		useSignersAddressAsActiveAddress: results.useSignersAddressAsActiveAddress ?? false,
		websiteAccess: results.websiteAccess ?? [],
		activeRpcNetwork: activeRpcNetwork || defaultRpcs[0],
		simulationMode: results.simulationMode ?? true,
	}
}

export function getInterceptorDisabledSites(settings: Settings): string[] {
	return settings.websiteAccess.filter((site) => site.interceptorDisabled === true).map((site) => site.website.websiteOrigin)
}

export const setPage = async (openedPageV2: Page) => await browserStorageLocalSet({ openedPageV2 })
export const getPage = async () => (await browserStorageLocalGet('openedPageV2'))?.openedPageV2 ?? { page: 'Home' }

export const setMakeMeRich = async (makeMeRich: boolean) => await browserStorageLocalSet({ makeMeRich })
export const getMakeMeRich = async () => (await browserStorageLocalGet('makeMeRich'))?.makeMeRich ?? false

export async function setUseSignersAddressAsActiveAddress(useSignersAddressAsActiveAddress: boolean, currentSignerAddress: bigint | undefined = undefined) {
	return await browserStorageLocalSet({
		useSignersAddressAsActiveAddress,
		...useSignersAddressAsActiveAddress === true ? { activeSigningAddress: currentSignerAddress } : {}
	})
}

export async function changeSimulationMode(changes: { simulationMode: boolean, rpcNetwork?: RpcNetwork, activeSimulationAddress?: EthereumAddress | undefined, activeSigningAddress?: EthereumAddress | undefined }) {
	return await browserStorageLocalSet({
		simulationMode: changes.simulationMode,
		...changes.rpcNetwork ? { activeRpcNetwork: changes.rpcNetwork } : {},
		...'activeSimulationAddress' in changes ? { activeSimulationAddress: changes.activeSimulationAddress } : {},
		...'activeSigningAddress' in changes ? { activeSigningAddress: changes.activeSigningAddress } : {},
	})
}

export const getWebsiteAccess = async () => (await browserStorageLocalGet('websiteAccess'))?.websiteAccess ?? []
const websiteAccessSemaphore = new Semaphore(1)
export async function updateWebsiteAccess(updateFunc: (prevState: WebsiteAccessArray) => WebsiteAccessArray) {
	await websiteAccessSemaphore.execute(async () => {
		return await browserStorageLocalSet({ websiteAccess: updateFunc(await getWebsiteAccess()) })
	})
}

export const getUseTabsInsteadOfPopup = async () => (await browserStorageLocalGet('useTabsInsteadOfPopup'))?.useTabsInsteadOfPopup ?? false
export const setUseTabsInsteadOfPopup = async (useTabsInsteadOfPopup: boolean) => await browserStorageLocalSet({ useTabsInsteadOfPopup })

export const getMetamaskCompatibilityMode = async () => (await browserStorageLocalGet('metamaskCompatibilityMode'))?.metamaskCompatibilityMode ?? false
export const setMetamaskCompatibilityMode = async (metamaskCompatibilityMode: boolean) => await browserStorageLocalSet({ metamaskCompatibilityMode })

export async function exportSettingsAndAddressBook(): Promise<ExportedSettings> {
	const exportDate = (new Date).toISOString().split('T')[0]
	if (exportDate === undefined) throw new Error('Datestring did not contain Date')
	const settings = await getSettings()
	return {
		name: 'InterceptorSettingsAndAddressBook' as const,
		version: '1.4' as const,
		exportedDate: exportDate,
		settings: {
			activeSimulationAddress: settings.activeSimulationAddress,
			openedPage: settings.openedPage,
			useSignersAddressAsActiveAddress: settings.useSignersAddressAsActiveAddress,
			websiteAccess: settings.websiteAccess,
			rpcNetwork: settings.activeRpcNetwork,
			simulationMode: settings.simulationMode,
			addressBookEntries: await getUserAddressBookEntries(),
			useTabsInsteadOfPopup: await getUseTabsInsteadOfPopup(),
			metamaskCompatibilityMode: await getMetamaskCompatibilityMode(),
		}
	}
}

export async function importSettingsAndAddressBook(exportedSetings: ExportedSettings) {
	if (exportedSetings.version === '1.3') {
		await setPage(exportedSetings.settings.openedPage)
	} else if (exportedSetings.version === '1.0') {
		await changeSimulationMode({
			simulationMode: exportedSetings.settings.simulationMode,
			rpcNetwork: defaultRpcs[0],
			activeSimulationAddress: exportedSetings.settings.activeSimulationAddress,
			activeSigningAddress: undefined,
		})
	} else {
		await changeSimulationMode({
			simulationMode: exportedSetings.settings.simulationMode,
			rpcNetwork: exportedSetings.settings.rpcNetwork,
			activeSimulationAddress: exportedSetings.settings.activeSimulationAddress,
			activeSigningAddress: undefined,
		})
	}
	await setUseSignersAddressAsActiveAddress(exportedSetings.settings.useSignersAddressAsActiveAddress)
	await updateWebsiteAccess(() => exportedSetings.settings.websiteAccess)
	await setUseTabsInsteadOfPopup(exportedSetings.settings.useTabsInsteadOfPopup)
	if (exportedSetings.version === '1.2') {
		await setUseTabsInsteadOfPopup(exportedSetings.settings.metamaskCompatibilityMode)
	}
	if (exportedSetings.version === '1.4') {
		await updateUserAddressBookEntries(() => exportedSetings.settings.addressBookEntries)
	} else {
		await updateUserAddressBookEntries((previousEntries) => {
			const convertActiveAddressToAddressBookEntry = (info: ActiveAddress): AddressBookEntry => ({ ...info, type: 'contact' as const, useAsActiveAddress: true, entrySource: 'User' as const })
			return getUniqueItemsByProperties(previousEntries.concat(exportedSetings.settings.addressInfos.map((x) => convertActiveAddressToAddressBookEntry(x))).concat(exportedSetings.settings.contacts ?? []), ['address'])
		})
	}
}
