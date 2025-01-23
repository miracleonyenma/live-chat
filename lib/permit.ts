// ./lib/permit.ts

import { Permit } from "permitio";
const PERMIT_API_KEY = process.env.PERMIT_API_KEY;

// This first line initializes the SDK and connects your Node.js app
// to the Permit.io PDP container you've set up in the previous step.
const permit = new Permit({
  // your API Key
  token: PERMIT_API_KEY,

  // in production, you might need to change this url to fit your deployment
  pdp: "https://7b80-172-190-134-32.ngrok-free.app",

  // if you want the SDK to emit logs, uncomment this:
  // log: {
  //   level: "debug",
  // },

  // The SDK returns false if you get a timeout / network error
  // if you want it to throw an error instead, and let you handle this, uncomment this:
  // throwOnError: true,
});

export default permit;
