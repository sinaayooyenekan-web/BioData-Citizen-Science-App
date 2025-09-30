import { describe, it, expect, beforeEach } from "vitest";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_REPORT_ID = 101;
const ERR_INVALID_STAKE_AMOUNT = 102;
const ERR_INVALID_VOTE = 103;
const ERR_VOTING_CLOSED = 104;
const ERR_ALREADY_VOTED = 106;
const ERR_REPORT_NOT_FOUND = 107;
const ERR_INVALID_THRESHOLDS = 108;
const ERR_INVALID_DEADLINE = 109;
const ERR_INVALID_REPUTATION = 110;
const ERR_INVALID_PARAM = 115;
const ERR_MAX_VOTES_EXCEEDED = 116;
const ERR_INVALID_STATUS = 114;

const VOTE_APPROVE = 1;
const VOTE_REJECT = 2;
const STATUS_PENDING = 0;
const STATUS_APPROVED = 1;
const STATUS_REJECTED = 2;

interface VotingPool {
  reportId: number;
  startTime: number;
  endTime: number;
  totalStake: number;
  approveStake: number;
  rejectStake: number;
  status: number;
  voterCount: number;
}

interface Vote {
  vote: number;
  stake: number;
  reputationWeight: number;
  timestamp: number;
}

interface Dispute {
  challenger: string;
  reason: string;
  timestamp: number;
  resolved: boolean;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class ConsensusVotingMock {
  state: {
    tokenContract: string;
    rewardManager: string;
    userRegistry: string;
    dataReport: string;
    minStake: number;
    approvalThreshold: number;
    rejectionThreshold: number;
    votingDuration: number;
    maxVotesPerReport: number;
    votingPools: Map<number, VotingPool>;
    votes: Map<string, Vote>;
    disputedReports: Map<number, Dispute>;
  };
  blockHeight: number;
  caller: string;
  contractCaller: string;
  transfers: Array<{ amount: number; from: string; to: string }>;
  events: Array<{ event: string; [key: string]: any }>;

  constructor() {
    this.state = {
      tokenContract: "SP000000000000000000002Q6VF78",
      rewardManager: "SP000000000000000000002Q6VF78",
      userRegistry: "SP000000000000000000002Q6VF78",
      dataReport: "SP000000000000000000002Q6VF78",
      minStake: 100,
      approvalThreshold: 66,
      rejectionThreshold: 66,
      votingDuration: 144,
      maxVotesPerReport: 100,
      votingPools: new Map(),
      votes: new Map(),
      disputedReports: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.contractCaller = "ST1CONTRACT";
    this.transfers = [];
    this.events = [];
  }

  reset() {
    this.state = {
      tokenContract: "SP000000000000000000002Q6VF78",
      rewardManager: "SP000000000000000000002Q6VF78",
      userRegistry: "SP000000000000000000002Q6VF78",
      dataReport: "SP000000000000000000002Q6VF78",
      minStake: 100,
      approvalThreshold: 66,
      rejectionThreshold: 66,
      votingDuration: 144,
      maxVotesPerReport: 100,
      votingPools: new Map(),
      votes: new Map(),
      disputedReports: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.contractCaller = "ST1CONTRACT";
    this.transfers = [];
    this.events = [];
  }

  setMinStake(amount: number): Result<boolean> {
    if (this.caller !== this.contractCaller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (amount <= 0 || amount < 1) return { ok: false, value: ERR_INVALID_STAKE_AMOUNT };
    this.state.minStake = amount;
    return { ok: true, value: true };
  }

  setThresholds(approve: number, reject: number): Result<boolean> {
    if (this.caller !== this.contractCaller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (approve > 100 || reject > 100 || approve <= 50 || reject <= 50) return { ok: false, value: ERR_INVALID_THRESHOLDS };
    this.state.approvalThreshold = approve;
    this.state.rejectionThreshold = reject;
    return { ok: true, value: true };
  }

  setVotingDuration(dur: number): Result<boolean> {
    if (this.caller !== this.contractCaller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (dur <= 0) return { ok: false, value: ERR_INVALID_DEADLINE };
    this.state.votingDuration = dur;
    return { ok: true, value: true };
  }

  initiateVoting(reportId: number): Result<boolean> {
    if (reportId <= 0) return { ok: false, value: ERR_INVALID_REPORT_ID };
    if (this.state.votingPools.has(reportId)) return { ok: false, value: ERR_INVALID_PARAM };
    const pool: VotingPool = {
      reportId,
      startTime: this.blockHeight,
      endTime: this.blockHeight + this.state.votingDuration,
      totalStake: 0,
      approveStake: 0,
      rejectStake: 0,
      status: STATUS_PENDING,
      voterCount: 0,
    };
    this.state.votingPools.set(reportId, pool);
    this.events.push({ event: "voting-initiated", reportId });
    return { ok: true, value: true };
  }

  castVote(reportId: number, vote: number, stake: number): Result<boolean> {
    if (![VOTE_APPROVE, VOTE_REJECT].includes(vote)) return { ok: false, value: ERR_INVALID_VOTE };
    if (stake < this.state.minStake || stake === 0) return { ok: false, value: ERR_INVALID_STAKE_AMOUNT };
    const pool = this.state.votingPools.get(reportId);
    if (!pool) return { ok: false, value: ERR_REPORT_NOT_FOUND };
    if (this.blockHeight > pool.endTime) return { ok: false, value: ERR_VOTING_CLOSED };
    const voteKey = `${reportId}-${this.caller}`;
    if (this.state.votes.has(voteKey)) return { ok: false, value: ERR_ALREADY_VOTED };
    if (pool.voterCount >= this.state.maxVotesPerReport) return { ok: false, value: ERR_MAX_VOTES_EXCEEDED };
    const reputation = 1;
    const weightedStake = stake * reputation;
    this.state.votes.set(voteKey, { vote, stake, reputationWeight: reputation, timestamp: this.blockHeight });
    this.state.votingPools.set(reportId, {
      ...pool,
      totalStake: pool.totalStake + weightedStake,
      approveStake: vote === VOTE_APPROVE ? pool.approveStake + weightedStake : pool.approveStake,
      rejectStake: vote === VOTE_REJECT ? pool.rejectStake + weightedStake : pool.rejectStake,
      voterCount: pool.voterCount + 1,
    });
    this.transfers.push({ amount: stake, from: this.caller, to: "contract" });
    this.events.push({ event: "vote-cast", reportId, voter: this.caller, vote });
    const result = this.checkConsensus(reportId);
    if (result.ok && result.value !== STATUS_PENDING) {
      this.state.votingPools.set(reportId, { ...pool, status: result.value });
      this.events.push({ event: `consensus-${result.value === STATUS_APPROVED ? "approved" : "rejected"}`, reportId });
    }
    return { ok: true, value: true };
  }

  private checkConsensus(reportId: number): Result<number> {
    const pool = this.state.votingPools.get(reportId);
    if (!pool) return { ok: false, value: ERR_REPORT_NOT_FOUND };
    const approvePct = pool.totalStake > 0 ? (pool.approveStake * 100) / pool.totalStake : 0;
    const rejectPct = pool.totalStake > 0 ? (pool.rejectStake * 100) / pool.totalStake : 0;
    if (approvePct >= this.state.approvalThreshold) return { ok: true, value: STATUS_APPROVED };
    if (rejectPct >= this.state.rejectionThreshold) return { ok: true, value: STATUS_REJECTED };
    return { ok: true, value: STATUS_PENDING };
  }

  challengeReport(reportId: number, reason: string): Result<boolean> {
    const pool = this.state.votingPools.get(reportId);
    if (!pool) return { ok: false, value: ERR_REPORT_NOT_FOUND };
    if (pool.status !== STATUS_APPROVED) return { ok: false, value: ERR_INVALID_STATUS };
    if (this.state.disputedReports.has(reportId)) return { ok: false, value: ERR_INVALID_PARAM };
    this.state.disputedReports.set(reportId, {
      challenger: this.caller,
      reason,
      timestamp: this.blockHeight,
      resolved: false,
    });
    this.events.push({ event: "report-challenged", reportId });
    return { ok: true, value: true };
  }

  withdrawStake(reportId: number): Result<boolean> {
    const pool = this.state.votingPools.get(reportId);
    if (!pool) return { ok: false, value: ERR_REPORT_NOT_FOUND };
    if (this.blockHeight <= pool.endTime) return { ok: false, value: ERR_VOTING_CLOSED };
    if (![STATUS_APPROVED, STATUS_REJECTED].includes(pool.status)) return { ok: false, value: ERR_INVALID_STATUS };
    const voteKey = `${reportId}-${this.caller}`;
    const vote = this.state.votes.get(voteKey);
    if (!vote) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.votes.delete(voteKey);
    this.transfers.push({ amount: vote.stake, from: "contract", to: this.caller });
    this.events.push({ event: "stake-withdrawn", reportId, voter: this.caller });
    return { ok: true, value: true };
  }

  getPoolStatus(reportId: number): Result<number> {
    const pool = this.state.votingPools.get(reportId);
    if (!pool) return { ok: false, value: ERR_REPORT_NOT_FOUND };
    return { ok: true, value: pool.status };
  }

  getApprovePercentage(reportId: number): Result<number> {
    const pool = this.state.votingPools.get(reportId);
    if (!pool) return { ok: false, value: ERR_REPORT_NOT_FOUND };
    return { ok: true, value: pool.totalStake > 0 ? (pool.approveStake * 100) / pool.totalStake : 0 };
  }
}

describe("ConsensusVoting", () => {
  let contract: ConsensusVotingMock;

  beforeEach(() => {
    contract = new ConsensusVotingMock();
    contract.reset();
  });

  it("initiates voting successfully", () => {
    const result = contract.initiateVoting(1);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.events).toContainEqual({ event: "voting-initiated", reportId: 1 });
    expect(contract.state.votingPools.get(1)).toEqual({
      reportId: 1,
      startTime: 0,
      endTime: 144,
      totalStake: 0,
      approveStake: 0,
      rejectStake: 0,
      status: STATUS_PENDING,
      voterCount: 0,
    });
  });

  it("rejects invalid report ID for voting", () => {
    const result = contract.initiateVoting(0);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_REPORT_ID);
  });

  it("rejects vote for non-existent report", () => {
    const result = contract.castVote(1, VOTE_APPROVE, 100);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_REPORT_NOT_FOUND);
  });

  it("rejects invalid vote type", () => {
    contract.initiateVoting(1);
    const result = contract.castVote(1, 3, 100);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_VOTE);
  });

  it("rejects insufficient stake", () => {
    contract.initiateVoting(1);
    const result = contract.castVote(1, VOTE_APPROVE, 99);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_STAKE_AMOUNT);
  });

  it("rejects vote after voting closed", () => {
    contract.initiateVoting(1);
    contract.blockHeight = 145;
    const result = contract.castVote(1, VOTE_APPROVE, 100);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_VOTING_CLOSED);
  });

  it("rejects duplicate vote", () => {
    contract.initiateVoting(1);
    contract.castVote(1, VOTE_APPROVE, 100);
    const result = contract.castVote(1, VOTE_REJECT, 100);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_ALREADY_VOTED);
  });

