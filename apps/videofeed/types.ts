export interface VideoFile {
  id: string;
  name: string;
  size?: string;
  thumbnail?: string;
  url: string;
  videoMediaMetadata?: { durationMills?: string };
}
type Event<Type extends string, Payload = never> = [Payload] extends [never]
  ? { type: Type }
  : { type: Type; payload: Payload };

export type Message =
  | Event<"scroll", Record<"nextIdx", number>>
  | Event<"scrollTo", Record<"direction", "up" | "down">>
  | Event<"togglePlay", Record<"idx", number>>
  | Event<"toggleMute">;

export type Effect =
  | Event<"mount", Record<"count", number>>
  | Event<
    "attachVideo",
    { videos: { [key: string]: VideoFile }; muted: boolean }
  >
  | Event<"detachVideo", Record<"idxsToDetach", Array<number>>>
  | Event<"play", Record<"idx", number>>
  | Event<"pause", Record<"idx", number>>
  | Event<"scrollTo", Record<"idx", number>>
  | Event<"setPaused", Record<"idx", number>>
  | Event<"removePaused", Record<"idx", number>>
  | Event<"setMuted", Record<"muted", boolean>>;
/** CONSTRUCTOR HEPLER TYPES */
export type MessageOrEffect = { type: string; payload?: unknown };

export type GetType<T extends MessageOrEffect> = T["type"];
export type GetPayload<T extends MessageOrEffect, K extends GetType<T>> =
  Extract<T, { type: K }> extends { payload: infer P } ? P : never;

export type UnionConstructor<T extends MessageOrEffect> = <
  K extends GetType<T>,
>(
  type: K,
  ...args: GetPayload<T, K> extends never ? [] : [payload: GetPayload<T, K>]
) => Extract<T, { type: K }>;
