
import { ChangeActiveAddressParam } from '../../types/user-interface-types.js'
import { BigAddress } from '../subcomponents/address.js'
import { XMarkIcon } from '../subcomponents/icons.js'
import { getPrettySignerName, SignerLogoText } from '../subcomponents/signers.js'

export function ChangeActiveAddress(param: ChangeActiveAddressParam) {
	function changeAndStoreActiveAddress(activeAddress: bigint | 'signer') {
		param.close()
		param.setActiveAddressAndInformAboutIt(activeAddress)
	}

	function getSignerAccount() {
		if (param.signerAccounts !== undefined && param.signerAccounts.length > 0) {
			return param.signerAccounts[0]
		}
		return undefined
	}

	function isSignerConnected(address: bigint) {
		return address !== undefined && getSignerAccount() === address
	}

	function changePageToAddAddress() {
		param.addNewAddress()
	}

	return (<>
		<div class='modal-background'> </div>
		<div class='modal-card' style='height: 100%;'>
			<header class='modal-card-head card-header interceptor-modal-head window-header'>
				<div class='card-header-title'>
					<p className='paragraph'>
						Change Active Address
					</p>
				</div>
				<button class='card-header-icon' aria-label='close' onClick={param.close}>
					<XMarkIcon />
				</button>
			</header>
			<section class='modal-card-body'>
				<ul>
					{param.activeAddresses === undefined
						? <></>
						: param.activeAddresses.map((activeAddress) => (
							<li>
								<div class='card hoverable' onClick={() => { changeAndStoreActiveAddress(activeAddress.address) }}>
									<div class='card-content hoverable ' style='cursor: pointer;'>
										<BigAddress
											addressBookEntry={activeAddress}
											noCopying={true}
											noEditAddress={true}
											renameAddressCallBack={param.renameAddressCallBack}
										/>
										{isSignerConnected(activeAddress.address) ?
											<div class='content' style='color: var(--text-color)'>
												<SignerLogoText text={` ${getPrettySignerName(param.signerName)} connected`} />
											</div> : <></>
										}
									</div>
								</div>
							</li>
						))
					}

				</ul>
			</section>
			<footer class='modal-card-foot window-footer' style='border-bottom-left-radius: unset; border-bottom-right-radius: unset; border-top: unset; padding: 10px;'>
				<button class='button is-primary' onClick={changePageToAddAddress} style='width: 100%'>
					Add New Address
					<span class="icon">
						<i class="fas fa-plus"></i>
					</span>
				</button>
			</footer>
		</div>
	</>)

}
