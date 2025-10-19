#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { PolicyParser } from '@creator-mode/policy-engine';
import { PolicySigner } from './signer';

const program = new Command();

program
  .name('policy-sign')
  .description('Sign Creator Mode policy JSON')
  .version('1.0.0');

program
  .command('sign')
  .description('Sign policy.json')
  .option('-i, --input <path>', 'Input policy.json path', '../policy.json')
  .option('-o, --output <path>', 'Output signed policy path', './signed-policy.json')
  .option('-k, --key <path>', 'Private key path (optional)')
  .option('-p, --public-key <path>', 'Public key output path', './public-key.pem')
  .action(options => {
    try {
      // Read policy
      const policyPath = path.resolve(__dirname, options.input);
      const policyJson = JSON.parse(fs.readFileSync(policyPath, 'utf8'));

      // Validate
      const validation = PolicyParser.validate(policyJson);
      if (!validation.valid) {
        console.error('❌ Policy validation failed:');
        validation.errors?.forEach(err => console.error(`  - ${err}`));
        process.exit(1);
      }

      // Sign
      const signer = new PolicySigner(options.key);
      const signedPolicy = signer.sign(policyJson);

      // Save
      signer.saveSignedPolicy(signedPolicy, path.resolve(__dirname, options.output));
      signer.savePublicKey(path.resolve(__dirname, options.publicKey));

      console.log(`\n✨ Policy signed successfully!`);
      console.log(`   Version: ${signedPolicy.version}`);
      console.log(`   Timestamp: ${signedPolicy.timestamp}`);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

program.parse();
