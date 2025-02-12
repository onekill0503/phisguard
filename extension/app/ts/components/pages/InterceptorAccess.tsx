import { Signal, useSignal } from '@preact/signals'
import { useEffect, useState } from 'preact/hooks'
import { sendPopupMessageToBackgroundPage } from '../../background/backgroundUtils.js'
import { PendingAccessRequest, PendingAccessRequests } from '../../types/accessRequest.js'
import { AddressBookEntries, AddressBookEntry } from '../../types/addressBookTypes.js'
import { MessageToPopup } from '../../types/interceptor-messages.js'
import { RpcEntries } from '../../types/rpc.js'
import { ModifyAddressWindowState } from '../../types/visualizer-types.js'
import { Website } from '../../types/websiteAccessTypes.js'
import { addressString, checksummedAddress } from '../../utils/bigint.js'
import { ActiveAddressComponent, WebsiteOriginText } from '../subcomponents/address.js'
import Hint from '../subcomponents/Hint.js'
import { tryFocusingTabOrWindow } from '../ui-utils.js'
import { AddNewAddress } from './AddNewAddress.js'
import { ChangeActiveAddress } from './ChangeActiveAddress.js'

function Title({ icon, title} : {icon: string | undefined, title: string}) {
	return <span style = 'font-weight: 900; line-height: 48px'>
		{ icon === undefined
			? <></>
			: <img src = { icon } style = 'width: 48px; height: 48px; vertical-align: bottom; margin-right: 10px;'/>
		}
		{ title }
	</span>
}

function AccessRequestHeader(website: Website) {
	return <header class = 'card-header' style = 'height: 40px'>
		<div class = 'card-header-icon noselect nopointer' style = 'width: 100%;'>
			<WebsiteOriginText { ...website } />
		</div>
	</header>
}

// function AssociatedTogether({ associatedAddresses, renameAddressCallBack }: { associatedAddresses: AddressBookEntries, renameAddressCallBack: RenameAddressCallBack } ) {
// 	const [showLogs, setShowLogs] = useState<boolean>(associatedAddresses.length > 1)

// 	return <>
// 		<div class = 'card' style = 'margin-top: 10px; margin-bottom: 10px;'>
// 			<header class = 'card-header noselect' style = 'cursor: pointer; height: 30px;' onClick = { () => setShowLogs((prevValue) => !prevValue) }>
// 				<p class = 'card-header-title' style = 'font-weight: unset; font-size: 0.8em;'>
// 					{ associatedAddresses.length <= 1
// 						? 'The website cannot associate any addresses with each other'
// 						: <> There are&nbsp;
// 							<b>{ convertNumberToCharacterRepresentationIfSmallEnough(associatedAddresses.length).toUpperCase() } </b>
// 							&nbsp;addresses that the website can associate together with
// 						</>
// 					}
// 				</p>
// 				<div class = 'card-header-icon'>
// 					<span class = 'icon'><ChevronIcon /></span>
// 				</div>
// 			</header>
// 			{ !showLogs
// 				? <></>
// 				: <div class = 'card-content' style = 'border-bottom-left-radius: 0.25rem; border-bottom-right-radius: 0.25rem; border-left: 2px solid var(--card-bg-color); border-right: 2px solid var(--card-bg-color); border-bottom: 2px solid var(--card-bg-color);'>
// 					{ associatedAddresses.length <= 1
// 						? <DinoSays text = { 'Given its size, a tiny dinosaur wouldn\'t be expected to know any...' } />
// 						: <ul>
// 							{ associatedAddresses.map( (info, index) => (
// 								<li style = { `margin: 0px; margin-bottom: ${ index < associatedAddresses.length - 1  ? '10px;' : '0px' }` } >
// 									<BigAddress
// 										addressBookEntry = { info }
// 										renameAddressCallBack = { renameAddressCallBack }
// 									/>
// 								</li>
// 							)) }
// 						</ul>
// 					}
// 				</div>
// 			}
// 		</div>
// 	</>
// }

