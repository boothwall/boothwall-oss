import type { KeplerMediaControlHandler } from "@amazon-devices/react-native-w3cmedia";

type MetadataRequest = Parameters<KeplerMediaControlHandler["handleGetMetadataInfo"]>[0];
export type MediaMetadata = Awaited<ReturnType<KeplerMediaControlHandler["handleGetMetadataInfo"]>>;

export interface WallEvent {
  name: string;
  hashtag: string;
}

/** What the system's media UI and Alexa see as playing: the event on the wall. */
export function wallMetadata(id: MetadataRequest, event: WallEvent): MediaMetadata {
  return { mediaId: id, title: event.name, description: event.hashtag, artwork: [] };
}
