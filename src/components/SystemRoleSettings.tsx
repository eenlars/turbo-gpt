import { Show, onMount, createSignal } from 'solid-js';
import type { Accessor, Setter } from 'solid-js';
import IconEnv from './icons/Env';

interface Props {
	canEdit: Accessor<boolean>;
	systemRoleEditing: Accessor<boolean>;
	setSystemRoleEditing: Setter<boolean>;
	systemRoleSaveEditing: Accessor<boolean>;
	setSystemRoleSaveEditing: Setter<boolean>;
	currentSystemRoleSettings: Accessor<System>;
	setCurrentSystemRoleSettings: Setter<System>;
}

export type System = { name?: string; settings: string };

export default (props: Props) => {
	let systemInputRef: HTMLTextAreaElement;
	let systemInputRef2: HTMLTextAreaElement;
	const [systems, setSystems] = createSignal<System[]>([]);

	const getSystems = () => {
		try {
			const storedValue =
				(JSON.parse(localStorage.getItem('systems') || '') as System[]) || [];
			return setSystems(storedValue);
		} catch (error) {
			console.error(error);
			return [];
		}
	};

	onMount(() => getSystems());

	const handleSetSystem = () => {
		props.setCurrentSystemRoleSettings({ settings: systemInputRef.value });
		props.setSystemRoleEditing(false);
	};

	const saveSystem = () => {
		if (systemInputRef2.value?.length < 1 || systemInputRef.value?.length < 1) return

		const system: System = {
			name: systemInputRef2.value,
			settings: systemInputRef.value,
		};

		props.setCurrentSystemRoleSettings(system);

		const index = systems().findIndex((s) => s.name === system.name);

		if (index !== -1) {
			systems[index] = system;
		} else {
			systems().push(system);
		}

		localStorage.setItem('systems', JSON.stringify(systems()));
		getSystems();
		props.setSystemRoleSaveEditing(false);
	};

	const handleButtonClickDelete = () => {
		const systemSettings = props.currentSystemRoleSettings();
		const updatedSystems = systems().filter(
			(system: System) => system.settings !== systemSettings.settings
		);
		localStorage.setItem('systems', JSON.stringify(updatedSystems));
		setSystems(updatedSystems);
		props.setSystemRoleEditing(true);
	};

	const handleSystemSelect = (system: System) => {
		props.setCurrentSystemRoleSettings({
			settings: system.settings,
			name: system.name,
		});
		props.setSystemRoleEditing(false);
	};

	const handleCancelSystemEdit = () => {
		props.setCurrentSystemRoleSettings({
			settings: isFromMemory()
				? ''
				: props.currentSystemRoleSettings().settings,
		});
		props.setSystemRoleEditing(false);
	};

	const isFromMemory = () => {
		return props.currentSystemRoleSettings().name?.length > 0;
	};

	return (
		<div class='my-4'>
			<div class='flex flex-row items-center gap-1 op-50 dark:op-60'>
				<Show
					when={
						props.canEdit() && (isFromMemory() || !props.systemRoleEditing())
					}
				>
					<span
						onClick={() =>
							props.setSystemRoleEditing(!props.systemRoleEditing())
						}
						class='inline-flex items-center justify-center gap-1 text-sm bg-slate/20 px-2 py-1 mr-4 rounded-md transition-colors cursor-pointer hover:bg-slate/50'
					>
						<IconEnv />
						<span>Add System Role</span>
					</span>
				</Show>
				<Show when={systems().length > 0}>
					<div class='flex flex-row items-center gap-1 op-50 dark:op-60'>
						{systems().map((system: System) => (
							<button
								class='inline-flex items-center justify-center gap-1 text-sm bg-slate/20 px-2 py-1 mr-2 my-2 transition-colors cursor-pointer hover:bg-slate/50'
								onClick={() => handleSystemSelect(system)}
								disabled={props.systemRoleSaveEditing()}
							>
								{system.name}
							</button>
						))}
					</div>
				</Show>
			</div>
			<Show when={!props.systemRoleEditing()}>
				<Show when={props.currentSystemRoleSettings().settings}>
					<div>
						<div class='flex items-center gap-1 op-50 dark:op-60'>
							<span>System Role:</span>
						</div>
						<div class='mt-1'>{props.currentSystemRoleSettings().settings}</div>
					</div>

					<Show
						when={
							!props.systemRoleSaveEditing() &&
							!props.currentSystemRoleSettings().name
						}
					>
						<span
							onClick={() =>
								props.setSystemRoleSaveEditing(!props.systemRoleSaveEditing())
							}
							class='inline-flex items-center justify-center gap-1 text-sm bg-slate/20 px-2 py-1 mt-2 mb-6 mr-1 transition-colors cursor-pointer hover:bg-slate/50'
						>
							<span>Save</span>
						</span>
					</Show>

					<Show
						when={
							!props.systemRoleSaveEditing() &&
							props.currentSystemRoleSettings().name
						}
					>
						<span
							onClick={handleButtonClickDelete}
							class='inline-flex items-center justify-center gap-1 text-sm bg-slate/20 px-2 py-1 my-2 transition-colors cursor-pointer hover:bg-slate/50'
						>
							<span>Delete</span>
						</span>
					</Show>

					<Show when={props.systemRoleSaveEditing() && props.canEdit()}>
						<div class='mt-1'>
							<div class='flex items-center gap-1 op-50 dark:op-60'>
								<span>Save Role:</span>
							</div>
							<div>
								<textarea
									ref={systemInputRef2!}
									placeholder='Name of the new system role'
									autocomplete='off'
									autofocus
									rows='1'
									w-full
									px-3
									py-3
									my-1
									min-h-12
									max-h-36
									rounded-sm
									bg-slate
									bg-op-15
									focus:bg-op-20
									focus:ring-0
									focus:outline-none
									placeholder:op-50
									dark='placeholder:op-30'
									overflow-hidden
									resize-none
									scroll-pa-8px
								/>
							</div>
							<button
								onClick={saveSystem}
								h-12
								px-4
								py-2
                mb-10
								bg-slate
								bg-op-15
								hover:bg-op-20
								rounded-sm
							>
								Save
							</button>
						</div>
					</Show>
				</Show>
			</Show>
			<Show when={props.systemRoleEditing() && props.canEdit()}>
				<div>
					<div class='flex items-center gap-1 op-50 dark:op-60'>
						<IconEnv />
						<span>System Role:</span>
					</div>
					<p class='my-2 leading-normal text-sm op-50 dark:op-60'>
						Gently instruct the assistant and set the behavior of the assistant.
					</p>
					<div>
						<textarea
							ref={systemInputRef!}
							placeholder='You are a helpful assistant, answer as concisely as possible....'
							autocomplete='off'
							autofocus
							rows='3'
							w-full
							px-3
							py-3
							my-1
							min-h-12
							max-h-36
							rounded-sm
							bg-slate
							bg-op-15
							focus:bg-op-20
							focus:ring-0
							focus:outline-none
							placeholder:op-50
							dark='placeholder:op-30'
							overflow-hidden
							resize-none
							scroll-pa-8px
						/>
					</div>
					<button
						onClick={handleSetSystem}
						h-12
						px-4
						py-2
						mr-2
						bg-slate
						bg-op-15
						hover:bg-op-20
						rounded-sm
					>
						Set
					</button>

					<button
						onClick={handleCancelSystemEdit}
						h-12
						px-4
						py-2
						bg-slate
						bg-op-15
						hover:bg-op-20
						rounded-sm
					>
						Cancel
					</button>
				</div>
			</Show>
		</div>
	);
};
