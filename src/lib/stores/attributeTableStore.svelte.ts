export const attrTable = $state<{
	open: boolean;
	layerId: string | null;
}>({
	open: false,
	layerId: null
});

export function openTable(layerId: string) {
	attrTable.layerId = layerId;
	attrTable.open = true;
}

export function closeTable() {
	attrTable.open = false;
	attrTable.layerId = null;
}
