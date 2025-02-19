import { isDev } from "./environment";

export function logger(...args: any[]) {
  if (isDev) {
    console.log(...args);
  }
}

export function errorHandler(...args: any[]) {
  if (isDev) {
    console.error(...args);
  }
}
