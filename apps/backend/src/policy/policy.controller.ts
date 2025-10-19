import { Controller, Get } from '@nestjs/common';
import { PolicyService } from './policy.service';

@Controller('api/policy')
export class PolicyController {
  constructor(private policyService: PolicyService) {}

  @Get()
  getPolicy() {
    return this.policyService.getSignedPolicy();
  }

  @Get('public-key')
  getPublicKey() {
    return {
      publicKey: this.policyService.getPublicKey(),
    };
  }
}
