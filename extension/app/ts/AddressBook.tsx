import { Signal, useComputed, useSignal, useSignalEffect } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { sendPopupMessageToBackgroundPage } from './background/backgroundUtils.js'
import { AddNewAddress } from './components/pages/AddNewAddress.js'
import { BigAddress } from './components/subcomponents/address.js'
import { DynamicScroller } from './components/subcomponents/DynamicScroller.js'
import Hint from './components/subcomponents/Hint.js'
import { XMarkIcon } from './components/subcomponents/icons.js'
import { AddressBookEntries, AddressBookEntry } from './types/addressBookTypes.js'
import { GetAddressBookDataReply, MessageToPopup } from './types/interceptor-messages.js'
import { ChainEntry, RpcEntries } from './types/rpc.js'
import { RenameAddressCallBack } from './types/user-interface-types.js'
import { ModifyAddressWindowState } from './types/visualizer-types.js'
import { checksummedAddress } from './utils/bigint.js'
import { ChainSelector } from './components/subcomponents/ChainSelector.js'

type Modals = { page: 'noModal' }
	| { page: 'addNewAddress', state: Signal<ModifyAddressWindowState> }
	| { page: 'confirmaddressBookEntryToBeRemoved', addressBookEntry: AddressBookEntry }

const filterDefs = {
	'My Active Addresses': 'Active Address',
	'My Contacts': 'Contact',
}
type FilterKey = keyof typeof filterDefs

type ConfirmaddressBookEntryToBeRemovedParams = {
	category: FilterKey,
	addressBookEntry: AddressBookEntry,
	removeEntry: (entry: AddressBookEntry) => void,
	close: () => void,
	renameAddressCallBack: RenameAddressCallBack,
}

function ConfirmaddressBookEntryToBeRemoved(param: ConfirmaddressBookEntryToBeRemovedParams) {
	const remove = () => {
		param.removeEntry(param.addressBookEntry)
		param.close()
	}
	return <>
		<div class='modal-background'> </div>
		<div class='modal-card'>
			<header class='modal-card-head card-header interceptor-modal-head window-header'>
				<div class='card-header-icon unset-cursor'>
					<span class='icon'>
						<img src='../img/address-book.svg' />
					</span>
				</div>
				<div class='card-header-title'>
					<p className='paragraph'> {`Remove ${filterDefs[param.category]}`} </p>
				</div>
				<button class='card-header-icon' aria-label='close' onClick={param.close}>
					<XMarkIcon />
				</button>
			</header>
			<section class='modal-card-body' style='overflow: visible;'>
				<div class='card' style='margin: 10px;'>
					<div class='card-content'>
						<BigAddress
							addressBookEntry={param.addressBookEntry}
							renameAddressCallBack={param.renameAddressCallBack}
						/>
					</div>
				</div>
			</section>
			<footer class='modal-card-foot window-footer' style='border-bottom-left-radius: unset; border-bottom-right-radius: unset; border-top: unset; padding: 10px;'>
				<button class='button is-success is-primary' onClick={remove}> {'Remove'} </button>
				<button class='button is-warning is-danger' onClick={param.close}>Cancel</button>
			</footer>
		</div>
	</>
}

type ListElementParam = (AddressBookEntry | { type: 'empty' }) & {
	category: FilterKey,
	removeEntry: (entry: AddressBookEntry) => void,
	renameAddressCallBack: RenameAddressCallBack,
}

