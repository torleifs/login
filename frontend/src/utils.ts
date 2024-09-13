import axios from "axios";
import { GlobalNotification } from "./types";

export function handleAxiosError(
  message: string,
  err: unknown,
  callback: (notification: GlobalNotification) => void
) {
  if (axios.isAxiosError(err)) {
    console.log(`Axios error: ${err}`);
    if (err.response === undefined) {
      callback({
        heading: 'Request failed',
        message: `${message ? message + '\n:' : ''} ${err.message}`,
      });
      return;
    }
    const { response } = err;
    const { ...errorObject } = response;
    console.log(JSON.stringify(errorObject));
    callback({
      heading: 'Request failed',
      message: `${message ? message + '\n:' : ''} ${errorObject.data.detail ?? err.message}`,
    });
  } else if (err instanceof Error) {
    callback({
      heading: 'Request failed',
      message: `${message ? message + '\n:' : ''} ${err.message}`,
    });
  } else {
    callback({
      heading: 'Request failed',
      message: message,
    });
  }
}