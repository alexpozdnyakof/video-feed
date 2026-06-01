export interface VideoFile {
  id: string;
  name: string;
  size?: string;
  thumbnail?: string;
  url: string;
  videoMediaMetadata?: { durationMills?: string };
}

interface FetchMessage {
  type: "fetch";
}
interface ScrollMessage {
  type: "scroll";
  payload: {
    nextIdx: number;
  };
}
interface ScrollToMessage {
  type: "scrollTo";
  payload: {
    direction: "up" | "down";
  };
}

export type Message = FetchMessage | ScrollMessage | ScrollToMessage;

interface MountEffect {
  type: "mount";
  payload: {
    count: number;
  };
}

interface AttachVideoEffect {
  type: "attachVideo";
  payload: {
    videos: Record<number, VideoFile>;
  };
}

interface DetachVideoEffect {
  type: "detachVideo";
  payload: {
    idxsToDetach: Array<number>;
  };
}

interface PlayEffect {
  type: "play";
  payload: {
    idx: number;
  };
}

interface PauseEffect {
  type: "pause";
  payload: {
    idx: number;
  };
}

interface ScrollToEffect {
  type: "scrollTo";
  payload: {
    idx: number;
  };
}

export type Effect =
  | MountEffect
  | AttachVideoEffect
  | DetachVideoEffect
  | PlayEffect
  | PauseEffect
  | ScrollToEffect;

export type AnyUnion = { type: string; payload?: unknown };

export type UnionType<T extends AnyUnion> = T["type"];
export type UnionPayload<T extends AnyUnion, K extends UnionType<T>> =
  Extract<T, { type: K }> extends { payload: infer P } ? P : never;

export type UnionConstructor<T extends AnyUnion> = <K extends UnionType<T>>(
  type: K,
  ...args: UnionPayload<T, K> extends never ? [] : [payload: UnionPayload<T, K>]
) => Extract<T, { type: K }>;
