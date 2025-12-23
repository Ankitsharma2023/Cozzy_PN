// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

interface IX4PNToken {
    function mintRewards(address to, uint256 amount, uint256 sessionId) external;
}

/**
 * @title X4PNVpnSessions
 * @dev Manages VPN sessions with micropayment streaming using USDC
 * Rewards users with X4PN tokens for usage
 */
contract X4PNVpnSessions is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    IERC20 public immutable usdc;
    IX4PNToken public immutable x4pnToken;
    
    // Session counter for unique IDs
    uint256 public sessionCounter;
    
    // X4PN rewards rate: tokens per USDC spent (10x multiplier, 18 decimals)
    uint256 public rewardRate = 10 * 10**18;
    
    // Minimum session duration in seconds
    uint256 public minSessionDuration = 60;
    
    // Platform fee percentage (in basis points, 100 = 1%)
    uint256 public platformFeeBps = 500; // 5%
    
    // Fee recipient
    address public feeRecipient;
    
    struct Session {
        uint256 id;
        address user;
        address nodeOperator;
        uint256 ratePerSecond;      // USDC per second (6 decimals)
        uint256 startTime;
        uint256 lastSettledTime;
        uint256 totalPaid;
        uint256 totalDuration;
        bool isActive;
    }
    
    struct NodeOperator {
        bool isRegistered;
        uint256 totalEarned;
        uint256 sessionCount;
    }
    
    // User address => active session
    mapping(address => Session) public activeSessions;
    
    // Session ID => Session data
    mapping(uint256 => Session) public sessions;
    
    // Node operator data
    mapping(address => NodeOperator) public nodeOperators;
    
    // User balances (deposited USDC)
    mapping(address => uint256) public userBalances;
    
    // Events
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event SessionStarted(
        uint256 indexed sessionId,
        address indexed user,
        address indexed nodeOperator,
        uint256 ratePerSecond
    );
    event SessionSettled(
        uint256 indexed sessionId,
        uint256 amountPaid,
        uint256 duration,
        uint256 rewardsEarned
    );
    event SessionEnded(
        uint256 indexed sessionId,
        uint256 totalPaid,
        uint256 totalDuration
    );
    event NodeOperatorRegistered(address indexed operator);
    event NodeOperatorUnregistered(address indexed operator);
    event RewardRateUpdated(uint256 newRate);
    event PlatformFeeUpdated(uint256 newFeeBps);
    
    constructor(
        address _usdc,
        address _x4pnToken,
        address _feeRecipient
    ) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_x4pnToken != address(0), "Invalid X4PN address");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        
        usdc = IERC20(_usdc);
        x4pnToken = IX4PNToken(_x4pnToken);
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev Deposit USDC to use for VPN sessions
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be positive");
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        userBalances[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }
    
    /**
     * @dev Withdraw unused USDC balance
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be positive");
        require(userBalances[msg.sender] >= amount, "Insufficient balance");
        require(!activeSessions[msg.sender].isActive, "End active session first");
        
        userBalances[msg.sender] -= amount;
        usdc.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Register as a node operator
     */
    function registerAsOperator() external {
        require(!nodeOperators[msg.sender].isRegistered, "Already registered");
        nodeOperators[msg.sender].isRegistered = true;
        emit NodeOperatorRegistered(msg.sender);
    }
    
    /**
     * @dev Unregister as a node operator
     */
    function unregisterAsOperator() external {
        require(nodeOperators[msg.sender].isRegistered, "Not registered");
        nodeOperators[msg.sender].isRegistered = false;
        emit NodeOperatorUnregistered(msg.sender);
    }
    
    /**
     * @dev Start a VPN session with a node operator
     * @param nodeOperator Address of the VPN node operator
     * @param ratePerSecond Payment rate in USDC per second (6 decimals)
     */
    function startSession(
        address nodeOperator,
        uint256 ratePerSecond
    ) external nonReentrant {
        require(!activeSessions[msg.sender].isActive, "Session already active");
        require(nodeOperators[nodeOperator].isRegistered, "Operator not registered");
        require(ratePerSecond > 0, "Rate must be positive");
        require(userBalances[msg.sender] >= ratePerSecond * minSessionDuration, "Insufficient balance");
        
        sessionCounter++;
        uint256 sessionId = sessionCounter;
        
        Session memory newSession = Session({
            id: sessionId,
            user: msg.sender,
            nodeOperator: nodeOperator,
            ratePerSecond: ratePerSecond,
            startTime: block.timestamp,
            lastSettledTime: block.timestamp,
            totalPaid: 0,
            totalDuration: 0,
            isActive: true
        });
        
        activeSessions[msg.sender] = newSession;
        sessions[sessionId] = newSession;
        nodeOperators[nodeOperator].sessionCount++;
        
        emit SessionStarted(sessionId, msg.sender, nodeOperator, ratePerSecond);
    }
    
    /**
     * @dev Settle accumulated session costs and mint rewards
     * Can be called periodically to stream payments
     */
    function settleSession() external nonReentrant {
        Session storage session = activeSessions[msg.sender];
        require(session.isActive, "No active session");
        
        _settleInternal(session, session.totalDuration + (block.timestamp - session.lastSettledTime));
    }

    /**
     * @dev Settle session using an off-chain signature (x402 style)
     * Allows Node/Platform to claim funds authorized by User
     * Signature must sign: keccak256(abi.encodePacked(sessionId, totalAmount, totalDuration, address(this)))
     */
    function settleSessionWithSignature(
        uint256 sessionId,
        uint256 totalAmount,
        uint256 totalDuration,
        bytes calldata signature
    ) external nonReentrant {
        Session storage session = sessions[sessionId];
        require(session.isActive, "Session not active");
        require(totalAmount > session.totalPaid, "New amount must be greater");
        require(totalDuration >= session.totalDuration, "Invalid duration");

        // Verify Signature
        bytes32 messageHash = keccak256(abi.encodePacked(sessionId, totalAmount, totalDuration, address(this)));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        
        address signer = ethSignedMessageHash.recover(signature);
        require(signer == session.user, "Invalid signature");

        // Calculate delta
        uint256 amountDelta = totalAmount - session.totalPaid;
        
        // Settle
        _settleLogic(session, amountDelta, totalDuration);
        
        session.lastSettledTime = block.timestamp;
    }

    function _settleInternal(Session storage session, uint256 currentTotalDuration) internal {
        uint256 elapsed = block.timestamp - session.lastSettledTime;
        require(elapsed > 0, "Nothing to settle");
        
        uint256 cost = elapsed * session.ratePerSecond;
        if (cost > userBalances[session.user]) {
            cost = userBalances[session.user];
        }
        
        _settleLogic(session, cost, session.totalDuration + elapsed);
    }

    function _settleLogic(Session storage session, uint256 cost, uint256 newTotalDuration) internal {
        require(userBalances[session.user] >= cost, "Insufficient user balance");
        
        // Calculate platform fee
        uint256 platformFee = (cost * platformFeeBps) / 10000;
        uint256 operatorPayment = cost - platformFee;
        
        // Update balances
        userBalances[session.user] -= cost;
        
        // Transfer to operator and platform
        usdc.safeTransfer(session.nodeOperator, operatorPayment);
        if (platformFee > 0) {
            usdc.safeTransfer(feeRecipient, platformFee);
        }
        
        // Calculate and mint X4PN rewards
        uint256 rewards = (cost * rewardRate) / 10**6; 
        if (rewards > 0) {
            x4pnToken.mintRewards(session.user, rewards, session.id);
        }
        
        // Update session data
        session.totalPaid += cost;
        session.totalDuration = newTotalDuration;
        
        sessions[session.id] = session;
        if (session.isActive) {
             activeSessions[session.user] = session;
        }

        // Update operator stats
        nodeOperators[session.nodeOperator].totalEarned += operatorPayment;
        
        emit SessionSettled(session.id, cost, newTotalDuration, rewards);
        
        if (userBalances[session.user] == 0) {
            _endSession(session.user);
        }
    }
    
    /**
     * @dev End an active VPN session
     */
    function endSession() external nonReentrant {
        Session storage session = activeSessions[msg.sender];
        require(session.isActive, "No active session");
        
        // Settle any remaining time
        uint256 elapsed = block.timestamp - session.lastSettledTime;
        if (elapsed > 0 && userBalances[msg.sender] > 0) {
            uint256 cost = elapsed * session.ratePerSecond;
            if (cost > userBalances[msg.sender]) {
                cost = userBalances[msg.sender];
            }
            
            _settleLogic(session, cost, session.totalDuration + elapsed);
        }
        
        _endSession(msg.sender);
    }
    
    function _endSession(address user) internal {
        Session storage session = activeSessions[user];
        session.isActive = false;
        sessions[session.id] = session;
        
        emit SessionEnded(session.id, session.totalPaid, session.totalDuration);
        
        delete activeSessions[user];
    }
    
    /**
     * @dev Get session details by ID
     */
    function getSession(uint256 sessionId) external view returns (Session memory) {
        return sessions[sessionId];
    }
    
    /**
     * @dev Get active session for a user
     */
    function getActiveSession(address user) external view returns (Session memory) {
        return activeSessions[user];
    }
    
    /**
     * @dev Get current session cost (unsettled)
     */
    function getCurrentSessionCost(address user) external view returns (uint256) {
        Session storage session = activeSessions[user];
        if (!session.isActive) return 0;
        
        uint256 elapsed = block.timestamp - session.lastSettledTime;
        return elapsed * session.ratePerSecond;
    }
    
    // Admin functions
    
    function setRewardRate(uint256 newRate) external onlyOwner {
        rewardRate = newRate;
        emit RewardRateUpdated(newRate);
    }
    
    function setPlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "Fee too high"); // Max 10%
        platformFeeBps = newFeeBps;
        emit PlatformFeeUpdated(newFeeBps);
    }
    
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        feeRecipient = newRecipient;
    }
    
    function setMinSessionDuration(uint256 duration) external onlyOwner {
        minSessionDuration = duration;
    }
}
