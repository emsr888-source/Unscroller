import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface SignedPolicy {
  policy: any;
  signature: string;
  timestamp: string;
  version: string;
}

export class PolicySigner {
  private privateKey: string;

  constructor(privateKeyPath?: string) {
    // In production, use proper key management (HSM, KMS, etc.)
    // For now, generate or load a key
    if (privateKeyPath && fs.existsSync(privateKeyPath)) {
      this.privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    } else {
      // Generate ephemeral key for development
      const { privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      this.privateKey = privateKey;
      console.warn('⚠️  Using ephemeral key. In production, use persistent key management.');
    }
  }

  /**
   * Sign policy JSON
   */
  sign(policy: any): SignedPolicy {
    const policyString = JSON.stringify(policy);
    const signature = crypto
      .createSign('SHA256')
      .update(policyString)
      .sign(this.privateKey, 'base64');

    return {
      policy,
      signature,
      timestamp: new Date().toISOString(),
      version: policy.version,
    };
  }

  /**
   * Verify signed policy
   */
  static verify(signedPolicy: SignedPolicy, publicKey: string): boolean {
    const policyString = JSON.stringify(signedPolicy.policy);
    return crypto
      .createVerify('SHA256')
      .update(policyString)
      .verify(publicKey, signedPolicy.signature, 'base64');
  }

  /**
   * Get public key (for distribution to clients)
   */
  getPublicKey(): string {
    const keyObject = crypto.createPrivateKey(this.privateKey);
    return crypto.createPublicKey(keyObject).export({ type: 'spki', format: 'pem' }) as string;
  }

  /**
   * Save signed policy to file
   */
  saveSignedPolicy(signedPolicy: SignedPolicy, outputPath: string): void {
    fs.writeFileSync(outputPath, JSON.stringify(signedPolicy, null, 2));
    console.log(`✅ Signed policy saved to: ${outputPath}`);
  }

  /**
   * Save public key to file
   */
  savePublicKey(outputPath: string): void {
    fs.writeFileSync(outputPath, this.getPublicKey());
    console.log(`✅ Public key saved to: ${outputPath}`);
  }
}
