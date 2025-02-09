import { useEffect, useState } from 'preact/hooks'
import { sendPopupMessageToBackgroundPage } from '../../background/backgroundUtils.js'
import { AddressBookEntries, AddressBookEntry } from '../../types/addressBookTypes.js'
import { FirstCardParams, HomeParams, TabIconDetails, TabState } from '../../types/user-interface-types.js'
import { DEFAULT_TAB_CONNECTION, ICON_NOT_ACTIVE } from '../../utils/constants.js'
import { ActiveAddressComponent, getActiveAddressEntry } from '../subcomponents/address.js'
import { RpcSelector } from '../subcomponents/ChainSelector.js'
import { DinoSays } from '../subcomponents/DinoSays.js'
import { ErrorComponent } from '../subcomponents/Error.js'
import { getPrettySignerName, SignerLogoText } from '../subcomponents/signers.js'

export interface TransactionResponse {
	data: TransactionData
}

export interface TransactionData {
	transactions: Transactions
}

export interface Transactions {
	items: Transaction[]
}

export interface Transaction {
	data: string
	from: string
	id: string
	message: string
	status: boolean
	taskIndex: string
	to: string
	value: string
	blockTimestamp: string
}


type SignerExplanationParams = {
	activeAddress: AddressBookEntry | undefined
	tabState: TabState | undefined
	useSignersAddressAsActiveAddress: boolean
}

function SignerExplanation(param: SignerExplanationParams) {
	if (param.activeAddress !== undefined || param.tabState === undefined || param.tabState.signerAccountError !== undefined) return <></>
	if (!param.tabState.signerConnected) {
		if (param.tabState.signerName === 'NoSignerDetected' || param.tabState.signerName === 'NoSigner') return <ErrorComponent text='No signer installed. You need to install a signer, eg. Metamask.' />
		return <ErrorComponent text='The page you are looking at has NOT CONNECTED to a wallet.' />
	}
	return <ErrorComponent text={`No account connected (or wallet is locked) in ${param.tabState.signerName === 'NoSigner' ? 'signer' : getPrettySignerName(param.tabState.signerName)}.`} />
}

function FirstCard(param: FirstCardParams) {
	if (param.tabState?.signerName === 'NoSigner') {
		return <>
			{/* <header class='px-3 py-2' style={{ display: 'grid', gridTemplateColumns: 'max-content max-content minmax(0, 1fr)', columnGap: '1rem', alignItems: 'center' }}>
				<div style='margin-left: auto'>
					<RpcSelector rpcEntries={param.rpcEntries} rpcNetwork={param.rpcNetwork} changeRpc={param.changeActiveRpc} />
				</div>
			</header> */}
			<h3 class='has-text-weight-bold' style='margin-left: 10px'>
				Active Account
			</h3>
			<section class='card' style='margin: 10px;'>
				<div class='card-content'>
					<DinoSays text={'No signer connnected. You can use Interceptor in simulation mode without a signer, but signing mode requires a browser wallet.'} />
				</div>
			</section>
		</>
	}

	return <>
		<div class='is-flex is-justify-content-flex-end' style={{ marginRight: '10px' }}>
			<RpcSelector rpcEntries={param.rpcEntries} rpcNetwork={param.rpcNetwork} changeRpc={param.changeActiveRpc} />
		</div>
		<h3 class='has-text-weight-bold' style='margin-left: 10px'>
			Active Account
		</h3>
		<section class='card' style='margin: 10px;'>
			<div class='card-content'>
				{param.useSignersAddressAsActiveAddress ?
					<p style='color: var(--text-color); text-align: left; padding-bottom: 10px'>
						{param.tabState?.signerConnected ? <span style='float: right; color: var(--primary-color);'>CONNECTED</span> : <span style='float: right; color: var(--negative-color);'>NOT CONNECTED</span>}
					</p>
					: <></>
				}

				<ActiveAddressComponent
					activeAddress={param.activeAddress}
					buttonText={'Change'}
					changeActiveAddress={param.changeActiveAddress}
					renameAddressCallBack={param.renameAddressCallBack}
					disableButton={false}
				/>
				{(param.tabState?.signerAccounts.length === 0 && param.tabIconDetails.icon !== ICON_NOT_ACTIVE) ?
					<div style='margin-top: 5px'>
						<button className='button is-primary' onClick={() => sendPopupMessageToBackgroundPage({ method: 'popup_requestAccountsFromSigner', data: true })} >
							<SignerLogoText
								text={`Connect to Wallet`}
							/>
						</button>
					</div>
					: <></>
				}
			</div>
		</section>

		<SignerExplanation
			activeAddress={param.activeAddress}
			tabState={param.tabState}
			useSignersAddressAsActiveAddress={param.useSignersAddressAsActiveAddress}
		/>
	</>
}

