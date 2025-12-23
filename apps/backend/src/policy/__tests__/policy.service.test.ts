import { Test, TestingModule } from '@nestjs/testing';
import { PolicyService } from '../policy.service';
import * as fs from 'fs';
import * as crypto from 'crypto';

// Mock fs module
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('PolicyService', () => {
  let service: PolicyService;

  const mockPolicy = {
    version: '1.0.0',
    youtubeFilterMode: 'safe',
    providers: {
      instagram: {
        start: 'https://www.instagram.com/direct/inbox/',
        allow: ['/direct/'],
        block: ['/explore/'],
      },
    },
  };

  beforeEach(async () => {
    // Mock fs.existsSync to return false (no key file)
    mockedFs.existsSync.mockReturnValue(false);

    const module: TestingModule = await Test.createTestingModule({
      providers: [PolicyService],
    }).compile();

    service = module.get<PolicyService>(PolicyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSignedPolicy', () => {
    it('should return signed policy', () => {
      // Mock fs.readFileSync to return mock policy
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockPolicy));
      mockedFs.existsSync.mockReturnValue(true);

      const signedPolicy = service.getSignedPolicy();
      
      expect(signedPolicy).toBeDefined();
      expect(signedPolicy.policy).toEqual(mockPolicy);
      expect(signedPolicy.signature).toBeDefined();
      expect(signedPolicy.version).toBe('1.0.0');
      expect(signedPolicy.timestamp).toBeDefined();
    });

    it('should throw error when policy file not found', () => {
      mockedFs.existsSync.mockReturnValue(false);

      expect(() => service.getSignedPolicy()).toThrow('Policy file not found');
    });

    it('should cache signed policy for same version', () => {
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockPolicy));
      mockedFs.existsSync.mockReturnValue(true);

      const signedPolicy1 = service.getSignedPolicy();
      const signedPolicy2 = service.getSignedPolicy();

      expect(signedPolicy1).toBe(signedPolicy2);
      expect(mockedFs.readFileSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('getPublicKey', () => {
    it('should return public key in PEM format', () => {
      const publicKey = service.getPublicKey();
      
      expect(publicKey).toBeDefined();
      expect(publicKey).toContain('-----BEGIN PUBLIC KEY-----');
      expect(publicKey).toContain('-----END PUBLIC KEY-----');
    });
  });
});
