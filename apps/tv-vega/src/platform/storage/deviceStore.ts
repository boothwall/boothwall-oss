import AsyncStorage from "@amazon-devices/react-native-async-storage__async-storage";
import type { KeyValueStore } from "@boothwall/wall-ui";

/** The device's own storage on Vega: the last wall's photos and settings, so an offline start still shows them. */
export const deviceStore: KeyValueStore = AsyncStorage;
