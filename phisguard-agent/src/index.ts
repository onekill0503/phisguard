import { Elysia } from "elysia";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = new Elysia()
  .post("/chat", async ({ body } : { body: any } ) => {
    console.log(body)
    const txt = body.message ?? `Empty`;
    if(txt === `Empty`) return {text: `Empty Text`};
    if(!String(txt).includes("json")) return { text: `Message Required to Include 'json'` };
    console.log(`Receive Message : ${txt}`);
    const response = await getResponse(txt);
    return {text: response};
  }).listen(6699);

const getResponse = async (text: string) => {
  
const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        "role": "system",
        "content": [
          {
            "type": "text",
            "text": "You are profesionnal Ethereum user and developer, you have high knowledge about phising transaction pattern and solidity code. you are helpful assistent to remind user about phising transaction."
          }
        ]
      },
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": text
          }
        ]
      }
    ],
    response_format: {
      "type": "json_object"
    },
    temperature: 1,
    max_completion_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  });
  return response.choices[0].message.content;
};

console.log(
  `🛡  Phisguard Agent is running ....`
);