function AccessRequest({ renameAddressCallBack, accessRequest, changeActiveAddress, refreshActiveAddress }: { renameAddressCallBack: (entry: AddressBookEntry) => void, accessRequest: PendingAccessRequest, changeActiveAddress: () => void, refreshActiveAddress: () => Promise<void> }) {
	return <>
		{ accessRequest.requestAccessToAddress === undefined ?
		<div style = 'margin: 10px'>
			<p className = 'title is-4' style = 'text-align: center; margin-top: 40px; margin-bottom: 40px;'>
				<Title icon = { accessRequest.website.icon } title = { accessRequest.website.title === undefined ? accessRequest.website.websiteOrigin : accessRequest.website.title }/>
				<br/>
				would like to connect to PhisGuard
			</p>
		</div> :
			<>
				<div class = 'notification' style = 'background-color: var(--importance-box-color); color: var(--text-color)'>
					<p className = 'title is-3' style = 'text-align: center; margin-bottom: 10px;'>
						<Title icon = { accessRequest.website.icon } title = { accessRequest.website.title === undefined ? accessRequest.website.websiteOrigin : accessRequest.website.title }/>
						&nbsp;would like to connect to your account:
					</p>
					<div class = 'notification' style = 'padding: 10px; background-color: var(--alpha-015); justify-content: center; '>
						{ accessRequest.simulationMode ?
							<ActiveAddressComponent
								activeAddress = { accessRequest.requestAccessToAddress }
								renameAddressCallBack = { renameAddressCallBack }
								changeActiveAddress = { changeActiveAddress }
								buttonText = { 'Change' }
								disableButton = { false }
							/> : <>
								<ActiveAddressComponent
									activeAddress = { accessRequest.requestAccessToAddress }
									renameAddressCallBack = { renameAddressCallBack }
									changeActiveAddress = { refreshActiveAddress }
									disableButton = { false }
									buttonText = { 'Refresh' }
								/>
							</>
						}
					</div>
				</div>

				{/* <AssociatedTogether
					associatedAddresses = { accessRequest.associatedAddresses }
					renameAddressCallBack = { renameAddressCallBack }
				/> */}
			</>
		}
	</>
}

type AccessRequestParam = {
	renameAddressCallBack: (accessRequestId: string, entry: AddressBookEntry) => void
	pendingAccessRequests: PendingAccessRequests
	changeActiveAddress: (accessRequestId: string) => void
	refreshActiveAddress: (accessRequestId: string) => Promise<void>
	approve: (accessRequestId: string) => void
	reject: (accessRequestId: string) => void
	informationChangedRecently: () => boolean
}

function AccessRequests(param: AccessRequestParam) {
	return <> { param.pendingAccessRequests.map((pendingRequest) => <>
		<div class = 'card' style = 'margin-bottom: 10px;'>
			<AccessRequestHeader { ...pendingRequest.website } />
			<div class = 'card-content' style = 'padding-bottom: 5px;'>
				<AccessRequest
					renameAddressCallBack =  { (entry: AddressBookEntry) => param.renameAddressCallBack(pendingRequest.accessRequestId, entry) }
					accessRequest = { pendingRequest }
					changeActiveAddress = { () => param.changeActiveAddress(pendingRequest.accessRequestId) }
					refreshActiveAddress = { () => param.refreshActiveAddress(pendingRequest.accessRequestId) }
				/>
			</div>

			<nav class='popup-button-row'>
				<div style='display: flex; flex-direction: row;'>
					<button class="button is-danger is-light" style='flex-grow: 1; margin-left: 5px; margin-right: 5px;' onClick={() => param.reject(pendingRequest.accessRequestId)} disabled={param.informationChangedRecently()}>
						<span class="icon">
							<i class="fas fa-times"></i>
						</span>
						<span>Deny Access</span>
					</button>
					<button class="button is-primary" style='flex-grow: 1; margin-left: 5px; margin-right: 5px;' onClick={() => param.approve(pendingRequest.accessRequestId)} disabled={param.informationChangedRecently()} >
						<span class="icon">
							<i class="fas fa-check"></i>
						</span>
						<span>Grant Access</span>
					</button>
				</div>
			</nav>
		</div>
	</>) } </>
}

const DISABLED_DELAY_MS = 500

type Page = { page: 'Home', accessRequestId: string }
	| { page: 'ModifyAddress' | 'AddNewAddress', state: Signal<ModifyAddressWindowState>, accessRequestId: string }
	| { page: 'ChangeActiveAddress', accessRequestId: string }

