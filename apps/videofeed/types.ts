export interface VideoFile {
  id: string;
  name: string;
  size?: string;
  thumbnail?: string;
  url: string;
  videoMediaMetadata?: { durationMills?: string };
}
type Event<Type extends string, Payload = never> = Payload extends never
  ? { type: Type }
  : { type: Type; payload: Payload };

export type Message =
  | Event<"fetch">
  | Event<"scroll", Record<"nextIdx", number>>
  | Event<"scrollTo", Record<"direction", "up" | "down">>
  | Event<"togglePlay", Record<"idx", number>>;

export type Effect =
  | Event<"mount", Record<"count", number>>
  | Event<"attachVideo", Record<"videos", { [key: number]: VideoFile }>>
  | Event<"detachVideo", Record<"idxsToDetach", Array<number>>>
  | Event<"play", Record<"idx", number>>
  | Event<"pause", Record<"idx", number>>
  | Event<"scrollTo", Record<"idx", number>>
  | Event<"setAutoPlay", Record<"idx", number>>
  | Event<"removeAutoPlay", Record<"idx", number>>
  | Event<"userPaused", Record<"idx", number>>
  | Event<"removePaused", Record<"idx", number>>;
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
