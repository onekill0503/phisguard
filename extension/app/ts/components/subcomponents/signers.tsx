import { SignerName } from '../../types/signerTypes.js'
import { BRAVE_LOGO, COINBASEWALLET_LOGO, METAMASK_LOGO } from '../../utils/constants.js'

const signerLogos = {
	MetaMask: METAMASK_LOGO,
	Brave: BRAVE_LOGO,
	CoinbaseWallet: COINBASEWALLET_LOGO,
}

export function getPrettySignerName(signerName: SignerName) {
	if (signerName === 'NoSigner' || signerName === 'NotRecognizedSigner' || signerName === 'NoSignerDetected') return 'Unknown signer'
	return signerName
}

export function getSignerLogo(signerName: SignerName) {
	if (signerName === 'NoSigner' || signerName === 'NotRecognizedSigner' || signerName === 'NoSignerDetected') return undefined
	return signerLogos[signerName]
}

export function SignerLogoText(param: { text: string }) {
	return <p style = 'line-height: 24px; display: inline-block;'>
		{ param.text }
	</p>
}

export function SignersLogoName(param: { signerName: SignerName }) {
	return <SignerLogoText text = { getPrettySignerName(param.signerName) }/>
}
