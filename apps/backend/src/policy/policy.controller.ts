import { Controller, Get, HttpException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

function resolvePolicyPath(): string {
  const env = process.env.POLICY_PATH;
  if (env && fs.existsSync(env)) {
    return env;
  }

  const tryPaths = [
    path.join(process.cwd(), 'policy', 'policy.json'),
    path.join(process.cwd(), 'apps', 'backend', '..', '..', 'policy', 'policy.json'),
    path.join(__dirname, '../../../policy/policy.json'),
  ];

  for (const candidate of tryPaths) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('policy.json not found');
}

@Controller()
export class PolicyController {
  @Get('policy')
  getPolicy() {
    try {
      const filePath = resolvePolicyPath();
      const raw = fs.readFileSync(filePath, 'utf8');
      const policy = JSON.parse(raw);

      if (!policy || typeof policy !== 'object' || !policy.providers) {
        throw new Error('Invalid shape');
      }

      console.log(`[PolicyController] Serving policy from ${filePath}`);
      return policy;
    } catch (error: any) {
      throw new HttpException(`Policy error: ${error.message}`, 500);
    }
  }
}
