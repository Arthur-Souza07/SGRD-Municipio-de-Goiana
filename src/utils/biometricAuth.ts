/**
 * Biometric Authentication Utilities
 * Uses WebAuthn / Credential Management API for fingerprint/face ID authentication
 */

export interface BiometricSupport {
  supported: boolean;
  hasPlatformAuthenticator: boolean;
  error?: string;
}

export interface BiometricAuthResult {
  success: boolean;
  credential?: PublicKeyCredential;
  error?: string;
  errorCode?: string;
}

/**
 * Check if biometric authentication is supported on this device
 */
export async function checkBiometricSupport(): Promise<BiometricSupport> {
  if (typeof window === 'undefined' || !navigator.credentials) {
    return { supported: false, hasPlatformAuthenticator: false, error: 'WebAuthn not supported' };
  }

  try {
    // Check if PublicKeyCredential is available
    if (!window.PublicKeyCredential) {
      return { supported: false, hasPlatformAuthenticator: false, error: 'PublicKeyCredential not available' };
    }

    // Check for platform authenticator (fingerprint/face ID)
    const hasPlatformAuthenticator = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

    return {
      supported: true,
      hasPlatformAuthenticator,
      error: hasPlatformAuthenticator ? undefined : 'No platform authenticator (fingerprint/face ID) available'
    };
  } catch (error) {
    return {
      supported: false,
      hasPlatformAuthenticator: false,
      error: error instanceof Error ? error.message : 'Unknown error checking biometric support'
    };
  }
}

/**
 * Generate a challenge for WebAuthn authentication
 */
function generateChallenge(): BufferSource {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return array.buffer;
}

/**
 * Authenticate user with biometric (fingerprint/face ID)
 * This uses a previously registered credential or creates a transient one
 */
export async function authenticateWithBiometric(): Promise<BiometricAuthResult> {
  const support = await checkBiometricSupport();

  if (!support.supported) {
    return { success: false, error: support.error || 'Biometric authentication not supported' };
  }

  if (!support.hasPlatformAuthenticator) {
    return { success: false, error: 'No biometric authenticator available', errorCode: 'NO_AUTHENTICATOR' };
  }

  try {
    // For a simplified implementation, we'll use a transient credential approach
    // In production, you'd have registered credentials stored on the server
    const challenge = generateChallenge();

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000, // 60 seconds
      rpId: window.location.hostname, // Relying party ID
      allowCredentials: [], // Empty means any credential
      userVerification: 'required', // Require biometric/PIN
    };

    const credential = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
      mediation: 'required', // Show UI
    }) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: 'Authentication cancelled or failed', errorCode: 'NO_CREDENTIAL' };
    }

    return { success: true, credential };
  } catch (error) {
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotAllowedError':
          return { success: false, error: 'Autenticação cancelada ou negada pelo usuário', errorCode: 'NOT_ALLOWED' };
        case 'NotSupportedError':
          return { success: false, error: 'Autenticação biométrica não suportada neste dispositivo', errorCode: 'NOT_SUPPORTED' };
        case 'InvalidStateError':
          return { success: false, error: 'Nenhuma credencial registrada. Use a opção de PIN.', errorCode: 'INVALID_STATE' };
        case 'SecurityError':
          return { success: false, error: 'Erro de segurança na autenticação', errorCode: 'SECURITY_ERROR' };
        case 'AbortError':
          return { success: false, error: 'Autenticação abortada', errorCode: 'ABORTED' };
        default:
          return { success: false, error: `Erro: ${error.message}`, errorCode: error.name };
      }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido', errorCode: 'UNKNOWN' };
  }
}

/**
 * Fallback authentication using device PIN/password
 * This is a simplified version - in production you'd verify against stored credentials
 */
export async function authenticateWithPIN(pin: string): Promise<BiometricAuthResult> {
  // In a real implementation, this would verify against a stored hash
  // For now, we'll accept any non-empty PIN as a mock
  if (!pin || pin.trim().length === 0) {
    return { success: false, error: 'PIN não pode ser vazio', errorCode: 'EMPTY_PIN' };
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock validation - in production, verify against backend
  if (pin === 'erro') {
    return { success: false, error: 'PIN incorreto', errorCode: 'INVALID_PIN' };
  }

  return { success: true };
}

/**
 * Check if we're on a mobile/tablet device (where biometric is required)
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
}

/**
 * Get user-friendly error message for biometric errors
 */
export function getBiometricErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    NOT_ALLOWED: 'Autenticação cancelada. Toque no sensor ou use o PIN.',
    NOT_SUPPORTED: 'Seu dispositivo não suporta autenticação biométrica. Use o PIN.',
    INVALID_STATE: 'Nenhuma digital/face cadastrada. Use o PIN do dispositivo.',
    SECURITY_ERROR: 'Erro de segurança. Tente novamente.',
    ABORTED: 'Autenticação interrompida.',
    NO_AUTHENTICATOR: 'Nenhum leitor biométrico detectado. Use o PIN.',
    NO_CREDENTIAL: 'Nenhuma credencial encontrada. Use o PIN.',
    UNKNOWN: 'Erro desconhecido. Tente usar o PIN.',
  };
  return messages[errorCode] || 'Erro na autenticação. Tente usar o PIN.';
}