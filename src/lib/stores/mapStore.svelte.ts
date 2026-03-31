import type { Map } from 'maplibre-gl';

export const mapState = $state<{ instance: Map | null }>({ instance: null });
