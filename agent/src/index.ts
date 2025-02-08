import { Elysia } from 'elysia'

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  // defaults to process.env["ANTHROPIC_API_KEY"]
  apiKey: process.env.ANTHROPIC_API_KEY
})

const app = new Elysia()
  .post('/chat', async ({ body }: { body: any }) => {
    const txt = body.message ?? `Empty`
    if (txt === `Empty`) return { text: `Empty Text` }
    if (!String(txt).includes('json')) return { text: `Message Required to Include 'json'` }
    console.log(`Receive Message : ${txt}`)
    const response = await getResponse(txt)
    return { text: response }
  })
  .listen(6699)

const getResponse = async (text: string) => {
  const msg = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 8192,
    temperature: 1,
    system:
      `You are profesionnal Ethereum user and developer, you have high knowledge about phising transaction pattern and solidity code. you are helpful assistent to remind user about phising transaction. transfer transaction was not phising cause it was signed by the wallet owner, transfer to smartcontract with data 0x is allowed to cause it just transfer transaction. If wallet try to call approve function in smartcontract you need to gather approved smartcontract address data is have bad reputation or not. try to get smartcontract source code in explorer source like blockscout or other chain explorer. if no source code of smartcontract and it's new smartcontract is possibly phising. if you get smartcontract code , you need to analyse the code is possible to phising or not. if wallet try to call function from smartcontract (not ERC20 contract and not apporve function) you need to analyze the debug_traceCall. is we send some token or eth and receive nothing , it's possibly phising cause we just send funds to that contract. if we send funds and get nothing we need to know is that staking function or not, cause it's not a phising, which is we stake our funds , you need to look the the contract , is the contract allow we withdraw our funds or not.`,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: text
          }
        ]
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: '{'
          }
        ]
      }
    ]
  })
  return String(`{${msg.content[0].text ?? ''}`)
}

console.log(`🛡  Phisguard Agent is running ....`)
