import { ethers } from 'ethers';

export interface WalletClusterRisk {
  traderAddress: string;
  seedDonorAddress: string;
  isBlacklistedSybil: boolean;
  clusterSize: number;
}

/**
 * @title AntiSybilGraph
 * @notice Scans transaction history (Seed Funding Graph) to detect bot-farm clusters
 * funded by the same initial wallet or mixer contract.
 */
export class AntiSybilGraph {
  private knownSeedDonors: Map<string, string[]> = new Map(); // Donor => [Wallets]
  private disqualifiedWallets: Set<string> = new Set();

  public async evaluateWallet(traderAddress: string, seedDonorAddress: string): Promise<WalletClusterRisk> {
    const normalizedTrader = traderAddress.toLowerCase();
    const normalizedDonor = seedDonorAddress.toLowerCase();

    // Group by funding source
    if (!this.knownSeedDonors.has(normalizedDonor)) {
      this.knownSeedDonors.set(normalizedDonor, []);
    }

    const cluster = this.knownSeedDonors.get(normalizedDonor)!;
    if (!cluster.includes(normalizedTrader)) {
      cluster.push(normalizedTrader);
    }

    // If more than 5 wallets are funded by the exact same donor address -> flag as Sybil bot-farm
    const isSybil = cluster.length > 5;
    if (isSybil) {
      for (const w of cluster) {
        this.disqualifiedWallets.add(w);
      }
      console.warn(`[Anti-Sybil] Sybil farm cluster detected! Donor ${normalizedDonor} has funded ${cluster.length} wallets.`);
    }

    return {
      traderAddress: normalizedTrader,
      seedDonorAddress: normalizedDonor,
      isBlacklistedSybil: this.disqualifiedWallets.has(normalizedTrader),
      clusterSize: cluster.length
    };
  }

  public isTraderDisqualified(traderAddress: string): boolean {
    return this.disqualifiedWallets.has(traderAddress.toLowerCase());
  }
}
