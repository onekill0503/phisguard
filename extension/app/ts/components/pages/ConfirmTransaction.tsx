import { Signal, useComputed, useSignal } from '@preact/signals'
import { useEffect, useState } from 'preact/hooks'
import { sendPopupMessageToBackgroundPage } from '../../background/backgroundUtils.js'
import { PendingTransactionOrSignableMessage } from '../../types/accessRequest.js'
import { AddressBookEntry } from '../../types/addressBookTypes.js'
import { MessageToPopup, UnexpectedErrorOccured, UpdateConfirmTransactionDialog } from '../../types/interceptor-messages.js'
import { VisualizedPersonalSignRequest } from '../../types/personal-message-definitions.js'
import { RpcEntries } from '../../types/rpc.js'
import { RenameAddressCallBack, RpcConnectionStatus } from '../../types/user-interface-types.js'
import { CompleteVisualizedSimulation, ModifyAddressWindowState, SimulatedAndVisualizedTransaction } from '../../types/visualizer-types.js'
import { Website } from '../../types/websiteAccessTypes.js'
import { addressString, checksummedAddress, stringifyJSONWithBigInts } from '../../utils/bigint.js'
import { WebsiteSocket, checkAndThrowRuntimeLastError } from '../../utils/requests.js'
import { getWebsiteWarningMessage } from '../../utils/websiteData.js'
import { NetworkErrors } from '../App.js'
import { identifyTransaction } from '../simulationExplaining/identifyTransaction.js'
import { DinoSaysNotification } from '../subcomponents/DinoSays.js'
import { ErrorCheckBox, ErrorComponent, UnexpectedError } from '../subcomponents/Error.js'
import Hint from '../subcomponents/Hint.js'
import { Spinner } from '../subcomponents/Spinner.js'
import { Link } from '../subcomponents/link.js'
import { SignerLogoText, SignersLogoName } from '../subcomponents/signers.js'
import { tryFocusingTabOrWindow } from '../ui-utils.js'
import { AddNewAddress } from './AddNewAddress.js'
import { InvalidMessage, identifySignature, isPossibleToSignMessage } from './PersonalSign.js'

type UnderTransactionsParams = {
	pendingTransactionsAndSignableMessages: PendingTransactionOrSignableMessage[]
}

const getResultsForTransaction = (results: readonly SimulatedAndVisualizedTransaction[], transactionIdentifier: bigint) => {
	return results.find((result) => result.transactionIdentifier === transactionIdentifier)
}

const HALF_HEADER_HEIGHT = 48 / 2

function UnderTransactions(_: UnderTransactionsParams) {
	return <></>
}

