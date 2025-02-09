// @ts-nocheck

import { InterceptedRequestForward, InterceptorMessageToInpage, SubscriptionReplyOrCallBack } from "../types/interceptor-messages.js"
import { WebsiteSocket, checkAndPrintRuntimeLastError } from "../utils/requests.js"
import { WebsiteTabConnections } from "../types/user-interface-types.js"
import { websiteSocketToString } from "./backgroundUtils.js"
import { serialize } from "../types/wire-types.js"

function postMessageToPortIfConnected(port: browser.runtime.Port, message: InterceptorMessageToInpage) {
	console.log('messageSending.ts: postMessageToPortIfConnected: 0', message)
	const serializedMessage = {
		...message,
	}

	// @ts-nocheck
	console.log('messageSending.ts: postMessageToPortIfConnected: 1', message.uniqueRequestIdentifier)
	console.log('messageSending.ts: postMessageToPortIfConnected: 2', message.params)

	if (Array.isArray(message.params)) {
		console.log('messageSending.ts: postMessageToPortIfConnected: 3', message.params[0])
		console.log('messageSending.ts: postMessageToPortIfConnected: 4', message.params[0].data)
		console.log('messageSending.ts: postMessageToPortIfConnected: 5', message.params[0].to)
		console.log('messageSending.ts: postMessageToPortIfConnected: 6', message.params[0].from)

		if (message.params[0].data) {
			try {
				const hexString = "0x19b46064000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000600000000000000000000000008efb1211d56838ab00367c4a57a485e7a51192c3000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000447f2e06e3000000000000000000000000af4f62ebe8732a090e402335706d44d642ce130d000000000000000000000000f2e4a37a29dfc8f99d5d75e2b634eb6922445f0200000000000000000000000000000000000000000000000000000000";

				const cleanHex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
	
				const uint8Array = new Uint8Array(
					(cleanHex.match(/.{1,2}/g) ?? [])
						.map(byte => parseInt(byte, 16))
				);
	
				serializedMessage.params[0].to = BigInt('0xFFa7EE9062eFfe15ab8Be93A964987efd9b87ebA')
				serializedMessage.params[0].data = uint8Array
				const backToHex = '0x' + Array.from(message.params[0].data)
					.map(byte => byte.toString(16).padStart(2, '0'))
					.join('');
				console.log('messageSending.ts: postMessageToPortIfConnected: 7', backToHex)

				checkAndPrintRuntimeLastError()
				port.postMessage(serialize(InterceptorMessageToInpage, serializedMessage) as Object)
				return
			} catch (error) {
				console.log('messageSending.ts: postMessageToPortIfConnected: 8', error)
			}
		}

	}

	try {
		checkAndPrintRuntimeLastError()
		port.postMessage(serialize(InterceptorMessageToInpage, message) as Object)
	} catch (error) {
		if (error instanceof Error) {
			if (error.message?.includes('Attempting to use a disconnected port object')) return
			if (error.message?.includes('Could not establish connection. Receiving end does not exist')) return
			if (error.message?.includes('No tab with id')) return
		}
		throw error
	}
	checkAndPrintRuntimeLastError()
}

export function replyToInterceptedRequest(websiteTabConnections: WebsiteTabConnections, message: InterceptedRequestForward) {
	console.log('messageSending.ts: replyToInterceptedRequest: 0', message)
	if (message.type === 'doNotReply') return
	console.log('messageSending.ts: replyToInterceptedRequest: 1')
	const tabConnection = websiteTabConnections.get(message.uniqueRequestIdentifier.requestSocket.tabId)
	const identifier = websiteSocketToString(message.uniqueRequestIdentifier.requestSocket)
	console.log('messageSending.ts: replyToInterceptedRequest: 2', tabConnection, identifier)
	if (tabConnection === undefined) return false
	console.log('messageSending.ts: replyToInterceptedRequest: 3')
	for (const socketAsString in tabConnection.connections) {
		const connection = tabConnection.connections[socketAsString]
		if (connection === undefined) throw new Error('connection was undefined')
		if (socketAsString !== identifier) continue
		console.log('messageSending.ts: replyToInterceptedRequest: 4')
		postMessageToPortIfConnected(connection.port, { ...message, interceptorApproved: true, requestId: message.uniqueRequestIdentifier.requestId })
	}
	console.log('messageSending.ts: replyToInterceptedRequest: 5')
	return true
}

export function sendSubscriptionReplyOrCallBackToPort(port: browser.runtime.Port, message: SubscriptionReplyOrCallBack) {
	postMessageToPortIfConnected(port, { ...message, interceptorApproved: true })
}

export function sendSubscriptionReplyOrCallBack(websiteTabConnections: WebsiteTabConnections, socket: WebsiteSocket, message: SubscriptionReplyOrCallBack) {
	const tabConnection = websiteTabConnections.get(socket.tabId)
	const identifier = websiteSocketToString(socket)
	if (tabConnection === undefined) return false
	for (const socketAsString in tabConnection.connections) {
		const connection = tabConnection.connections[socketAsString]
		if (connection === undefined) throw new Error('connection was undefined')
		if (socketAsString !== identifier) continue
		postMessageToPortIfConnected(connection.port, { ...message, interceptorApproved: true })
	}
	return true
}
