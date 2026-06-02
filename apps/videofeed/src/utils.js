/** @import  {Effect, Message, UnionConstructor} from "../types" */

/** @type {UnionConstructor<Effect>} */
export function effect(type, payload) {
  return /** @type {any} */ ({ type, payload });
}

/** @type {UnionConstructor<Message>} */
export function message(type, payload) {
  return /** @type {any} */ ({ type, payload });
}

/** @type {(value:number, min: number, max: number) => number} */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** @param {never} x @returns {never} */
export const assertNever = (x) => {
  throw new Error("Unhandled discriminat: " + JSON.stringify(x));
};
