import axios from 'axios';
import { decode } from 'base64-arraybuffer';
import { Player } from './types';

type TransmittableAttestationResponse = {
  attestationObject: string;
  clientDataJSON: string;
};

type TransmittableAssertionResponse = {
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  userHandle: string;
};

type TransmittablePublicKeyCredential = Omit<PublicKeyCredential, 'rawId' | 'response'> & {
  rawId: string;
  response: TransmittableAttestationResponse | TransmittableAssertionResponse;
};

const HOSTNAME = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Register a new user with passwordless authentication.
 *
 * First, the user is registered with an email and name. This information is passed
 * to the server, which generates options for how to create a new credential.
 * Next, the browser API is called to create a new credential and the credential is
 * sent to the server for verification and storage.
 *
 * @param {Player} user - information about the user to register.
 * @returns {Player} user - The user data stored on the server.
 */
export async function registerNewPlayer(player: Player): Promise<Player | undefined> {
  const body = JSON.stringify({ email: player.email, name: player.name });
  console.log('url: ', import.meta.env.VITE_API_URL);
  const response = await axios.post(`${HOSTNAME}/auth/registration/begin/`, body, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });

  const credentialOptions: PublicKeyCredentialCreationOptions = JSON.parse(response.data);
  const publicKey = decodeCredentialCreationOptions(credentialOptions);

  // The browser API takes an object where the credentialOptions are named publicKey
  // strange...
  const credential: Credential | null = await navigator.credentials.create({ publicKey });

  if (credential === null) {
    throw Error('No credential returned');
  }

  const encodedCredential = encodeCredential(credential as PublicKeyCredential);

  const returnedPlayer = await axios.post(
    `${HOSTNAME}/auth/registration/complete/`,
    JSON.stringify(encodedCredential),
    { headers: { 'Content-Type': 'text/plain' }, withCredentials: true }
  );
  return returnedPlayer.data;
}

/**
 * Log in a new user without password or username
 *
 * First, ask the server for how to request the credential.
 * Then use the returned request options to get a credential from the authenticator.
 * Pass the retrieved credential back to the server for verification.
 *
 * @returns {Player} user - The user data stored on the server.
 */
export async function assertPlayer(): Promise<Player | undefined> {
  const response = await axios.get(`${HOSTNAME}/auth/assertion/begin/`, {
    withCredentials: true,
  });
  const requestOptions: PublicKeyCredentialRequestOptions = JSON.parse(response.data);

  // The browser API takes an object where the credentialOptions are named publicKey
  // strange...
  const publicKey = decodeCredentialRequestOptions(requestOptions);
  const credential = await navigator.credentials.get({ publicKey });
  if (credential === null) {
    throw new Error('No credential returned during login');
  }

  const encodedCredential = encodeCredential(credential as PublicKeyCredential);
  const player = await axios.post(
    `${HOSTNAME}/auth/assertion/complete/`,
    JSON.stringify(encodedCredential),
    { headers: { 'Content-Type': 'text/plain' }, withCredentials: true }
  );
  return player.data;
}

export const decodeCredentialCreationOptions = (
  creationOptions: PublicKeyCredentialCreationOptions
): PublicKeyCredentialCreationOptions => {
  const modified = {
    ...creationOptions,
    challenge: base64UrlSafeToArrayBuffer(creationOptions.challenge),
    user: {
      ...creationOptions.user,
      id: base64UrlSafeToArrayBuffer(creationOptions.user.id),
    },
  };
  if (modified.excludeCredentials) {
    modified.excludeCredentials = modified.excludeCredentials.map((credential) => {
      return {
        ...credential,
        id: base64UrlSafeToArrayBuffer(credential.id),
      };
    });
  }

  return modified;
};

function decodeCredentialRequestOptions(
  credentialRequestOptions: PublicKeyCredentialRequestOptions
): PublicKeyCredentialRequestOptions {
  const modified = {
    ...credentialRequestOptions,
    challenge: base64UrlSafeToArrayBuffer(credentialRequestOptions.challenge),
    // The allowCredentials array is not used since we use resident keys,
    // but decode it anyway
    allowCredentials:
      credentialRequestOptions.allowCredentials?.map((credential) => {
        return {
          ...credential,
          id: base64UrlSafeToArrayBuffer(credential.id),
        };
      }) ?? [],
  };
  return modified;
}

const encodeCredential = (credential: PublicKeyCredential): TransmittablePublicKeyCredential => {
  return {
    ...credential,
    id: credential.id,
    rawId: arrayBufferToBase64UrlSafe(credential.rawId),
    response: encodeResponse(credential),
    type: credential.type,
  };
};

const encodeResponse = (
  credential: PublicKeyCredential
): TransmittableAttestationResponse | TransmittableAssertionResponse => {
  if (credential.response instanceof AuthenticatorAttestationResponse) {
    return {
      attestationObject: arrayBufferToBase64UrlSafe(credential.response.attestationObject),
      clientDataJSON: arrayBufferToBase64UrlSafe(credential.response.clientDataJSON),
    };
  } else if (credential.response instanceof AuthenticatorAssertionResponse) {
    return {
      authenticatorData: arrayBufferToBase64UrlSafe(credential.response.authenticatorData),
      clientDataJSON: arrayBufferToBase64UrlSafe(credential.response.clientDataJSON),
      signature: arrayBufferToBase64UrlSafe(credential.response.signature),
      userHandle: arrayBufferToBase64UrlSafe(credential.response.userHandle),
    };
  } else {
    throw new Error('Unknown response type');
  }
};

function arrayBufferToBase64UrlSafe(buffer: ArrayBuffer | null): string {
  if (buffer === null) {
    return '';
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  // Convert to URL-safe Base64 format
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlSafeToArrayBuffer(safeBase64: BufferSource): ArrayBuffer {
  return decode((safeBase64 as unknown as string).replace(/-/g, '+').replace(/_/g, '/'));
}
