import { Signal, useSignal } from '@preact/signals'
import { ethers } from 'ethers'
import { useEffect, useState } from 'preact/hooks'
import { sendPopupMessageToBackgroundPage } from '../background/backgroundUtils.js'
import { noNewBlockForOverTwoMins } from '../background/iconHandler.js'
import { defaultActiveAddresses } from '../background/settings.js'
import { AddressBookEntries, AddressBookEntry } from '../types/addressBookTypes.js'
import { MessageToPopup, Settings, UnexpectedErrorOccured, UpdateHomePage } from '../types/interceptor-messages.js'
import { VisualizedPersonalSignRequest } from '../types/personal-message-definitions.js'
import { RpcEntries, RpcEntry, RpcNetwork } from '../types/rpc.js'
import { RpcConnectionStatus, TabIconDetails, TabState } from '../types/user-interface-types.js'
import { ModifyAddressWindowState, NamedTokenId, SimulatedAndVisualizedTransaction, SimulationAndVisualisationResults, SimulationResultState, SimulationState, SimulationUpdatingState } from '../types/visualizer-types.js'
import { EthereumAddress } from '../types/wire-types.js'
import { checksummedAddress } from '../utils/bigint.js'
import { DEFAULT_TAB_CONNECTION, METAMASK_ERROR_ALREADY_PENDING, METAMASK_ERROR_USER_REJECTED_REQUEST, TIME_BETWEEN_BLOCKS } from '../utils/constants.js'
import { truncateAddr } from '../utils/ethereum.js'
import { AddNewAddress } from './pages/AddNewAddress.js'
import { ChangeActiveAddress } from './pages/ChangeActiveAddress.js'
import { Home } from './pages/Home.js'
import { ErrorComponent, UnexpectedError } from './subcomponents/Error.js'
import Hint from './subcomponents/Hint.js'
import { PasteCatcher } from './subcomponents/PasteCatcher.js'
import { SignersLogoName } from './subcomponents/signers.js'
import { SomeTimeAgo } from './subcomponents/SomeTimeAgo.js'
import { humanReadableDate } from './ui-utils.js'

type ProviderErrorsParam = {
	tabState: TabState | undefined
}

