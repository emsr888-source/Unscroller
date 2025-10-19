import { Injectable } from '@nestjs/common';
import { PolicyParser } from '@creator-mode/policy-engine';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class PolicyService {
  private cachedSignedPolicy: any = null;
  private privateKey: string;

  constructor() {
    // Load private key for signing
    const keyPath = process.env.POLICY_PRIVATE_KEY_PATH || path.join(__dirname, '../../keys/policy-private.pem');
    
    if (fs.existsSync(keyPath)) {
      this.privateKey = fs.readFileSync(keyPath, 'utf8');
    } else {
      console.warn('⚠️  Policy private key not found. Generating ephemeral key.');
      const { privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      this.privateKey = privateKey;
    }
  }

  getSignedPolicy() {
    // Load policy from file (always reload to get latest)
    let policyPath = process.env.POLICY_PATH;

    if (!policyPath) {
      // Try local policy.json first, then fallback to project root
      const localPath = path.join(process.cwd(), 'policy.json');
      const projectPath = path.join(process.cwd(), '../../../policy/policy.json');

      policyPath = fs.existsSync(localPath) ? localPath : projectPath;
    }

    if (!fs.existsSync(policyPath)) {
      throw new Error(`Policy file not found at: ${policyPath}`);
    }
    
    const policyJson = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
    
    // Check if version changed
    if (this.cachedSignedPolicy && this.cachedSignedPolicy.version === policyJson.version) {
      return this.cachedSignedPolicy;
    }

    // Validate
    const validation = PolicyParser.validate(policyJson);
    if (!validation.valid) {
      throw new Error(`Invalid policy: ${validation.errors?.join(', ')}`);
    }

    // Sign
    const signedPolicy = this.signPolicy(policyJson);
    this.cachedSignedPolicy = signedPolicy;

    return signedPolicy;
  }

  private signPolicy(policy: any) {
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

  getPublicKey(): string {
    const keyObject = crypto.createPrivateKey(this.privateKey);
    return crypto.createPublicKey(keyObject).export({ type: 'spki', format: 'pem' }) as string;
  }
}
