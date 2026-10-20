export { roomName, wallService } from "./domain/wall.service";
export { wallRouter } from "./http/wall.routes";
export {
  defaultWallResolver,
  wallContext,
  type WallResolver,
} from "./http/wall-context.middleware";
export type { WallRoom } from "./realtime/wall.room";