export function InterceptorAccess() {
	const [pendingAccessRequests, setAccessRequest] = useState<PendingAccessRequests>([])
	const [activeAddresses, setActiveAddresses] = useState<AddressBookEntries>([])
	const appPage = useSignal<Page>({ page: 'Home', accessRequestId: '' })
	const [informationUpdatedTimestamp, setInformationUpdatedTimestamp] = useState(0)
	const [, setTimeSinceInformationUpdate] = useState(0)
	const rpcEntries = useSignal<RpcEntries>([])

	useEffect(() => {
		function popupMessageListener(msg: unknown) {
			const maybeParsed = MessageToPopup.safeParse(msg)
			if (!maybeParsed.success) return // not a message we are interested in
			const parsed = maybeParsed.value
			if (parsed.method === 'popup_settingsUpdated') return sendPopupMessageToBackgroundPage({ method: 'popup_requestSettings' })
			if (parsed.method === 'popup_requestSettingsReply') {
				rpcEntries.value = parsed.data.rpcEntries
				return
			}
			if (parsed.method === 'popup_addressBookEntriesChanged') return refreshMetadata()
			if (parsed.method === 'popup_websiteAccess_changed') return refreshMetadata()
			if (parsed.method === 'popup_interceptorAccessDialog' || parsed.method === 'popup_interceptor_access_dialog_pending_changed') {
				if (parsed.method === 'popup_interceptor_access_dialog_pending_changed') {
					if (pendingAccessRequests.length > 0) setInformationUpdatedTimestamp(Date.now())
				}
				setAccessRequest(parsed.data.pendingAccessRequests)
				setActiveAddresses(parsed.data.activeAddresses)
				return
			}
			return
		}
		browser.runtime.onMessage.addListener(popupMessageListener)
		return () => browser.runtime.onMessage.removeListener(popupMessageListener)
	})

	useEffect(() => {
		sendPopupMessageToBackgroundPage({ method: 'popup_interceptorAccessReadyAndListening' })
		sendPopupMessageToBackgroundPage({ method: 'popup_requestSettings' })
	}, [])

	async function approve(accessRequestId: string) {
		const accessRequest = pendingAccessRequests.find((request) => request.accessRequestId === accessRequestId)
		if (accessRequest === undefined) throw Error('accessRequest is undefined')
		const data = {
			userReply: 'Approved' as const,
			websiteOrigin: accessRequest.website.websiteOrigin,
			requestAccessToAddress: accessRequest.requestAccessToAddress?.address,
			originalRequestAccessToAddress: accessRequest.originalRequestAccessToAddress?.address,
			accessRequestId: accessRequest.accessRequestId,
		}
		setInformationUpdatedTimestamp(Date.now())
		if (pendingAccessRequests.length === 1) await tryFocusingTabOrWindow({ type: 'tab', id: accessRequest.socket.tabId })
		await sendPopupMessageToBackgroundPage({ method: 'popup_interceptorAccess', data })
	}

	async function reject(accessRequestId: string) {
		const accessRequest = pendingAccessRequests.find((request) => request.accessRequestId === accessRequestId)
		if (accessRequest === undefined) throw Error('accessRequest is undefined')
		const data = {
			userReply: 'Rejected' as const,
			websiteOrigin: accessRequest.website.websiteOrigin,
			requestAccessToAddress: accessRequest.requestAccessToAddress?.address,
			originalRequestAccessToAddress: accessRequest.originalRequestAccessToAddress?.address,
			accessRequestId: accessRequest.accessRequestId,
		}
		setInformationUpdatedTimestamp(Date.now())
		if (pendingAccessRequests.length === 1) await tryFocusingTabOrWindow({ type: 'tab', id: accessRequest.socket.tabId })
		await sendPopupMessageToBackgroundPage({ method: 'popup_interceptorAccess', data })
	}

	function renameAddressCallBack(accessRequestId: string, entry: AddressBookEntry) {
		appPage.value = { page: 'ModifyAddress', state: new Signal({
			windowStateId: addressString(entry.address),
			errorState: undefined,
			incompleteAddressBookEntry: {
				addingAddress: false,
				askForAddressAccess: true,
				symbol: undefined,
				decimals: undefined,
				logoUri: undefined,
				useAsActiveAddress: false,
				abi: undefined,
				declarativeNetRequestBlockMode: undefined,
				chainId: entry.chainId || 1n,
				...entry,
				address: checksummedAddress(entry.address),
			}
		}), accessRequestId }
	}

	const changeActiveAddress = (accessRequestId: string) => { appPage.value = { accessRequestId, page: 'ChangeActiveAddress' } }

	async function refreshMetadata() {
		await sendPopupMessageToBackgroundPage({ method: 'popup_refreshInterceptorAccessMetadata' })
	}

	async function refreshActiveAddress(accessRequestId: string) {
		const accessRequest = pendingAccessRequests.find((request) => request.accessRequestId === accessRequestId)
		if (accessRequest === undefined) throw Error('accessRequest is undefined')
		await sendPopupMessageToBackgroundPage({ method: 'popup_interceptorAccessRefresh', data: {
			socket: accessRequest.socket,
			website: accessRequest.website,
			requestAccessToAddress: accessRequest.requestAccessToAddress?.address,
			accessRequestId: accessRequest.accessRequestId,
		} } )
	}

	async function setActiveAddressAndInformAboutIt(accessRequestId: string, address: bigint | 'signer') {
		const accessRequest = pendingAccessRequests.find((request) => request.accessRequestId === accessRequestId)
		if (accessRequest === undefined) throw Error('accessRequest is undefined')
		await sendPopupMessageToBackgroundPage({ method: 'popup_interceptorAccessChangeAddress', data: {
			socket: accessRequest.socket,
			website: accessRequest.website,
			requestAccessToAddress: accessRequest.requestAccessToAddress?.address,
			newActiveAddress: address,
			accessRequestId: accessRequest.accessRequestId,
		} } )
	}

	const informationChangedRecently = () => new Date().getTime() < informationUpdatedTimestamp + DISABLED_DELAY_MS

	useEffect(() => {
		const id = setInterval(() => setTimeSinceInformationUpdate((old) => old + 1), 1000)
		return () => clearInterval(id)
	}, [])

	function addNewAddress(accessRequestId: string) {
		appPage.value = { accessRequestId, page: 'AddNewAddress', state: new Signal({
			windowStateId: 'AddNewAddressAccess',
			errorState: undefined,
			incompleteAddressBookEntry: {
				name: undefined,
				addingAddress: false,
				askForAddressAccess: true,
				symbol: undefined,
				decimals: undefined,
				logoUri: undefined,
				type: 'contact',
				useAsActiveAddress: true,
				entrySource: 'FilledIn',
				address: undefined,
				abi: undefined,
				declarativeNetRequestBlockMode: undefined,
				chainId: 1n,
			}
		}) }
	}

	if (pendingAccessRequests.length === 0) return <main></main>
	const pendingAccessRequest = pendingAccessRequests[0]
	if (pendingAccessRequest === undefined) throw new Error('pending access request was undefined')

	return <main>
		<Hint>
			<div class = { `modal ${ appPage.value.page !== 'Home' ? 'is-active' : ''}` }>
				{ appPage.value.page === 'AddNewAddress' || appPage.value.page === 'ModifyAddress'
					? <AddNewAddress
						setActiveAddressAndInformAboutIt = { (address: bigint | 'signer') => setActiveAddressAndInformAboutIt(appPage.value.accessRequestId, address) }
						modifyAddressWindowState = { appPage.value.state }
						close = { () => { appPage.value = { page: 'Home', accessRequestId: '' } } }
						activeAddress = { pendingAccessRequest.requestAccessToAddress?.address }
						rpcEntries = { rpcEntries }
					/>
					: <></>
				}

				{ appPage.value.page === 'ChangeActiveAddress'
					? <ChangeActiveAddress
						setActiveAddressAndInformAboutIt = { (address: bigint | 'signer') => setActiveAddressAndInformAboutIt(appPage.value.accessRequestId, address) }
						signerAccounts = { pendingAccessRequest.signerAccounts }
						close = { () => { appPage.value = { page: 'Home', accessRequestId: '' } } }
						activeAddresses = { activeAddresses }
						signerName = { pendingAccessRequest.signerName }
						renameAddressCallBack = { (entry: AddressBookEntry) => renameAddressCallBack(appPage.value.accessRequestId, entry) }
						addNewAddress = { () => addNewAddress(appPage.value.accessRequestId) }
					/>
					: <></>
				}
			</div>

			<div class = 'block popup-block'>
				<div class = 'popup-block-scroll'>
					<AccessRequests
						changeActiveAddress = { changeActiveAddress }
						renameAddressCallBack = { renameAddressCallBack }
						pendingAccessRequests = { pendingAccessRequests }
						refreshActiveAddress = { refreshActiveAddress }
						approve = { approve }
						reject = { reject }
						informationChangedRecently = { informationChangedRecently }
					/>
				</div>
			</div>
		</Hint>
	</main>
}