type TransactionNamesParams = {
	completeVisualizedSimulation: CompleteVisualizedSimulation | undefined
	currentPendingTransaction: PendingTransactionOrSignableMessage
}
const TransactionNames = (param: TransactionNamesParams) => {
	if (param.completeVisualizedSimulation === undefined || param.completeVisualizedSimulation.simulationResultState !== 'done') return <></>
	const transactionsAndMessages: readonly (VisualizedPersonalSignRequest | SimulatedAndVisualizedTransaction)[] = [...param.completeVisualizedSimulation.visualizedPersonalSignRequests, ...param.completeVisualizedSimulation.simulatedAndVisualizedTransactions].sort((n1, n2) => n1.created.getTime() - n2.created.getTime())
	const names = transactionsAndMessages.map((transactionOrMessage) => 'transaction' in transactionOrMessage ? identifyTransaction(transactionOrMessage).title : identifySignature(transactionOrMessage).title)
	const makingRich = param.completeVisualizedSimulation.simulationState?.addressToMakeRich !== undefined
	const titleOfCurrentPendingTransaction = () => {
		const currentPendingTransactionOrSignableMessage = param.currentPendingTransaction
		if (currentPendingTransactionOrSignableMessage === undefined) return 'Loading...'
		if (currentPendingTransactionOrSignableMessage.transactionOrMessageCreationStatus !== 'Simulated') return currentPendingTransactionOrSignableMessage.transactionOrMessageCreationStatus
		currentPendingTransactionOrSignableMessage.transactionOrMessageCreationStatus
		if (currentPendingTransactionOrSignableMessage.type === 'SignableMessage') return identifySignature(currentPendingTransactionOrSignableMessage.visualizedPersonalSignRequest).title
		if (currentPendingTransactionOrSignableMessage.simulationResults.statusCode === 'failed') return 'Failing transaction'
		const lastTx = currentPendingTransactionOrSignableMessage.simulationResults.statusCode !== 'success' ? undefined : getResultsForTransaction(currentPendingTransactionOrSignableMessage.simulationResults.data.simulatedAndVisualizedTransactions, currentPendingTransactionOrSignableMessage.transactionIdentifier)
		if (lastTx === undefined) return 'Could not find transaction...'
		return identifyTransaction(lastTx).title
	}

	const namesWithCurrentTransaction = [...makingRich ? ['Simply making you rich'] : [], ...names, titleOfCurrentPendingTransaction()]
	return <div class='block' style='margin-bottom: 10px;'>
		<nav class='breadcrumb has-succeeds-separator is-small'>
			<ul>
				{namesWithCurrentTransaction.map((name, index) => (
					<li style='margin: 0px;'>
						<div class='card' style={`padding: 5px; margin: 5px; ${index !== namesWithCurrentTransaction.length - 1 ? 'background-color: var(--disabled-card-color)' : ''}`}>
							<p class='paragraph' style={`margin: 0px; ${index !== namesWithCurrentTransaction.length - 1 ? 'color: var(--disabled-text-color)' : ''}`}>
								{name}
							</p>
						</div>
					</li>
				))}
			</ul>
		</nav>
	</div>
}

type TransactionCardParams = {
	pendingTransactionsAndSignableMessages: readonly PendingTransactionOrSignableMessage[],
	renameAddressCallBack: RenameAddressCallBack,
	currentBlockNumber: bigint | undefined,
	rpcConnectionStatus: Signal<RpcConnectionStatus>,
	numberOfUnderTransactions: number,
}

function TransactionCard(param: TransactionCardParams) {
	const [isExpanded, setIsExpanded] = useState(false);

	// Parse and format the transaction data
	const parsedTx = JSON.parse(stringifyJSONWithBigInts(param.pendingTransactionsAndSignableMessages[0]?.originalRequestParameters ?? '{}'));
	const method = parsedTx.method;
	const from = parsedTx.params[0].from;
	const to = parsedTx.params[0].to;

	return <>

		<div>
			<header className="modal-card-head">
				<p className="modal-card-title">Confirm Transaction - PhisGuard</p>
			</header>

			<section className="modal-card-body">
				<div className="content">
					<div className="box">
						<h4 className="title is-5">Transaction Details</h4>

						<div className="field">
							<label className="label">Method</label>
							<div className="control">
								<div className="tags has-addons">
									<span className="tag is-medium">Method</span>
									<span className="tag is-medium is-info">{method}</span>
								</div>
							</div>
						</div>

						<div className="field">
							<label className="label">From</label>
							<div className="control">
								<input
									className="input is-small"
									type="text"
									value={from}
									readOnly
								/>
							</div>
						</div>

						<div className="field">
							<label className="label">To</label>
							<div className="control">
								<input
									className="input is-small"
									type="text"
									value={to}
									readOnly
								/>
							</div>
						</div>
					</div>

					<div className="notification is-light is-info">
						<button
							className="button is-small is-info is-light mb-2"
							onClick={() => setIsExpanded(!isExpanded)}
						>
							{isExpanded ? 'Hide' : 'Show'} Raw Transaction Data
						</button>

						{isExpanded && (
							<pre style={{
								maxHeight: '200px',
								overflow: 'auto',
								fontSize: '0.85rem',
								backgroundColor: '#f5f5f5',
								padding: '1rem',
								borderRadius: '4px'
							}}>
								{JSON.stringify(parsedTx, null, 2)}
							</pre>
						)}
					</div>
				</div>
			</section>
		</div>
	</>
}

