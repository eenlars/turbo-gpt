import { ProxyAgent, fetch } from 'undici'
import { generatePayload, parseOpenAIStream } from '@/utils/openAI'
import { verifySignature } from '@/utils/auth'
// #vercel-disable-blocks
import type { ChatMessage } from '@/types'
import type { APIRoute } from 'astro'
// #vercel-end

const apiKey = import.meta.env.OPENAI_API_KEY
const httpsProxy = import.meta.env.HTTPS_PROXY
const baseUrl = (
	import.meta.env.OPENAI_API_BASE_URL || 'https://api.openai.com'
)
	.trim()
	.replace(/\/$/, '')
const sitePassword = import.meta.env.SITE_PASSWORD

export interface PostMessage {
	sign: string
	time: number
	messages: ChatMessage[]
	pass: string
	temperature: number
}

export const post: APIRoute = async (context) => {
	const body = await context.request.json()
	const { sign, time, messages, pass, temperature }: PostMessage = body
	if (!messages) return new Response('No input text')

	if (sitePassword && sitePassword !== pass)
		return new Response('Invalid password')

	if (
		import.meta.env.PROD &&
		!(await verifySignature(
			{ t: time, m: messages?.[messages.length - 1]?.content || '' },
			sign
		))
	)
		return new Response('Invalid signature')

	const temp: number =
		temperature && temperature >= 0 && temperature <= 100
			? Number((temperature / 100) * 2)
			: 0.6

	const initOptions = generatePayload(apiKey, messages, temp)
	// #vercel-disable-blocks
	if (httpsProxy) initOptions.dispatcher = new ProxyAgent(httpsProxy)

	// #vercel-end

	// @ts-expect-error jdsfkl
	const response = (await fetch(
		`${baseUrl}/v1/chat/completions`,
		initOptions
	)) as Response

	return new Response(parseOpenAIStream(response))
}
