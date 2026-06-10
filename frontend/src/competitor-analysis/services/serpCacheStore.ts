import { competitorApiService } from './competitorApiService';

export interface SERPSnapshot {
  snapshot_id: string | null;
  fetched_at: string | null;
  keywords: string[];
  data: any;
}

class SERPCacheStore {
  public currentSnapshot: SERPSnapshot | null = null;
  public previousSnapshot: SERPSnapshot | null = null;
  public isLoading: boolean = false;
  public lastRefreshedAt: Date | null = null;
  
  private TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  async loadFromCache(): Promise<void> {
    this.isLoading = true;
    try {
      const storedId = sessionStorage.getItem("serp_snapshot_id");
      const storedTime = sessionStorage.getItem("serp_snapshot_time");
      
      let snapshotId = storedId;
      
      // Check TTL
      if (storedTime) {
        const age = Date.now() - new Date(storedTime).getTime();
        if (age > this.TTL_MS) {
          snapshotId = null; // Expired
        }
      }

      const res = await competitorApiService.getLatestSERP(snapshotId || undefined);
      
      if (res && res.snapshot_id) {
        // We got a valid cache from server
        this.currentSnapshot = res as SERPSnapshot;
        const dateStr = res.fetched_at ? (res.fetched_at.endsWith('Z') ? res.fetched_at : `${res.fetched_at}Z`) : null;
        this.lastRefreshedAt = dateStr ? new Date(dateStr) : new Date();
        sessionStorage.setItem("serp_snapshot_id", res.snapshot_id);
        sessionStorage.setItem("serp_snapshot_time", new Date().toISOString());
      } else {
        // Server has no cache at all -> first ever fetch
        await this.triggerRefresh();
      }
    } catch (e) {
      console.error("Failed to load SERP cache", e);
    } finally {
      this.isLoading = false;
    }
  }

  async triggerRefresh(): Promise<void> {
    this.isLoading = true;
    try {
      const res = await competitorApiService.refreshSERP();
      if (res && res.snapshot_id) {
        // Save current as previous before overwriting
        if (this.currentSnapshot && this.currentSnapshot.snapshot_id) {
            this.previousSnapshot = this.currentSnapshot;
        }

        // Fetch the full data for the new snapshot
        const fullData = await competitorApiService.getLatestSERP(res.snapshot_id);
        this.currentSnapshot = fullData as SERPSnapshot;
        this.lastRefreshedAt = new Date();
        
        sessionStorage.setItem("serp_snapshot_id", res.snapshot_id);
        sessionStorage.setItem("serp_snapshot_time", new Date().toISOString());
      }
    } catch (e) {
      console.error("Failed to refresh SERP", e);
      throw e;
    } finally {
      this.isLoading = false;
    }
  }
}

export const serpCacheStore = new SERPCacheStore();