type CheckBoxesParams = {
	currentPendingTransactionOrSignableMessage: PendingTransactionOrSignableMessage,
	forceSend: Signal<boolean>,
}
const CheckBoxes = (params: CheckBoxesParams) => {
	if (params.currentPendingTransactionOrSignableMessage.transactionOrMessageCreationStatus !== 'Simulated') return <></>
	const setForceSend = (checked: boolean) => { params.forceSend.value = checked }
	if (params.currentPendingTransactionOrSignableMessage.type === 'SignableMessage') {
		const visualizedPersonalSignRequest = params.currentPendingTransactionOrSignableMessage.visualizedPersonalSignRequest
		return <>
			{isPossibleToSignMessage(visualizedPersonalSignRequest, visualizedPersonalSignRequest.activeAddress.address) && visualizedPersonalSignRequest.quarantine
				? <div style='display: grid'>
					<div style='margin: 0px; margin-bottom: 10px; margin-left: 20px; margin-right: 20px; '>
						<ErrorCheckBox text={'I understand that there are issues with this signature request but I want to send it anyway against Interceptors recommendations.'} checked={params.forceSend.value} onInput={setForceSend} />
					</div>
				</div>
				: <></>
			}
		</>
	}
	if (params.currentPendingTransactionOrSignableMessage.simulationResults.statusCode !== 'success') return <></>
	const simulatedAndVisualizedTransactions = params.currentPendingTransactionOrSignableMessage.simulationResults.data.simulatedAndVisualizedTransactions
	const currentResults = getResultsForTransaction(simulatedAndVisualizedTransactions, params.currentPendingTransactionOrSignableMessage.transactionIdentifier)

	const margins = 'margin: 0px; margin-bottom: 10px; margin-left: 20px; margin-right: 20px;'
	if (currentResults === undefined) return <></>
	if (params.currentPendingTransactionOrSignableMessage?.approvalStatus.status === 'SignerError') return <div style='display: grid'>
		<div style={margins}>
			<ErrorComponent text={params.currentPendingTransactionOrSignableMessage.approvalStatus.message} />
		</div>
	</div>
	if (currentResults.statusCode !== 'success') return <div style='display: grid'>
		<div style={margins}>
			<ErrorCheckBox text={'I understand that the transaction will fail but I want to send it anyway.'} checked={params.forceSend.value} onInput={setForceSend} />
		</div>
	</div>
	if (currentResults.quarantine === true) return <div style='display: grid'>
		<div style={margins}>
			<ErrorCheckBox text={'I understand that there are issues with this transaction but I want to send it anyway against Interceptors recommendations.'} checked={params.forceSend.value} onInput={setForceSend} />
		</div>
	</div>
	return <></>
}

type NetworkErrorParams = {
	websiteSocket: WebsiteSocket
	website: Website
	simulationMode: boolean
}

const WebsiteErrors = ({ website, websiteSocket, simulationMode }: NetworkErrorParams) => {
	const message = getWebsiteWarningMessage(website.websiteOrigin, simulationMode)
	if (message === undefined) return <></>
	if (message.suggestedAlternative === undefined) return <ErrorComponent warning={true} text={message.message} />
	return <ErrorComponent warning={true} text={<> {message.message} <Link url={message.suggestedAlternative} text={'Suggested alternative'} websiteSocket={websiteSocket} /> </>} />
}

type ModalState =
	{ page: 'modifyAddress', state: Signal<ModifyAddressWindowState> } |
	{ page: 'noModal' }

type RejectButtonParams = {
	onClick: () => void
}
const RejectButton = ({ onClick }: RejectButtonParams) => {
	return <div style='display: flex;'>
		<button className='button is-primary is-danger button-overflow dialog-button-left' onClick={onClick} >
			{'Reject'}
		</button>
	</div>
}