  it("rejects vote when max votes exceeded", () => {
    contract.initiateVoting(1);
    contract.state.votingPools.set(1, {
      reportId: 1,
      startTime: 0,
      endTime: 144,
      totalStake: 0,
      approveStake: 0,
      rejectStake: 0,
      status: STATUS_PENDING,
      voterCount: 100,
    });
    const result = contract.castVote(1, VOTE_APPROVE, 100);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_MAX_VOTES_EXCEEDED);
  });

  it("approves report on consensus", () => {
    contract.initiateVoting(1);
    contract.castVote(1, VOTE_APPROVE, 100);
    contract.castVote(1, VOTE_APPROVE, 200);
    contract.caller = "ST2TEST";
    contract.castVote(1, VOTE_APPROVE, 300);
    expect(contract.state.votingPools.get(1)?.status).toBe(STATUS_APPROVED);
    expect(contract.events).toContainEqual({ event: "consensus-approved", reportId: 1 });
  });

  it("rejects report on consensus", () => {
    contract.initiateVoting(1);
    contract.castVote(1, VOTE_REJECT, 100);
    contract.castVote(1, VOTE_REJECT, 200);
    contract.caller = "ST2TEST";
    contract.castVote(1, VOTE_REJECT, 300);
    expect(contract.state.votingPools.get(1)?.status).toBe(STATUS_REJECTED);
    expect(contract.events).toContainEqual({ event: "consensus-rejected", reportId: 1 });
  });

  it("challenges approved report", () => {
    contract.initiateVoting(1);
    contract.castVote(1, VOTE_APPROVE, 100);
    contract.castVote(1, VOTE_APPROVE, 200);
    contract.caller = "ST2TEST";
    contract.castVote(1, VOTE_APPROVE, 300);
    const result = contract.challengeReport(1, "Invalid data");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.disputedReports.get(1)).toEqual({
      challenger: "ST2TEST",
      reason: "Invalid data",
      timestamp: 0,
      resolved: false,
    });
    expect(contract.events).toContainEqual({ event: "report-challenged", reportId: 1 });
  });

  it("rejects challenge for non-approved report", () => {
    contract.initiateVoting(1);
    const result = contract.challengeReport(1, "Invalid data");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_STATUS);
  });

  it("withdraws stake successfully", () => {
    contract.initiateVoting(1);
    contract.castVote(1, VOTE_APPROVE, 100);
    contract.castVote(1, VOTE_APPROVE, 200);
    contract.caller = "ST2TEST";
    contract.castVote(1, VOTE_APPROVE, 300);
    contract.blockHeight = 145;
    contract.caller = "ST1TEST";
    const result = contract.withdrawStake(1);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.votes.get("1-ST1TEST")).toBeUndefined();
    expect(contract.transfers).toContainEqual({ amount: 100, from: "contract", to: "ST1TEST" });
    expect(contract.events).toContainEqual({ event: "stake-withdrawn", reportId: 1, voter: "ST1TEST" });
  });

  it("rejects withdraw stake before voting closed", () => {
    contract.initiateVoting(1);
    contract.castVote(1, VOTE_APPROVE, 100);
    const result = contract.withdrawStake(1);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_VOTING_CLOSED);
  });

  it("gets pool status correctly", () => {
    contract.initiateVoting(1);
    const result = contract.getPoolStatus(1);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(STATUS_PENDING);
  });
});