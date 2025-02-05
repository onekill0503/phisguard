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
      'You are profesionnal Ethereum user and developer, you have high knowledge about phising transaction pattern and solidity code. you are helpful assistent to remind user about phising transaction.',
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