type ButtonsParams = {
	currentPendingTransactionOrSignableMessage: PendingTransactionOrSignableMessage | undefined
	reject: () => void
	approve: () => void
}
function Buttons({ currentPendingTransactionOrSignableMessage, reject, approve }: ButtonsParams) {
	console.log('Buttons: Starting execution')

	if (currentPendingTransactionOrSignableMessage === undefined) {
		console.log('Buttons: currentPendingTransactionOrSignableMessage is undefined, returning RejectButton')
		return <RejectButton onClick={reject} />
	}

	console.log('Buttons: Preparing to return buttons UI')
	return <div style='display: flex; flex-direction: row;'>
		<button className='button is-primary is-danger button-overflow dialog-button-left' onClick={reject} >
			Reject
		</button>
		<button className='button is-primary button-overflow dialog-button-right' onClick={approve}>
			{currentPendingTransactionOrSignableMessage.approvalStatus.status === 'WaitingForSigner' ? <>
				<span> <Spinner height='1em' color='var(--text-color)' /> Waiting for <SignersLogoName signerName={'NoSigner'} /> </span>
			</> : <>
				{<SignerLogoText text={"Approve"} />
				}
			</>
			}
		</button>
	</div>
}

export function ConfirmTransaction() {
	const currentPendingTransactionOrSignableMessage = useSignal<PendingTransactionOrSignableMessage | undefined>(undefined)
	const pendingTransactionsAndSignableMessages = useSignal<readonly PendingTransactionOrSignableMessage[]>([])
	const completeVisualizedSimulation = useSignal<CompleteVisualizedSimulation | undefined>(undefined)
	const forceSend = useSignal<boolean>(false)
	const currentBlockNumber = useSignal<undefined | bigint>(undefined)
	const modalState = useSignal<ModalState>({ page: 'noModal' })
	const rpcConnectionStatus = useSignal<RpcConnectionStatus>(undefined)
	const pendingTransactionAddedNotification = useSignal<boolean>(false)
	const unexpectedError = useSignal<undefined | UnexpectedErrorOccured>(undefined)
	const rpcEntries = useSignal<RpcEntries>([])

	console.log('ConfirmTransaction 2')

	const updatePendingTransactionsAndSignableMessages = (message: UpdateConfirmTransactionDialog) => {
		completeVisualizedSimulation.value = message.data.visualizedSimulatorState
		currentBlockNumber.value = message.data.currentBlockNumber
	}

	useEffect(() => {
		function popupMessageListener(msg: unknown) {
			const maybeParsed = MessageToPopup.safeParse(msg)
			if (!maybeParsed.success) return // not a message we are interested in
			const parsed = maybeParsed.value

			if (parsed.method === 'popup_settingsUpdated') {
				sendPopupMessageToBackgroundPage({ method: 'popup_requestSettings' })
				return
			}
			if (parsed.method === 'popup_requestSettingsReply') {
				rpcEntries.value = parsed.data.rpcEntries
				return
			}
			if (parsed.method === 'popup_UnexpectedErrorOccured') {
				unexpectedError.value = parsed
				return
			}
			if (parsed.method === 'popup_addressBookEntriesChanged') return refreshMetadata()
			if (parsed.method === 'popup_new_block_arrived') {
				rpcConnectionStatus.value = parsed.data.rpcConnectionStatus
				refreshSimulation()
				currentBlockNumber.value = parsed.data.rpcConnectionStatus?.latestBlock?.number
				return
			}
			if (parsed.method === 'popup_failed_to_get_block') {
				rpcConnectionStatus.value = parsed.data.rpcConnectionStatus
				return
			}
			if (parsed.method === 'popup_update_confirm_transaction_dialog') {
				updatePendingTransactionsAndSignableMessages(UpdateConfirmTransactionDialog.parse(parsed))
				return
			}
			if (parsed.method === 'popup_update_confirm_transaction_dialog_pending_transactions') {
				pendingTransactionsAndSignableMessages.value = parsed.data.pendingTransactionAndSignableMessages
				const firstMessage = parsed.data.pendingTransactionAndSignableMessages[0]
				if (firstMessage === undefined) throw new Error('message data was undefined')
				currentPendingTransactionOrSignableMessage.value = firstMessage
				if (firstMessage.type === 'Transaction' && (firstMessage.transactionOrMessageCreationStatus === 'Simulated' || firstMessage.transactionOrMessageCreationStatus === 'FailedToSimulate') && firstMessage.simulationResults !== undefined && firstMessage.simulationResults.statusCode === 'success' && (currentBlockNumber.value === undefined || firstMessage.simulationResults.data.simulationState.blockNumber > currentBlockNumber.value)) {
					currentBlockNumber.value = firstMessage.simulationResults.data.simulationState.blockNumber
				}
			}
			return
		}
		browser.runtime.onMessage.addListener(popupMessageListener)
		return () => browser.runtime.onMessage.removeListener(popupMessageListener)
	})

	useEffect(() => {
		sendPopupMessageToBackgroundPage({ method: 'popup_confirmTransactionReadyAndListening' })
		sendPopupMessageToBackgroundPage({ method: 'popup_requestSettings' })
	}, [])

	async function approve() {
		console.log('ConfirmTransaction.tsx: approve: 0')
		if (currentPendingTransactionOrSignableMessage.value === undefined) throw new Error('dialogState is not set')
		console.log('ConfirmTransaction.tsx: approve: 1')
		pendingTransactionAddedNotification.value = false
		console.log('ConfirmTransaction.tsx: approve: 2')
		const currentWindow = await browser.windows.getCurrent()
		console.log('ConfirmTransaction.tsx: approve: 3')
		checkAndThrowRuntimeLastError()
		console.log('ConfirmTransaction.tsx: approve: 4')
		if (currentWindow.id === undefined) throw new Error('could not get our own Id!')
		console.log('ConfirmTransaction.tsx: approve: 5')
		try {
			console.log('ConfirmTransaction.tsx: approve: 6')
			console.log('ConfirmTransaction.tsx: approve:', currentPendingTransactionOrSignableMessage.value.uniqueRequestIdentifier)
			await sendPopupMessageToBackgroundPage({ method: 'popup_confirmDialog', data: { uniqueRequestIdentifier: currentPendingTransactionOrSignableMessage.value.uniqueRequestIdentifier, action: 'accept' } })
		} catch (error) {
			console.warn('Failed to confirm transaction')
			// biome-ignore lint/suspicious/noConsoleLog: <Used for support debugging>
			console.log({ error })
			alert('Failed to approve transaction')
		}
	}

	async function reject() {
		if (currentPendingTransactionOrSignableMessage.value === undefined) throw new Error('dialogState is not set')
		pendingTransactionAddedNotification.value = false
		const currentWindow = await browser.windows.getCurrent()
		checkAndThrowRuntimeLastError()
		if (currentWindow.id === undefined) throw new Error('could not get our own Id!')
		if (pendingTransactionsAndSignableMessages.value.length === 1) await tryFocusingTabOrWindow({ type: 'tab', id: currentPendingTransactionOrSignableMessage.value.uniqueRequestIdentifier.requestSocket.tabId })

		const getPossibleErrorString = () => {
			const pending = currentPendingTransactionOrSignableMessage.value
			if (pending === undefined) return undefined
			if (pending.transactionOrMessageCreationStatus === 'FailedToSimulate') return pending.transactionToSimulate.error.message
			if (pending.transactionOrMessageCreationStatus !== 'Simulated') return undefined
			if (pending.type !== 'Transaction') return undefined
			if (pending.simulationResults.statusCode !== 'success') return undefined
			const results = pending.simulationResults.data.simulatedAndVisualizedTransactions.find((tx) => tx.transactionIdentifier === pending.transactionIdentifier)
			if (results === undefined) return undefined
			return results.statusCode === 'failure' ? results.error.message : undefined
		}

		await sendPopupMessageToBackgroundPage({
			method: 'popup_confirmDialog', data: {
				uniqueRequestIdentifier: currentPendingTransactionOrSignableMessage.value.uniqueRequestIdentifier,
				action: 'reject',
				errorString: getPossibleErrorString(),
			}
		})
	}

	const refreshMetadata = async () => {
		if (currentPendingTransactionOrSignableMessage === undefined) return
		await sendPopupMessageToBackgroundPage({ method: 'popup_refreshConfirmTransactionMetadata' })
	}
	const refreshSimulation = async () => {
		if (currentPendingTransactionOrSignableMessage === undefined) return
		await sendPopupMessageToBackgroundPage({ method: 'popup_refreshConfirmTransactionDialogSimulation' })
	}

	function renameAddressCallBack(entry: AddressBookEntry) {
		modalState.value = {
			page: 'modifyAddress',
			state: new Signal({
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
			})
		}
	}

	async function clearUnexpectedError() {
		unexpectedError.value = undefined
		await sendPopupMessageToBackgroundPage({ method: 'popup_clearUnexpectedError' })
	}

	if (currentPendingTransactionOrSignableMessage.value === undefined) {
		return <>
			<main>

			</main>
		</>
	}

	const underTransactions = useComputed(() => pendingTransactionsAndSignableMessages.value.slice(1).reverse())

	return (
		<main>
			<Hint>
				<div class={`modal ${modalState.value.page !== 'noModal' ? 'is-active' : ''}`}>
					{modalState.value.page === 'modifyAddress' ?
						<AddNewAddress
							setActiveAddressAndInformAboutIt={undefined}
							modifyAddressWindowState={modalState.value.state}
							close={() => { modalState.value = { page: 'noModal' } }}
							activeAddress={currentPendingTransactionOrSignableMessage.value?.activeAddress}
							rpcEntries={rpcEntries}
						/>
						: <></>}
				</div>
				<div class='block popup-block popup-block-scroll' style='padding: 0px'>
					<div style='position: sticky; top: 0; z-index: 1;'>
						<UnexpectedError close={clearUnexpectedError} unexpectedError={unexpectedError.value} />
						<NetworkErrors rpcConnectionStatus={rpcConnectionStatus} />
						<WebsiteErrors website={currentPendingTransactionOrSignableMessage.value.website} websiteSocket={currentPendingTransactionOrSignableMessage.value.uniqueRequestIdentifier.requestSocket} simulationMode={false} />
						<InvalidMessage pendingTransactionOrSignableMessage={currentPendingTransactionOrSignableMessage.value} />
					</div>
					<div class='popup-contents'>
						<div style='margin: 10px'>
							{currentPendingTransactionOrSignableMessage.value.originalRequestParameters.method === 'eth_sendRawTransaction' && currentPendingTransactionOrSignableMessage.value.type === 'Transaction'
								? <DinoSaysNotification
									text={`This transaction is signed already. No extra signing required to forward it to ${currentPendingTransactionOrSignableMessage.value.transactionOrMessageCreationStatus !== 'Simulated' || currentPendingTransactionOrSignableMessage.value.simulationResults.statusCode === 'failed' ?
										'network' :
										currentPendingTransactionOrSignableMessage.value.simulationResults.data.simulationState.rpcNetwork.name}.`}
									close={() => { pendingTransactionAddedNotification.value = false }}
								/>
								: <></>
							}
							{pendingTransactionAddedNotification.value === true
								? <DinoSaysNotification
									text={`Hey! A new transaction request was queued. Accept or Reject the previous transaction${pendingTransactionsAndSignableMessages.value.length > 1 ? 's' : ''} to see the new one.`}
									close={() => { pendingTransactionAddedNotification.value = false }}
								/>
								: <></>
							}
							<TransactionNames completeVisualizedSimulation={completeVisualizedSimulation.value} currentPendingTransaction={currentPendingTransactionOrSignableMessage.value} />
							<UnderTransactions pendingTransactionsAndSignableMessages={underTransactions.value} />
							<div style={`top: ${underTransactions.value.length * -HALF_HEADER_HEIGHT}px`}></div>
							{currentPendingTransactionOrSignableMessage.value.type === 'Transaction' ?
								<TransactionCard
									pendingTransactionsAndSignableMessages={pendingTransactionsAndSignableMessages.value}
									renameAddressCallBack={renameAddressCallBack}
									currentBlockNumber={currentBlockNumber.value}
									rpcConnectionStatus={rpcConnectionStatus}
									numberOfUnderTransactions={underTransactions.value.length}
								/>
								: <>

								</>}
						</div>
						<nav class='window-footer popup-button-row' style='position: sticky; bottom: 0; width: 100%;'>
							<CheckBoxes currentPendingTransactionOrSignableMessage={currentPendingTransactionOrSignableMessage.value} forceSend={forceSend} />
							<Buttons
								currentPendingTransactionOrSignableMessage={currentPendingTransactionOrSignableMessage.value}
								reject={reject}
								approve={approve}
							/>
						</nav>
					</div>
				</div>
			</Hint>
		</main>
	)
}
