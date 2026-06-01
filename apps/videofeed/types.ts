export interface VideoFile {
  id: string;
  name: string;
  size?: string;
  thumbnail?: string;
  url: string;
  videoMediaMetadata?: { durationMills?: string };
}

export type Message =
  | {
    type: "fetch";
  }
  | {
    type: "fetch";
  }
  | {
    type: "scrollTo";
    payload: {
      direction: "up" | "down";
    };
  };

export type Effect =
  | {
    type: "mount";
    payload: {
      count: number;
    };
  }
  | {
    type: "attachVideo";
    payload: {
      videos: Record<number, VideoFile>;
    };
  }
  | {
    type: "detachVideo";
    payload: {
      idxsToDetach: Array<number>;
    };
  }
  | {
    type: "play";
    payload: {
      idx: number;
    };
  }
  | {
    type: "pause";
    payload: {
      idx: number;
    };
  }
  | {
    type: "scrollTo";
    payload: {
      idx: number;
    };
  };

export type AnyUnion = { type: string; payload?: unknown };

export type UnionType<T extends AnyUnion> = T["type"];
export type UnionPayload<T extends AnyUnion, K extends UnionType<T>> =
  Extract<T, { type: K }> extends { payload: infer P } ? P : never;

export type UnionConstructor<T extends AnyUnion> = <K extends UnionType<T>>(
  type: K,
  ...args: UnionPayload<T, K> extends never ? [] : [payload: UnionPayload<T, K>]
) => Extract<T, { type: K }>;
