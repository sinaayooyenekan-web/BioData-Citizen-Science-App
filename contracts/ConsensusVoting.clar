(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-REPORT-ID u101)
(define-constant ERR-INVALID-STAKE-AMOUNT u102)
(define-constant ERR-INVALID-VOTE u103)
(define-constant ERR-VOTING-CLOSED u104)
(define-constant ERR-INSUFFICIENT-STAKE u105)
(define-constant ERR-ALREADY-VOTED u106)
(define-constant ERR-REPORT-NOT-FOUND u107)
(define-constant ERR-INVALID-THRESHOLDS u108)
(define-constant ERR-INVALID-DEADLINE u109)
(define-constant ERR-INVALID-REPUTATION u110)
(define-constant ERR-INVALID-WEIGHT u111)
(define-constant ERR-CONTRACT-NOT-SET u112)
(define-constant ERR-TRANSFER-FAILED u113)
(define-constant ERR-INVALID-STATUS u114)
(define-constant ERR-INVALID-PARAM u115)
(define-constant ERR-MAX-VOTES-EXCEEDED u116)
(define-constant ERR-INVALID-START-TIME u117)
(define-constant ERR-INVALID-END-TIME u118)
(define-constant ERR-INVALID-VOTER u119)
(define-constant ERR-INVALID-REWARD u120)

(define-constant VOTE-APPROVE u1)
(define-constant VOTE-REJECT u2)
(define-constant STATUS-PENDING u0)
(define-constant STATUS-APPROVED u1)
(define-constant STATUS-REJECTED u2)

