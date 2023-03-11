import type { ChatMessage } from '@/types';
import { createSignal, Index, Show, createEffect } from 'solid-js';
import IconClear from './icons/Clear';
import MessageItem from './MessageItem';
import SystemRoleSettings from './SystemRoleSettings';
import _ from 'lodash';
import { generateSignature } from '@/utils/auth';
import { System } from './SystemRoleSettings';
import { PostMessage } from '@/pages/api/generate';

export default () => {
	let inputRef: HTMLTextAreaElement;
	const [currentSystemRoleSettings, setCurrentSystemRoleSettings] =
		createSignal<System>({ settings: '' });
	const [systemRoleEditing, setSystemRoleEditing] = createSignal(false);
	const [systemRoleSaveEditing, setSystemRoleSaveEditing] = createSignal(false);
	const [temperature, setTemperature] = createSignal<number>(30);
	const [messageList, setMessageList] = createSignal<ChatMessage[]>([]);
	const [currentAssistantMessage, setCurrentAssistantMessage] =
		createSignal('');
	const [loading, setLoading] = createSignal(false);
	const [controller, setController] = createSignal<AbortController>(null);

	createEffect(() => {
		const storedValue =
			(JSON.parse(localStorage.getItem('temp') || '') as number) || 30;
		setTemperature(Number(storedValue));
	});

	const handleButtonClick = async () => {
		const inputValue = inputRef.value;
		if (!inputValue) {
			return;
		}
		// @ts-ignore
		//if (window?.umami) umami.trackEvent('chat_generate');
		inputRef.value = '';
		setMessageList([
			...messageList(),
			{
				role: 'user',
				content: inputValue,
			},
		]);
		requestWithLatestMessage();
	};
	const throttle = _.throttle(
		function () {
			window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
		},
		300,
		{
			leading: true,
			trailing: false,
		}
	);
	const requestWithLatestMessage = async () => {
		setLoading(true);
		setCurrentAssistantMessage('');
		const storagePassword = localStorage.getItem('pass');
		try {
			const controller = new AbortController();
			setController(controller);
			const requestMessageList = [...messageList()];
			if (currentSystemRoleSettings().settings) {
				requestMessageList.unshift({
					role: 'system',
					content: currentSystemRoleSettings().settings,
				});
			}
			const timestamp = Date.now();
			const response = await fetch('/api/generate', {
				method: 'POST',
				body: JSON.stringify({
					messages: requestMessageList,
					time: timestamp,
					pass: storagePassword,
					temperature: temperature(),
					sign: await generateSignature({
						t: timestamp,
						m:
							requestMessageList?.[requestMessageList.length - 1]?.content ||
							'',
					}),
				} as PostMessage),
				signal: controller.signal,
			});
			if (!response.ok) {
				throw new Error(response.statusText);
			}
			const data = response.body;
			if (!data) {
				throw new Error('No data');
			}
			const reader = data.getReader();
			const decoder = new TextDecoder('utf-8');
			let done = false;

			while (!done) {
				const { value, done: readerDone } = await reader.read();
				if (value) {
					let char = decoder.decode(value);
					if (char === '\n' && currentAssistantMessage().endsWith('\n')) {
						continue;
					}
					if (char) {
						setCurrentAssistantMessage(currentAssistantMessage() + char);
					}
					//throttle();
				}
				done = readerDone;
			}
		} catch (e) {
			console.error(e);
			setLoading(false);
			setController(null);
			return;
		}
		archiveCurrentMessage();
	};

	const archiveCurrentMessage = () => {
		if (currentAssistantMessage()) {
			setMessageList([
				...messageList(),
				{
					role: 'assistant',
					content: currentAssistantMessage(),
				},
			]);
			setCurrentAssistantMessage('');
			setLoading(false);
			setController(null);
			inputRef.focus();
		}
	};

	const clear = () => {
		inputRef.value = '';
		inputRef.style.height = 'auto';
		setMessageList([]);
		setCurrentAssistantMessage('');
		setCurrentSystemRoleSettings({ settings: '' });
	};

	const stopStreamFetch = () => {
		if (controller()) {
			controller().abort();
			archiveCurrentMessage();
		}
	};

	const retryLastFetch = () => {
		if (messageList().length > 0) {
			const lastMessage = messageList()[messageList().length - 1];
			console.log(lastMessage);
			if (lastMessage.role === 'assistant') {
				setMessageList(messageList().slice(0, -1));
				requestWithLatestMessage();
			}
		}
	};

	const handleKeydown = (e: KeyboardEvent) => {
		if (e.isComposing || e.shiftKey) {
			return;
		}
		if (e.key === 'Enter') {
			handleButtonClick();
		}
	};

	return (
		<div my-6>
			<SystemRoleSettings
				canEdit={() => messageList().length === 0}
				systemRoleEditing={systemRoleEditing}
				setSystemRoleEditing={setSystemRoleEditing}
				systemRoleSaveEditing={systemRoleSaveEditing}
				setSystemRoleSaveEditing={setSystemRoleSaveEditing}
				currentSystemRoleSettings={currentSystemRoleSettings}
				setCurrentSystemRoleSettings={setCurrentSystemRoleSettings}
				temperature={temperature}
				setTemperature={setTemperature}
			/>
			<Index each={messageList()}>
				{(message, index) => (
					<MessageItem
						role={message().role}
						message={message().content}
						showRetry={() =>
							message().role === 'assistant' &&
							index === messageList().length - 1
						}
						onRetry={retryLastFetch}
					/>
				)}
			</Index>
			<Show when={loading()}>
				<div
					class='px-2 py-0.5 border border-slate rounded-md text-sm op-70 cursor-pointer hover:bg-slate/10'
					onClick={stopStreamFetch}
				>
					Stop
				</div>
			</Show>
			{currentAssistantMessage() && (
				<MessageItem role='assistant' message={currentAssistantMessage} />
			)}
			<Show
				when={!loading()}
				fallback={() => (
					<div class='h-12 my-4 flex gap-4 items-center justify-center bg-slate bg-op-15 rounded-sm'>
						<span>AI is thinking...</span>
						<div
							class='px-2 py-0.5 border border-slate rounded-md text-sm op-70 cursor-pointer hover:bg-slate/10'
							onClick={stopStreamFetch}
						>
							Stop
						</div>
					</div>
				)}
			>
				<div
					class='my-4 flex flex-col gap-2 transition-opacity'
					class:op-50={systemRoleEditing()}
				>
					<textarea
						ref={inputRef!}
						disabled={systemRoleEditing()}
						onKeyDown={handleKeydown}
						placeholder='Enter something...'
						autocomplete='off'
						autofocus
						onInput={() => {
							inputRef.style.height = 'auto';
							inputRef.style.height = inputRef.scrollHeight + 'px';
						}}
						rows='1'
						w-full
						px-3
						py-3
						min-h-12
						max-h-48
						rounded-sm
						bg-slate
						bg-op-15
						resize-none
						focus:bg-op-20
						focus:ring-0
						focus:outline-none
						placeholder:op-50
						dark='placeholder:op-30'
						scroll-pa-8px
					/>
					<div class='my-4 flex items-start gap-2 transition-opacity'>
						<button
							onClick={handleButtonClick}
							disabled={systemRoleEditing()}
							h-12
							px-4
							py-2
							w-full
							bg-slate
							bg-op-15
							hover:bg-op-20
							rounded-sm
						>
							Send
						</button>
						<button
							title='Clear'
							onClick={clear}
							disabled={systemRoleEditing()}
							h-12
							px-4
							py-2
							bg-slate
							bg-op-15
							hover:bg-op-20
							rounded-sm
						>
							<IconClear />
						</button>
					</div>
				</div>
			</Show>
		</div>
	);
};
