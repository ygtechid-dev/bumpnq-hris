import Echo from "laravel-echo";
import { REVERB_APP_KEY, REVERB_HOST, REVERB_PORT, REVERB_SCHEME } from "@env";

import Pusher from "pusher-js";
window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: "reverb",
  key: REVERB_APP_KEY,
  wsHost: REVERB_HOST,
  wsPort: REVERB_PORT ?? 80,
  wssPort: REVERB_PORT ?? 443,
  forceTLS: REVERB_SCHEME,
  enabledTransports: ["ws", "wss"],
});


export default echo;