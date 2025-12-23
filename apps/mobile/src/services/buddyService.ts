import {
  BuddyListItem,
  BuddyRequestsResponse,
  fetchBuddies,
  fetchBuddyRequests,
  respondToBuddyRequest,
  sendBuddyRequest,
} from '@/services/messageService';

class BuddyService {
  private buddyCache: BuddyListItem[] = [];

  async listBuddies(options: { force?: boolean } = {}): Promise<BuddyListItem[]> {
    if (!options.force && this.buddyCache.length) {
      return this.buddyCache;
    }
    this.buddyCache = await fetchBuddies();
    return this.buddyCache;
  }

  async getBuddyIds(options: { force?: boolean } = {}) {
    const buddies = await this.listBuddies(options);
    return new Set(buddies.map(entry => entry.buddy.id));
  }

  async getBuddyRequests(): Promise<BuddyRequestsResponse> {
    return fetchBuddyRequests();
  }

  async sendRequest(userId: string, message?: string) {
    return sendBuddyRequest(userId, message);
  }

  async respondToRequest(requestId: string, action: 'accept' | 'decline') {
    return respondToBuddyRequest(requestId, action);
  }
}

export const buddyService = new BuddyService();
export default buddyService;