function AddressBookEntryCard({ removeEntry, renameAddressCallBack, ...entry }: ListElementParam) {
	const conditionallyRemoveEntry = () => {
		if (entry.type === 'empty') return
		removeEntry(entry)
	}

	const conditionallyEditEntry = () => {
		if (entry.type === 'empty') return
		renameAddressCallBack(entry)
	}

	return (
		<div class='card' style={{ marginLeft: '1rem', marginRight: '1rem', marginBottom: '1rem' }}>
			<div class='card-content' style='width: 500px;'>
				<div class='media' style={{ alignItems: 'stretch' }}>
					<div class='media-content' style={{ overflowY: 'visible', overflowX: 'unset', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
						<div style='padding-bottom: 10px; height: 40px'>
							{entry.type === 'empty'
								? <></>
								: <BigAddress
									addressBookEntry={{ ...entry, ...{ name: `${entry.name}${'symbol' in entry ? ` (${entry.symbol})` : ''}` } }}
									noCopying={false}
									renameAddressCallBack={renameAddressCallBack}
								/>
							}
						</div>

						{entry.category === 'My Active Addresses' ?
							<label class='form-control' style='padding-top: 10px'>
								<input type='checkbox' checked={'askForAddressAccess' in entry && !entry.askForAddressAccess} disabled={true} />
								<p class='paragraph checkbox-text'>Don't request for an access (insecure) </p>
							</label>
							:
							<div>
								<p class='paragraph' style='display: inline-block; font-size: 13px; vertical-align: top; width: 420px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;'>
									{`ABI: ${'abi' in entry && entry.abi !== undefined ? entry.abi : 'No ABI available'} `}
								</p>
							</div>
						}
						<div>
							<p class='paragraph' style='display: inline-block; font-size: 13px; color: var(--subtitle-text-color);'>
								{`Source: ${'entrySource' in entry ? entry.entrySource : ''}`}
							</p>
						</div>
					</div>

					<div class='content' style='color: var(--text-color); display: flex; flex-direction: column; justify-content: space-between;'>
						<button class='card-header-icon' style='padding: 0px; margin-left: auto;' aria-label='delete' disabled={entry.type === 'empty' || (entry.entrySource !== 'User' && entry.entrySource !== 'OnChain')} onClick={conditionallyRemoveEntry}>
							<XMarkIcon />
						</button>
						<button class='button is-primary is-small' onClick={conditionallyEditEntry}>Edit</button>
					</div>
				</div>
			</div>
		</div>
	)
}

type ViewFilter = {
	activeFilter: FilterKey
	searchString: string
	chain: ChainEntry | undefined
}

type AddressBookEntriesWithFilter = {
	addressBookEntries: AddressBookEntries
	activeFilter: FilterKey
}

export function AddressBook() {
	const addressBookEntriesWithFilter = useSignal<AddressBookEntriesWithFilter>({ addressBookEntries: [], activeFilter: 'My Active Addresses' })
	const addressBookEntries = useComputed(() => addressBookEntriesWithFilter.value.addressBookEntries || [])
	const activeChain = useSignal<ChainEntry | undefined>(undefined)
	const activeChainId = useComputed(() => activeChain.value?.chainId || 1n)
	const rpcEntries = useSignal<RpcEntries>([])
	const viewFilter = useSignal<ViewFilter>({ activeFilter: 'My Active Addresses', searchString: '', chain: undefined })
	const modalState = useSignal<Modals>({ page: 'noModal' })
	function sendQuery() {
		const filterValue = viewFilter.value
		if (filterValue.chain === undefined) return
		sendPopupMessageToBackgroundPage({
			method: 'popup_getAddressBookData', data: {
				chainId: filterValue.chain.chainId,
				filter: filterValue.activeFilter,
				searchString: filterValue.searchString
			}
		})
	}
	useSignalEffect(sendQuery)

	useEffect(() => {
		const popupMessageListener = (msg: unknown) => {
			const maybeParsed = MessageToPopup.safeParse(msg)
			if (!maybeParsed.success) return // not a message we are interested in
			const parsed = maybeParsed.value
			if (parsed.method === 'popup_addressBookEntriesChanged') {
				const chainId = activeChain.peek()?.chainId
				if (chainId !== undefined) sendQuery()
				return
			}
			if (parsed.method === 'popup_settingsUpdated') return sendPopupMessageToBackgroundPage({ method: 'popup_requestSettings' })
			if (parsed.method === 'popup_requestSettingsReply') {
				rpcEntries.value = parsed.data.rpcEntries
				const prevActiveNetwork = activeChain.peek()
				if (prevActiveNetwork === undefined || prevActiveNetwork.chainId === parsed.data.activeRpcNetwork.chainId) {
					activeChain.value = parsed.data.activeRpcNetwork
					if (prevActiveNetwork === undefined || viewFilter.value.chain === undefined) {
						viewFilter.value = { ...viewFilter.value, chain: activeChain.value === undefined ? undefined : { name: activeChain.value.name, chainId: activeChain.value.chainId } }
					}
				}
			}
			if (parsed.method !== 'popup_getAddressBookDataReply') return
			const reply = GetAddressBookDataReply.parse(msg)
			if (activeChain.peek()?.chainId === reply.data.data.chainId) {
				addressBookEntriesWithFilter.value = {
					addressBookEntries: reply.data.entries,
					activeFilter: reply.data.data.filter,
				}
			}
			return
		}
		sendPopupMessageToBackgroundPage({ method: 'popup_requestSettings' })
		browser.runtime.onMessage.addListener(popupMessageListener)
		return () => { browser.runtime.onMessage.removeListener(popupMessageListener) }
	}, [])

	function changeActiveChain(entry: ChainEntry) {
		if (entry.chainId === activeChain.peek()?.chainId) return
		activeChain.value = entry
		viewFilter.value = { ...viewFilter.peek(), chain: { name: entry.name, chainId: entry.chainId } }
	}

	function search(searchString: string) {
		viewFilter.value = { ...viewFilter.peek(), searchString }
	}

	function GetNoResultsError() {
		const errorMessage = 'No entries found'
		return <div style={{ width: 500, padding: '0 1rem', margin: '0 1rem' }}>{errorMessage}</div>
	}

	function openNewAddress(filter: FilterKey) {
		modalState.value = {
			page: 'addNewAddress', state: new Signal({
				windowStateId: 'AddressBookAdd',
				errorState: undefined,
				incompleteAddressBookEntry: {
					addingAddress: true,
					type: 'contact',
					symbol: undefined,
					decimals: undefined,
					logoUri: undefined,
					name: undefined,
					address: undefined,
					askForAddressAccess: true,
					entrySource: 'FilledIn',
					abi: undefined,
					useAsActiveAddress: filter === 'My Active Addresses',
					declarativeNetRequestBlockMode: undefined,
					chainId: activeChain.peek()?.chainId || 1n,
				}
			})
		}
		return
	}

	function renameAddressCallBack(entry: AddressBookEntry) {
		modalState.value = {
			page: 'addNewAddress', state: new Signal({
				windowStateId: 'AddressBookRename',
				errorState: undefined,
				incompleteAddressBookEntry: {
					addingAddress: false,
					askForAddressAccess: true,
					symbol: undefined,
					decimals: undefined,
					logoUri: undefined,
					useAsActiveAddress: false,
					declarativeNetRequestBlockMode: undefined,
					...entry,
					abi: 'abi' in entry ? entry.abi : undefined,
					address: checksummedAddress(entry.address),
					chainId: entry.chainId || 1n,
				}
			})
		}
		return
	}

	function removeAddressBookEntry(entry: AddressBookEntry) {
		sendPopupMessageToBackgroundPage({
			method: 'popup_removeAddressBookEntry',
			data: {
				address: entry.address,
				addressBookCategory: viewFilter.value.activeFilter,
				chainId: entry.chainId || 1n,
			}
		})
	}
	return (
		<main>
			<Hint>
				<div class='columns' style={{ width: 'fit-content', margin: 'auto', padding: '0 1rem' }}>
					<div style={{ padding: '1rem 0' }}>
						<div style='padding: 10px;'>
							<ChainSelector rpcEntries={rpcEntries} chainId={activeChainId} changeChain={changeActiveChain} />
						</div>
					</div>
					<div style={{ display: 'grid', gridTemplateRows: 'min-content 1fr', rowGap: '1rem', height: '100vh', paddingTop: '1rem' }}>
						<div style={{ display: 'grid', gridTemplateColumns: '1fr max-content', columnGap: '1rem', padding: '0 1rem', alignItems: 'center' }}>
							<input class='input' type='text' placeholder='Search In Category' value={viewFilter.value.searchString} onInput={e => search(e.currentTarget.value)} />
							<button class='button is-primary' onClick={() => openNewAddress(viewFilter.value.activeFilter)}>
								{`Add New`}
							</button>
						</div>
						<div style={{ minHeight: 0 }}>
							{addressBookEntriesWithFilter.value.addressBookEntries.length
								? <DynamicScroller
									items={addressBookEntries}
									renderItem={addressBookEntry => (
										<AddressBookEntryCard {...addressBookEntry} category={addressBookEntriesWithFilter.value.activeFilter} removeEntry={() => { modalState.value = { page: 'confirmaddressBookEntryToBeRemoved', addressBookEntry } }} renameAddressCallBack={renameAddressCallBack} />
									)}
								/>
								: <GetNoResultsError />
							}
						</div>
					</div>
				</div>

				<div class={`modal ${modalState.value.page !== 'noModal' ? 'is-active' : ''}`}>
					{modalState.value.page === 'addNewAddress' ?
						<AddNewAddress
							setActiveAddressAndInformAboutIt={undefined}
							modifyAddressWindowState={modalState.value.state}
							close={() => { modalState.value = { page: 'noModal' } }}
							activeAddress={undefined}
							rpcEntries={rpcEntries}
						/>
						: <></>}
					{modalState.value.page === 'confirmaddressBookEntryToBeRemoved' ?
						<ConfirmaddressBookEntryToBeRemoved
							category={viewFilter.value.activeFilter}
							addressBookEntry={modalState.value.addressBookEntry}
							removeEntry={removeAddressBookEntry}
							close={() => { modalState.value = { page: 'noModal' } }}
							renameAddressCallBack={renameAddressCallBack}
						/>
						: <></>}
				</div>
			</Hint>
		</main>
	)
}
