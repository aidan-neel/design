<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import type { ChatStore } from './chat.svelte';
	import { archiveConversation, deleteConversation, downloadConversation } from './conversation-actions';
	import type { Conversation } from './data';
	import Icon from './Icon.svelte';

	type Props = { store: ChatStore; conversation: Conversation; onrename: () => void };
	let { store, conversation, onrename }: Props = $props();
</script>

<DropdownMenu.Item class="menu-item" onSelect={onrename}>
	<Icon name="pencil" />Rename
</DropdownMenu.Item>
<DropdownMenu.Item class="menu-item" onSelect={() => store.togglePin(conversation.id)}>
	<Icon name={conversation.pinned ? 'unpin' : 'pin'} />{conversation.pinned ? 'Unpin' : 'Pin'}
</DropdownMenu.Item>
<DropdownMenu.Item class="menu-item" onSelect={() => downloadConversation(conversation)}>
	<Icon name="download" />Export as Markdown
</DropdownMenu.Item>
<DropdownMenu.Separator class="menu-separator" />
<DropdownMenu.Item class="menu-item" onSelect={() => archiveConversation(store, conversation)}>
	<Icon name="archive" />Archive
</DropdownMenu.Item>
<DropdownMenu.Item class="menu-item menu-item-danger" onSelect={() => deleteConversation(store, conversation)}>
	<Icon name="trash" />Delete
</DropdownMenu.Item>