function ProviderErrors({ tabState }: ProviderErrorsParam) {
	if (tabState === undefined || tabState.signerAccountError === undefined) return <></>
	if (tabState.signerAccountError.code === METAMASK_ERROR_USER_REJECTED_REQUEST) return <ErrorComponent warning={true} text={<>Could not get an account from <SignersLogoName signerName={tabState.signerName} /> as user denied the request.</>} />
	if (tabState.signerAccountError.code === METAMASK_ERROR_ALREADY_PENDING.error.code) return <ErrorComponent warning={true} text={<>There's a connection request pending on <SignersLogoName signerName={tabState.signerName} />. Please review the request.</>} />
	return <ErrorComponent warning={true} text={<><SignersLogoName signerName={tabState.signerName} /> returned error: "{tabState.signerAccountError.message}".</>} />
}

type NetworkErrorParams = {
	rpcConnectionStatus: Signal<RpcConnectionStatus>
}

export function NetworkErrors({ rpcConnectionStatus }: NetworkErrorParams) {
	if (rpcConnectionStatus.value === undefined) return <></>
	const nextConnectionAttempt = new Date(rpcConnectionStatus.value.lastConnnectionAttempt.getTime() + TIME_BETWEEN_BLOCKS * 1000)
	if (rpcConnectionStatus.value.retrying === false) return <></>
	return <>
		{rpcConnectionStatus.value.isConnected === false ?
			<ErrorComponent warning={true} text={
				<>Unable to connect to {rpcConnectionStatus.value.rpcNetwork.name}. Retrying in <SomeTimeAgo priorTimestamp={nextConnectionAttempt} countBackwards={true} /> .</>
			} />
			: <></>}
		{rpcConnectionStatus.value.latestBlock !== undefined && noNewBlockForOverTwoMins(rpcConnectionStatus.value) && rpcConnectionStatus.value.latestBlock !== null ?
			<ErrorComponent warning={true} text={
				<>The connected RPC ({rpcConnectionStatus.value.rpcNetwork.name}) seem to be stuck at block {rpcConnectionStatus.value.latestBlock.number} (occured on: {humanReadableDate(rpcConnectionStatus.value.latestBlock.timestamp)}). Retrying in <SomeTimeAgo priorTimestamp={nextConnectionAttempt} countBackwards={true} />.</>
			} />
			: <></>}
	</>
}

type Page = { page: 'Home' | 'ChangeActiveAddress' | 'AccessList' | 'Settings' | 'Unknown' }
	| { page: 'ModifyAddress' | 'AddNewAddress', state: Signal<ModifyAddressWindowState> }
	| { page: 'ChangeActiveAddress' }

export function App() {
	const appPage = useSignal<Page>({ page: 'Unknown' })
	const [activeAddresses, setActiveAddresses] = useState<AddressBookEntries>(defaultActiveAddresses)
	const [activeSimulationAddress, setActiveSimulationAddress] = useState<bigint | undefined>(undefined)
	const [activeSigningAddress, setActiveSigningAddress] = useState<bigint | undefined>(undefined)
	const [useSignersAddressAsActiveAddress, setUseSignersAddressAsActiveAddress] = useState(false)
	const [simVisResults, setSimVisResults] = useState<SimulationAndVisualisationResults | undefined>(undefined)
	const rpcNetwork = useSignal<RpcNetwork | undefined>(undefined)
	const simulationMode = false
	const [tabIconDetails, setTabConnection] = useState<TabIconDetails>(DEFAULT_TAB_CONNECTION)
	const [isSettingsLoaded, setIsSettingsLoaded] = useState<boolean>(false)
	const [currentBlockNumber, setCurrentBlockNumber] = useState<bigint | undefined>(undefined)
	const [tabState, setTabState] = useState<TabState | undefined>(undefined)
	const rpcConnectionStatus = useSignal<RpcConnectionStatus>(undefined)
	const [currentTabId, setCurrentTabId] = useState<number | undefined>(undefined)
	const rpcEntries = useSignal<RpcEntries>([])
	const [simulationUpdatingState, setSimulationUpdatingState] = useState<SimulationUpdatingState | undefined>(undefined)
	const [simulationResultState, setSimulationResultState] = useState<SimulationResultState | undefined>(undefined)
	const [unexpectedError, setUnexpectedError] = useState<UnexpectedErrorOccured | undefined>(undefined)

	async function setActiveAddressAndInformAboutIt(address: bigint | 'signer') {
		setUseSignersAddressAsActiveAddress(address === 'signer')
		if (address === 'signer') {
			sendPopupMessageToBackgroundPage({ method: 'popup_changeActiveAddress', data: { activeAddress: 'signer', simulationMode: simulationMode } })
			if (simulationMode) {
				return setActiveSimulationAddress(tabState && tabState.signerAccounts.length > 0 ? tabState.signerAccounts[0] : undefined)
			}
			return setActiveSigningAddress(tabState && tabState.signerAccounts.length > 0 ? tabState.signerAccounts[0] : undefined)
		}
		sendPopupMessageToBackgroundPage({ method: 'popup_changeActiveAddress', data: { activeAddress: address, simulationMode: simulationMode } })
		if (simulationMode) {
			return setActiveSimulationAddress(address)
		}
		return setActiveSigningAddress(address)
	}

	function isSignerConnected() {
		return tabState !== undefined && tabState.signerAccounts.length > 0
			&& (
				simulationMode && activeSimulationAddress !== undefined && tabState.signerAccounts[0] === activeSimulationAddress
				|| !simulationMode && activeSigningAddress !== undefined && tabState.signerAccounts[0] === activeSigningAddress
			)
	}

	async function setActiveRpcAndInformAboutIt(entry: RpcEntry) {
		sendPopupMessageToBackgroundPage({ method: 'popup_changeActiveRpc', data: entry })
		if (!isSignerConnected()) {
			rpcNetwork.value = entry
		}
	}

	useEffect(() => {
		const setSimulationState = (
			simState: SimulationState | undefined,
			addressBookEntries: AddressBookEntries,
			simulatedAndVisualizedTransactions: readonly SimulatedAndVisualizedTransaction[],
			personalSignRequests: readonly VisualizedPersonalSignRequest[],
			activeSimulationAddress: EthereumAddress | undefined,
			namedTokenIds: readonly NamedTokenId[],
		) => {
			if (activeSimulationAddress === undefined) return setSimVisResults(undefined)
			if (simState === undefined) return setSimVisResults(undefined)
			setSimVisResults({
				blockNumber: simState.blockNumber,
				blockTimestamp: simState.blockTimestamp,
				simulationConductedTimestamp: simState.simulationConductedTimestamp,
				simulatedAndVisualizedTransactions,
				visualizedPersonalSignRequests: personalSignRequests,
				rpcNetwork: simState.rpcNetwork,
				activeAddress: activeSimulationAddress,
				addressBookEntries: addressBookEntries,
				namedTokenIds,
			})
		}

		const updateHomePage = ({ data }: UpdateHomePage) => {
			if (data.tabId !== currentTabId && currentTabId !== undefined) return
			setIsSettingsLoaded((isSettingsLoaded) => {
				rpcEntries.value = data.rpcEntries
				setActiveAddresses(data.activeAddresses)
				setCurrentTabId(data.tabId)
				setActiveSigningAddress(data.activeSigningAddressInThisTab)
				updateHomePageSettings(data.settings, !isSettingsLoaded)
				setUnexpectedError(data.latestUnexpectedError)
				if (isSettingsLoaded === false) setTabConnection(data.tabState.tabIconDetails)
				if (data.visualizedSimulatorState !== undefined) {
					setSimulationState(
						data.visualizedSimulatorState.simulationState,
						data.visualizedSimulatorState.addressBookEntries,
						data.visualizedSimulatorState.simulatedAndVisualizedTransactions,
						data.visualizedSimulatorState.visualizedPersonalSignRequests,
						data.visualizedSimulatorState.activeAddress,
						data.visualizedSimulatorState.namedTokenIds,
					)
					setSimulationUpdatingState(data.visualizedSimulatorState.simulationUpdatingState)
					setSimulationResultState(data.visualizedSimulatorState.simulationResultState)
				}
				setTabState(data.tabState)
				setCurrentBlockNumber(data.currentBlockNumber)
				rpcConnectionStatus.value = data.rpcConnectionStatus
				return true
			})
		}
		const updateHomePageSettings = (settings: Settings, updateQuery: boolean) => {
			if (updateQuery && appPage.value.page === 'Unknown') {
				if (settings.openedPage.page === 'AddNewAddress' || settings.openedPage.page === 'ModifyAddress') {
					appPage.value = { ...settings.openedPage, state: new Signal(settings.openedPage.state) }
				}
			}
			rpcNetwork.value = settings.activeRpcNetwork
			setActiveSimulationAddress(settings.activeSimulationAddress)
			setUseSignersAddressAsActiveAddress(settings.useSignersAddressAsActiveAddress)
		}

		const popupMessageListener = (msg: unknown) => {
			const maybeParsed = MessageToPopup.safeParse(msg)
			if (!maybeParsed.success) return // not a message we are interested in
			const parsed = maybeParsed.value
			switch (parsed.method) {
				case 'popup_UnexpectedErrorOccured': return setUnexpectedError(parsed)
				case 'popup_settingsUpdated': return updateHomePageSettings(parsed.data, true)
				case 'popup_activeSigningAddressChanged': {
					if (parsed.data.tabId !== currentTabId) return
					return setActiveSigningAddress(parsed.data.activeSigningAddress)
				}
				case 'popup_websiteIconChanged': return setTabConnection(parsed.data)
				case 'popup_new_block_arrived': {
					sendPopupMessageToBackgroundPage({ method: 'popup_refreshHomeData' })
					rpcConnectionStatus.value = parsed.data.rpcConnectionStatus
					return
				}
				case 'popup_failed_to_get_block': {
					rpcConnectionStatus.value = parsed.data.rpcConnectionStatus
					return
				}
				case 'popup_update_rpc_list': return
				case 'popup_simulation_state_changed': return sendPopupMessageToBackgroundPage({ method: 'popup_refreshHomeData' })
			}
			if (parsed.method !== 'popup_UpdateHomePage') return sendPopupMessageToBackgroundPage({ method: 'popup_requestNewHomeData' })
			return updateHomePage(UpdateHomePage.parse(parsed))
		}
		browser.runtime.onMessage.addListener(popupMessageListener)
		return () => browser.runtime.onMessage.removeListener(popupMessageListener)
	})

	useEffect(() => { sendPopupMessageToBackgroundPage({ method: 'popup_refreshHomeData' }) }, [])

	function goHome() {
		const newPage = { page: 'Home' } as const
		appPage.value = newPage
		sendPopupMessageToBackgroundPage({ method: 'popup_changePage', data: newPage })
	}

	function changeActiveAddress() {
		const newPage = { page: 'ChangeActiveAddress' } as const
		appPage.value = newPage
		sendPopupMessageToBackgroundPage({ method: 'popup_changePage', data: newPage })
	}

	async function addressPaste(address: string) {
		if (appPage.value !== undefined && appPage.value.page === 'AddNewAddress') return

		const trimmed = address.trim()
		if (!ethers.isAddress(trimmed)) return

		const bigIntReprentation = BigInt(trimmed)
		// see if we have that address, if so, let's switch to it
		for (const activeAddress of activeAddresses) {
			if (activeAddress.address === bigIntReprentation) return await setActiveAddressAndInformAboutIt(activeAddress.address)
		}

		// address not found, let's promt user to create it
		const addressString = ethers.getAddress(trimmed)
		const newPage = {
			page: 'AddNewAddress', state: {
				windowStateId: 'appAddressPaste',
				errorState: undefined,
				incompleteAddressBookEntry: {
					addingAddress: true,
					symbol: undefined,
					decimals: undefined,
					logoUri: undefined,
					type: 'contact',
					name: `Pasted ${truncateAddr(addressString)}`,
					address: checksummedAddress(bigIntReprentation),
					askForAddressAccess: true,
					entrySource: 'FilledIn',
					abi: undefined,
					useAsActiveAddress: true,
					declarativeNetRequestBlockMode: undefined,
					chainId: rpcConnectionStatus.peek()?.rpcNetwork.chainId || 1n,
				}
			}
		} as const
		appPage.value = { page: 'AddNewAddress', state: new Signal(newPage.state) }
		sendPopupMessageToBackgroundPage({ method: 'popup_changePage', data: newPage })
	}

	function renameAddressCallBack(entry: AddressBookEntry) {
		const newPage = {
			page: 'ModifyAddress', state: {
				windowStateId: 'appRename',
				errorState: undefined,
				incompleteAddressBookEntry: {
					addingAddress: false,
					askForAddressAccess: true,
					symbol: undefined,
					decimals: undefined,
					logoUri: undefined,
					abi: undefined,
					useAsActiveAddress: false,
					declarativeNetRequestBlockMode: undefined,
					chainId: entry.chainId || 1n,
					...entry,
					address: checksummedAddress(entry.address),
				}
			}
		} as const
		appPage.value = { page: 'ModifyAddress', state: new Signal(newPage.state) }
		sendPopupMessageToBackgroundPage({ method: 'popup_changePage', data: newPage })
	}

	function addNewAddress() {
		const newPage = {
			page: 'AddNewAddress', state: {
				windowStateId: 'appNewAddress',
				errorState: undefined,
				incompleteAddressBookEntry: {
					addingAddress: true,
					symbol: undefined,
					decimals: undefined,
					logoUri: undefined,
					type: 'contact',
					name: undefined,
					address: undefined,
					askForAddressAccess: true,
					entrySource: 'FilledIn',
					abi: undefined,
					useAsActiveAddress: true,
					declarativeNetRequestBlockMode: undefined,
					chainId: rpcConnectionStatus.peek()?.rpcNetwork.chainId || 1n,
				}
			}
		} as const
		appPage.value = { page: 'AddNewAddress', state: new Signal(newPage.state) }
		sendPopupMessageToBackgroundPage({ method: 'popup_changePage', data: newPage })
	}

	async function openAddressBook() {
		await sendPopupMessageToBackgroundPage({ method: 'popup_openAddressBook' })
		return globalThis.close() // close extension popup, chrome closes it by default, but firefox does not
	}

	async function clearUnexpectedError() {
		setUnexpectedError(undefined)
		await sendPopupMessageToBackgroundPage({ method: 'popup_clearUnexpectedError' })
	}

	return (
		<main>
			<Hint>
				<PasteCatcher enabled={appPage.value.page === 'Unknown' || appPage.value.page === 'Home'} onPaste={addressPaste} />
				<div style={`background-color: var(--bg-color); width: 520px; height: 600px; ${appPage.value.page !== 'Unknown' && appPage.value.page !== 'Home' ? 'overflow: hidden;' : 'overflow-y: auto; overflow-x: hidden'}`}>
					{!isSettingsLoaded ? <></> : <>
						<nav class='navbar window-header' role='navigation' aria-label='main navigation'>
							<div class='navbar-brand'>
								<a class='navbar-item' style='cursor: unset'>
									<img src='../img/head.png' width='32' />
									<p class="has-text-weight-bold" style='color: #000000; padding-left: 5px;'>PhisGuard</p>
								</a>
								<a class='navbar-item' style='margin-left: auto; margin-right: 0;'>
									<span class="icon" onClick = { openAddressBook }>
										<i class="fa-regular fa-address-book" style="color: black"/>	
									</span>
								</a>
							</div>
						</nav>

						<UnexpectedError close={clearUnexpectedError} unexpectedError={unexpectedError} />
						<NetworkErrors rpcConnectionStatus={rpcConnectionStatus} />
						<ProviderErrors tabState={tabState} />
						<Home
							setActiveRpcAndInformAboutIt={setActiveRpcAndInformAboutIt}
							rpcNetwork={rpcNetwork}
							simVisResults={simVisResults}
							useSignersAddressAsActiveAddress={useSignersAddressAsActiveAddress}
							activeSigningAddress={activeSigningAddress}
							activeSimulationAddress={activeSimulationAddress}
							changeActiveAddress={changeActiveAddress}
							activeAddresses={activeAddresses}
							simulationMode={simulationMode}
							tabIconDetails={tabIconDetails}
							currentBlockNumber={currentBlockNumber}
							tabState={tabState}
							renameAddressCallBack={renameAddressCallBack}
							rpcConnectionStatus={rpcConnectionStatus}
							rpcEntries={rpcEntries}
							simulationUpdatingState={simulationUpdatingState}
							simulationResultState={simulationResultState}
						/>

						<div class={`modal ${appPage.value.page !== 'Home' && appPage.value.page !== 'Unknown' ? 'is-active' : ''}`}>
							{appPage.value.page === 'ChangeActiveAddress' ?
								<ChangeActiveAddress
									setActiveAddressAndInformAboutIt={setActiveAddressAndInformAboutIt}
									signerAccounts={tabState?.signerAccounts ?? []}
									close={goHome}
									activeAddresses={activeAddresses}
									signerName={tabState?.signerName ?? 'NoSignerDetected'}
									renameAddressCallBack={renameAddressCallBack}
									addNewAddress={addNewAddress}
								/>
								: <></>}
							{appPage.value.page === 'AddNewAddress' || appPage.value.page === 'ModifyAddress' ?
								<AddNewAddress
									setActiveAddressAndInformAboutIt={setActiveAddressAndInformAboutIt}
									modifyAddressWindowState={appPage.value.state}
									close={goHome}
									activeAddress={simulationMode ? activeSimulationAddress : activeSigningAddress}
									rpcEntries={rpcEntries}
								/>
								: <></>}
						</div>
					</>}
				</div>
			</Hint>
		</main>
	)
}