(define-data-var token-contract principal 'SP000000000000000000002Q6VF78)
(define-data-var reward-manager principal 'SP000000000000000000002Q6VF78)
(define-data-var user-registry principal 'SP000000000000000000002Q6VF78)
(define-data-var data-report principal 'SP000000000000000000002Q6VF78)
(define-data-var min-stake uint u100)
(define-data-var approval-threshold uint u66)
(define-data-var rejection-threshold uint u66)
(define-data-var voting-duration uint u144)
(define-data-var max-votes-per-report uint u100)

(define-map voting-pools
  uint
  {
    report-id: uint,
    start-time: uint,
    end-time: uint,
    total-stake: uint,
    approve-stake: uint,
    reject-stake: uint,
    status: uint,
    voter-count: uint
  }
)

(define-map votes
  { report-id: uint, voter: principal }
  {
    vote: uint,
    stake: uint,
    reputation-weight: uint,
    timestamp: uint
  }
)

(define-map disputed-reports
  uint
  {
    challenger: principal,
    reason: (string-utf8 256),
    timestamp: uint,
    resolved: bool
  }
)

(define-read-only (get-voting-pool (report-id uint))
  (map-get? voting-pools report-id)
)

(define-read-only (get-vote (report-id uint) (voter principal))
  (map-get? votes { report-id: report-id, voter: voter })
)

(define-read-only (get-dispute (report-id uint))
  (map-get? disputed-reports report-id)
)

(define-read-only (has-voted (report-id uint) (voter principal))
  (is-some (get-vote report-id voter))
)

(define-private (validate-stake (amount uint))
  (if (and (>= amount (var-get min-stake)) (> amount u0))
      (ok true)
      (err ERR-INVALID-STAKE-AMOUNT))
)

(define-private (validate-vote-type (vote uint))
  (if (or (is-eq vote VOTE-APPROVE) (is-eq vote VOTE-REJECT))
      (ok true)
      (err ERR-INVALID-VOTE))
)

(define-private (validate-deadline (pool { report-id: uint, start-time: uint, end-time: uint, total-stake: uint, approve-stake: uint, reject-stake: uint, status: uint, voter-count: uint }))
  (if (<= block-height (get end-time pool))
      (ok true)
      (err ERR-VOTING-CLOSED))
)

(define-private (validate-report-id (id uint))
  (if (> id u0)
      (ok true)
      (err ERR-INVALID-REPORT-ID))
)

(define-private (validate-thresholds (approve uint) (reject uint))
  (if (and (<= approve u100) (<= reject u100) (> approve u50) (> reject u50))
      (ok true)
      (err ERR-INVALID-THRESHOLDS))
)

(define-private (validate-duration (dur uint))
  (if (> dur u0)
      (ok true)
      (err ERR-INVALID-DEADLINE))
)

(define-private (validate-reputation (rep uint))
  (if (> rep u0)
      (ok true)
      (err ERR-INVALID-REPUTATION))
)

(define-private (validate-status (status uint))
  (if (or (is-eq status STATUS-PENDING) (is-eq status STATUS-APPROVED) (is-eq status STATUS-REJECTED))
      (ok true)
      (err ERR-INVALID-STATUS))
)

(define-private (validate-voter (voter principal))
  (if (not (is-eq voter tx-sender))
      (err ERR-INVALID-VOTER)
      (ok true))
)

(define-private (get-reputation (user principal))
  (ok u1)
)

(define-public (set-token-contract (contract principal))
  (if (is-eq tx-sender contract-caller)
      (begin
        (var-set token-contract contract)
        (ok true))
      (err ERR-NOT-AUTHORIZED))
)

(define-public (set-reward-manager (contract principal))
  (if (is-eq tx-sender contract-caller)
      (begin
        (var-set reward-manager contract)
        (ok true))
      (err ERR-NOT-AUTHORIZED))
)

(define-public (set-user-registry (contract principal))
  (if (is-eq tx-sender contract-caller)
      (begin
        (var-set user-registry contract)
        (ok true))
      (err ERR-NOT-AUTHORIZED))
)

(define-public (set-data-report (contract principal))
  (if (is-eq tx-sender contract-caller)
      (begin
        (var-set data-report contract)
        (ok true))
      (err ERR-NOT-AUTHORIZED))
)

(define-public (set-min-stake (amount uint))
  (if (is-eq tx-sender contract-caller)
      (begin
        (try! (validate-stake amount))
        (var-set min-stake amount)
        (ok true))
      (err ERR-NOT-AUTHORIZED))
)

(define-public (set-thresholds (approve uint) (reject uint))
  (if (is-eq tx-sender contract-caller)
      (begin
        (try! (validate-thresholds approve reject))
        (var-set approval-threshold approve)
        (var-set rejection-threshold reject)
        (ok true))
      (err ERR-NOT-AUTHORIZED))
)

(define-public (set-voting-duration (dur uint))
  (if (is-eq tx-sender contract-caller)
      (begin
        (try! (validate-duration dur))
        (var-set voting-duration dur)
        (ok true))
      (err ERR-NOT-AUTHORIZED))
)

(define-public (initiate-voting (report-id uint))
  (let ((start block-height)
        (end (+ block-height (var-get voting-duration))))
    (try! (validate-report-id report-id))
    (asserts! (is-none (get-voting-pool report-id)) (err ERR-INVALID-PARAM))
    (map-set voting-pools report-id
      {
        report-id: report-id,
        start-time: start,
        end-time: end,
        total-stake: u0,
        approve-stake: u0,
        reject-stake: u0,
        status: STATUS-PENDING,
        voter-count: u0
      })
    (print { event: "voting-initiated", report-id: report-id })
    (ok true))
)

(define-public (cast-vote (report-id uint) (vote uint) (stake uint))
  (let ((pool-opt (get-voting-pool report-id))
        (pool (unwrap! pool-opt (err ERR-REPORT-NOT-FOUND)))
        (rep (unwrap! (get-reputation tx-sender) (err ERR-INVALID-REPUTATION)))
        (weighted-stake (* stake rep)))
    (try! (validate-vote-type vote))
    (try! (validate-stake stake))
    (try! (validate-deadline pool))
    (try! (validate-voter tx-sender))
    (asserts! (not (has-voted report-id tx-sender)) (err ERR-ALREADY-VOTED))
    (asserts! (< (get voter-count pool) (var-get max-votes-per-report)) (err ERR-MAX-VOTES-EXCEEDED))
    (try! (contract-call? (var-get token-contract) transfer stake tx-sender (as-contract tx-sender) none))
    (map-set votes { report-id: report-id, voter: tx-sender }
      {
        vote: vote,
        stake: stake,
        reputation-weight: rep,
        timestamp: block-height
      })
    (map-set voting-pools report-id
      (merge pool
        {
          total-stake: (+ (get total-stake pool) weighted-stake),
          approve-stake: (if (is-eq vote VOTE-APPROVE) (+ (get approve-stake pool) weighted-stake) (get approve-stake pool)),
          reject-stake: (if (is-eq vote VOTE-REJECT) (+ (get reject-stake pool) weighted-stake) (get reject-stake pool)),
          voter-count: (+ (get voter-count pool) u1)
        }))
    (print { event: "vote-cast", report-id: report-id, voter: tx-sender, vote: vote })
    (try! (check-consensus report-id))
    (ok true)))

(define-private (check-consensus (report-id uint))
  (let ((pool-opt (get-voting-pool report-id))
        (pool (unwrap! pool-opt (err ERR-REPORT-NOT-FOUND)))
        (approve-pct (if (> (get total-stake pool) u0) (/ (* (get approve-stake pool) u100) (get total-stake pool)) u0))
        (reject-pct (if (> (get total-stake pool) u0) (/ (* (get reject-stake pool) u100) (get total-stake pool)) u0)))
    (if (>= approve-pct (var-get approval-threshold))
        (begin
          (map-set voting-pools report-id (merge pool { status: STATUS-APPROVED }))
          (try! (distribute-rewards report-id VOTE-APPROVE))
          (print { event: "consensus-approved", report-id: report-id })
          (ok STATUS-APPROVED))
        (if (>= reject-pct (var-get rejection-threshold))
            (begin
              (map-set voting-pools report-id (merge pool { status: STATUS-REJECTED }))
              (try! (distribute-rewards report-id VOTE-REJECT))
              (print { event: "consensus-rejected", report-id: report-id })
              (ok STATUS-REJECTED))
            (ok STATUS-PENDING)))))

(define-private (distribute-rewards (report-id uint) (winning-vote uint))
  (let ((pool (unwrap! (get-voting-pool report-id) (err ERR-REPORT-NOT-FOUND))))
    (if (is-eq (get status pool) STATUS-PENDING)
        (ok true)
        (begin
          (print { event: "rewards-distributed", report-id: report-id })
          (ok true)))))

(define-public (challenge-report (report-id uint) (reason (string-utf8 256)))
  (let ((pool-opt (get-voting-pool report-id))
        (pool (unwrap! pool-opt (err ERR-REPORT-NOT-FOUND))))
    (asserts! (is-eq (get status pool) STATUS-APPROVED) (err ERR-INVALID-STATUS))
    (asserts! (is-none (get-dispute report-id)) (err ERR-INVALID-PARAM))
    (map-set disputed-reports report-id
      {
        challenger: tx-sender,
        reason: reason,
        timestamp: block-height,
        resolved: false
      })
    (print { event: "report-challenged", report-id: report-id })
    (ok true)))

(define-public (resolve-dispute (report-id uint) (resolve-approved bool))
  (let ((dispute-opt (get-dispute report-id))
        (dispute (unwrap! dispute-opt (err ERR-REPORT-NOT-FOUND)))
        (pool (unwrap! (get-voting-pool report-id) (err ERR-REPORT-NOT-FOUND))))
    (asserts! (is-eq tx-sender contract-caller) (err ERR-NOT-AUTHORIZED))
    (asserts! (not (get resolved dispute)) (err ERR-INVALID-STATUS))
    (map-set disputed-reports report-id (merge dispute { resolved: true }))
    (if resolve-approved
        (map-set voting-pools report-id (merge pool { status: STATUS-APPROVED }))
        (map-set voting-pools report-id (merge pool { status: STATUS-REJECTED })))
    (print { event: "dispute-resolved", report-id: report-id, approved: resolve-approved })
    (ok true)))

(define-public (withdraw-stake (report-id uint))
  (let ((vote-opt (get-vote report-id tx-sender))
        (vote (unwrap! vote-opt (err ERR-NOT-AUTHORIZED)))
        (pool (unwrap! (get-voting-pool report-id) (err ERR-REPORT-NOT-FOUND))))
    (asserts! (> block-height (get end-time pool)) (err ERR-VOTING-CLOSED))
    (asserts! (or (is-eq (get status pool) STATUS-APPROVED) (is-eq (get status pool) STATUS-REJECTED)) (err ERR-INVALID-STATUS))
    (try! (as-contract (contract-call? (var-get token-contract) transfer (get stake vote) tx-sender tx-sender none)))
    (map-delete votes { report-id: report-id, voter: tx-sender })
    (print { event: "stake-withdrawn", report-id: report-id, voter: tx-sender })
    (ok true)))

(define-public (get-pool-status (report-id uint))
  (let ((pool (get-voting-pool report-id)))
    (match pool p (ok (get status p)) (err ERR-REPORT-NOT-FOUND))))

(define-public (get-total-votes (report-id uint))
  (let ((pool (get-voting-pool report-id)))
    (match pool p (ok (get voter-count p)) (err ERR-REPORT-NOT-FOUND))))

(define-public (get-approve-percentage (report-id uint))
  (let ((pool (unwrap! (get-voting-pool report-id) (err ERR-REPORT-NOT-FOUND))))
    (if (> (get total-stake pool) u0)
        (ok (/ (* (get approve-stake pool) u100) (get total-stake pool)))
        (ok u0))))

(define-public (get-reject-percentage (report-id uint))
  (let ((pool (unwrap! (get-voting-pool report-id) (err ERR-REPORT-NOT-FOUND))))
    (if (> (get total-stake pool) u0)
        (ok (/ (* (get reject-stake pool) u100) (get total-stake pool)))
        (ok u0))))

(define-public (is-voting-open (report-id uint))
  (let ((pool (unwrap! (get-voting-pool report-id) (err ERR-REPORT-NOT-FOUND))))
    (ok (and (<= block-height (get end-time pool)) (is-eq (get status pool) STATUS-PENDING)))))

(define-public (get-min-stake)
  (ok (var-get min-stake)))

(define-public (get-approval-threshold)
  (ok (var-get approval-threshold)))

(define-public (get-rejection-threshold)
  (ok (var-get rejection-threshold)))

(define-public (get-voting-duration)
  (ok (var-get voting-duration)))

(define-public (emergency-close-voting (report-id uint))
  (let ((pool (unwrap! (get-voting-pool report-id) (err ERR-REPORT-NOT-FOUND))))
    (asserts! (is-eq tx-sender contract-caller) (err ERR-NOT-AUTHORIZED))
    (map-set voting-pools report-id (merge pool { end-time: block-height, status: STATUS-REJECTED }))
    (print { event: "voting-closed-emergency", report-id: report-id })
    (ok true)))