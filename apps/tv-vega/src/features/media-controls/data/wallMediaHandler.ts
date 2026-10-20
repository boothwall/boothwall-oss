import { KeplerMediaControlHandler } from "@amazon-devices/react-native-w3cmedia";

import type { MediaCommands } from "./mediaCommands";
import { type WallEvent, wallMetadata } from "./mediaMetadata";

/** Routes media commands to the wall. They never reach the silent player, which must keep playing. */
export class WallMediaControlHandler extends KeplerMediaControlHandler {
  constructor(
    private readonly commands: MediaCommands,
    private readonly event: WallEvent,
  ) {
    super();
  }

  override async handleGetMetadataInfo(id: Parameters<typeof wallMetadata>[0]) {
    return wallMetadata(id, this.event);
  }

  override async handlePlay() {
    this.commands.play();
  }

  override async handlePause() {
    this.commands.pause();
  }

  override async handleTogglePlayPause() {
    this.commands.toggle();
  }

  override async handleStop() {
    this.commands.pause();
  }

  override async handleNext() {
    this.commands.next();
  }

  override async handlePrevious() {
    this.commands.previous();
  }
}