export function Home(param: HomeParams) {
	const [activeSigningAddress, setActiveSigningAddress] = useState<AddressBookEntry | undefined>(undefined)
	const [useSignersAddressAsActiveAddress, setUseSignersAddressAsActiveAddress] = useState(false)
	const [tabIconDetails, setTabConnection] = useState<TabIconDetails>(DEFAULT_TAB_CONNECTION)
	const [tabState, setTabState] = useState<TabState | undefined>(undefined)
	const [isLoaded, setLoaded] = useState<boolean>(false)
	const [activeAddresses, setActiveAddresses] = useState<AddressBookEntries>([])
	const [transactions, setTransactions] = useState<TransactionResponse | undefined>(undefined)

	useEffect(() => {
		setUseSignersAddressAsActiveAddress(param.useSignersAddressAsActiveAddress)
		setActiveSigningAddress(param.activeSigningAddress !== undefined ? getActiveAddressEntry(param.activeSigningAddress, param.activeAddresses) : undefined)
		setTabConnection(param.tabIconDetails)
		setTabState(param.tabState)
		setActiveAddresses(param.activeAddresses)
		setLoaded(true)
	}, [param.activeSigningAddress,
	param.tabState,
	param.activeAddresses,
	param.useSignersAddressAsActiveAddress,
	param.rpcNetwork.value,
	param.tabIconDetails,
	param.currentBlockNumber,
	param.simVisResults,
	param.rpcConnectionStatus,
	param.simulationUpdatingState,
	param.simulationResultState,
	])

	if (!isLoaded || param.rpcNetwork.value === undefined) return <> </>

	const formatAddress = (address: string) => {
		return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
	};

	const weiToEth = (wei: string) => {
		return parseFloat(wei) / 1e18;
	};

	const formatTimestamp = (timestamp: number) => {
		return new Date(timestamp * 1000).toLocaleString();
	};


	const fetchTransaction = async () => {
		const query = `
		query getLastTransaction {
		  transactions(
		    orderDirection: "DESC"
		    orderBy: "taskIndex"
		    limit: 10
		    where: {from: "0x1dBC89Ef233899EeB4819f71D1007877A13163B4"}
		  ) {
		    items {
		      data
		      from
		      id
		      message
		      status
		      taskIndex
		      to
		      value
		      blockTimestamp
		    }
		  }
		}
	  `;

		const response = await fetch('https://smart-indexer.alwaysbedream.dev/', {
			method: 'POST',
			headers: {
				'Origin': 'https://smart-explorer.alwaysbedream.dev',
				'Referer': 'https://smart-explorer.alwaysbedream.dev/',
				'accept': 'application/graphql-response+json, application/json',
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				query,
				operationName: "getLastTransaction"
			})
		});

		setTransactions(await response.json())
	};

	useEffect(() => {
		fetchTransaction()

		const intervalId = setInterval(() => {
			fetchTransaction()
		}, 3000)

		return () => clearInterval(intervalId)
	}, [])

	return <>
		{param.rpcNetwork.value.httpsRpc === undefined ?
			<ErrorComponent text={`${param.rpcNetwork.value.name} is not a supported network. PhisGuard is disabled while you are using ${param.rpcNetwork.value.name}.`} />
			: <></>}

		<FirstCard
			activeAddresses={activeAddresses}
			useSignersAddressAsActiveAddress={useSignersAddressAsActiveAddress}
			activeAddress={activeSigningAddress}
			rpcNetwork={param.rpcNetwork}
			changeActiveRpc={param.setActiveRpcAndInformAboutIt}
			changeActiveAddress={param.changeActiveAddress}
			tabState={tabState}
			tabIconDetails={tabIconDetails}
			renameAddressCallBack={param.renameAddressCallBack}
			rpcEntries={param.rpcEntries}
			simulationMode={false}
			enableSimulationMode={() => { }}
		/>

		<div className="card mt-6">
			<header className="card-header">
				<p className="card-header-title">
					Recent Transactions
				</p>
			</header>
			<div className="card-content">
				<div className="content">
					{transactions?.data.transactions.items.map((tx) => (
						<div className="mb-5">
							<div key={tx.id} className="box">
								<div className="columns is-multiline">
									<div className="column is-12">
										<p className="is-size-7 has-text-grey mb-2">
											{formatTimestamp(Number(tx.blockTimestamp))}
										</p>
									</div>
									<div className="column is-6">
										<p className="is-size-7">To:</p>
										<p className="has-text-info">{formatAddress(tx.to)}</p>
									</div>
									<div className="column is-12">
										<p className="is-size-7">Value:</p>
										<p className="has-text-success">
											{weiToEth(tx.value)} ETH
										</p>
									</div>
									<div className="column is-12">
										<span className={`tag ${tx.status ? 'is-success' : 'is-danger'}`}>
											{tx.status ? 'Safe' : 'Not Safe'}
										</span>
									</div>
								</div>
								<div className="is-flex is-justify-content-flex-end mt-3">
									<a href={`https://smart-explorer.alwaysbedream.dev/tx/${tx.taskIndex}`} 
										target='_blank' 
										className="button is-small is-primary">
										View Details
									</a>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	</>
}
