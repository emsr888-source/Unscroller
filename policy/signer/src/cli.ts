#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { PolicyParser } from '@unscroller/policy-engine';
import { PolicySigner } from './signer';

/* eslint-disable no-console */

const program = new Command();

program
  .name('policy-sign')
  .description('Sign Unscroller policy JSON')
  .version('1.0.0');

program
  .command('sign')
  .description('Validate and sign a policy JSON file')
  .requiredOption('-i, --input <path>', 'Path to policy.json')
  .requiredOption('-o, --output <path>', 'Path to output signed policy file')
  .requiredOption('-k, --private-key <path>', 'Path to RSA private key')
  .requiredOption('-p, --public-key <path>', 'Path to RSA public key to save for verification')
  .action(async options => {
    try {
      const inputPath = path.resolve(options.input);
      const outputPath = path.resolve(options.output);
      const privateKeyPath = path.resolve(options.privateKey);
      const publicKeyPath = path.resolve(options.publicKey);

      console.log('🔍 Validating policy file...');
      const policyRaw = await fs.promises.readFile(inputPath, 'utf-8');
      const policy = JSON.parse(policyRaw);

      const validation = PolicyParser.validate(policy);
      if (!validation.valid) {
        console.error('❌ Policy validation failed:');
        validation.errors?.forEach((err: string) => console.error(`  - ${err}`));
        process.exit(1);
      }

      console.log('✅ Policy validation passed. Signing policy...');
      const signer = new PolicySigner(privateKeyPath);
      const signedPolicy = signer.sign(policy);

      await fs.promises.writeFile(outputPath, JSON.stringify(signedPolicy, null, 2));
      console.log(`✅ Signed policy saved to ${outputPath}`);

      if (publicKeyPath) {
        signer.savePublicKey(publicKeyPath);
      }
    } catch (error) {
      console.error('❌ Failed to sign policy:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse(process.argv);
