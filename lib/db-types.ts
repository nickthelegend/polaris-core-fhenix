import { ObjectId } from "mongodb";

export interface PoolDocument {
  _id?: ObjectId;
  symbol: string;
  name: string;
  supplyApy: number;
  borrowApy: number;
  totalLiquidity: number;
  utilization: number;
  updatedAt: Date;
}

export interface PositionDocument {
  _id?: ObjectId;
  walletAddress: string;
  type: "SUPPLY" | "BORROW";
  symbol: string;
  entryAmount: number;
  txHash: string;
  status: "active" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

export interface GlobalStatsDocument {
  _id?: ObjectId;
  totalSupplied: number;
  totalBorrowed: number;
  activePools: number;
  avgSupplyApy: number;
  updatedAt: Date;
}
