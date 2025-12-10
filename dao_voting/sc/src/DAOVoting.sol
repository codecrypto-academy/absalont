// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

/**
 * @title DAOVoting
 * @dev DAO contract with gasless voting using ERC2771 meta-transactions
 */
contract DAOVoting is ERC2771Context {
    enum VoteType {
        A_FAVOR,
        EN_CONTRA,
        ABSTENCION
    }

    struct Proposal {
        uint256 id;
        address recipient;
        uint256 amount;
        uint256 deadline;
        uint256 votesAFavor;
        uint256 votesEnContra;
        uint256 votesAbstencion;
        bool executed;
        uint256 createdAt;
    }

    uint256 private _proposalCounter;
    mapping(uint256 => Proposal) private _proposals;
    mapping(address => uint256) private _balances;
    mapping(uint256 => mapping(address => bool)) private _hasVoted;
    mapping(uint256 => mapping(address => VoteType)) private _userVotes;

    uint256 public totalDAOBalance;
    uint256 public constant SAFETY_PERIOD = 1 hours;
    uint256 public constant MIN_PROPOSAL_PERCENTAGE = 10; // 10%

    event DAOFunded(address indexed funder, uint256 amount);
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed recipient,
        uint256 amount,
        uint256 deadline
    );
    event Voted(
        uint256 indexed proposalId,
        address indexed voter,
        VoteType voteType
    );
    event ProposalExecuted(
        uint256 indexed proposalId,
        address indexed recipient,
        uint256 amount
    );

    error InsufficientBalance(uint256 required, uint256 available);
    error ProposalNotFound(uint256 proposalId);
    error DeadlineNotPassed(uint256 deadline, uint256 currentTime);
    error DeadlineAlreadyPassed(uint256 deadline, uint256 currentTime);
    error ProposalAlreadyExecuted(uint256 proposalId);
    error ProposalNotApproved(uint256 votesAFavor, uint256 votesEnContra);
    error SafetyPeriodNotPassed(uint256 requiredTime, uint256 currentTime);
    error InsufficientDAOFunds(uint256 required, uint256 available);

    constructor(address trustedForwarder) ERC2771Context(trustedForwarder) {}

    function fundDAO() external payable {
        require(msg.value > 0, "Must send ETH");
        address sender = _msgSender();
        _balances[sender] += msg.value;
        totalDAOBalance += msg.value;
        emit DAOFunded(sender, msg.value);
    }

    function createProposal(
        address recipient,
        uint256 amount,
        uint256 deadline
    ) external returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(deadline > block.timestamp, "Deadline must be in the future");

        uint256 userBalance = _balances[_msgSender()];
        uint256 requiredBalance = (totalDAOBalance * MIN_PROPOSAL_PERCENTAGE) /
            100;

        if (userBalance < requiredBalance) {
            revert InsufficientBalance(requiredBalance, userBalance);
        }

        _proposalCounter++;
        uint256 proposalId = _proposalCounter;

        _proposals[proposalId] = Proposal({
            id: proposalId,
            recipient: recipient,
            amount: amount,
            deadline: deadline,
            votesAFavor: 0,
            votesEnContra: 0,
            votesAbstencion: 0,
            executed: false,
            createdAt: block.timestamp
        });

        emit ProposalCreated(proposalId, recipient, amount, deadline);
        return proposalId;
    }

    function vote(uint256 proposalId, VoteType voteType) external {
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.id == 0) revert ProposalNotFound(proposalId);
        if (block.timestamp >= proposal.deadline) {
            revert DeadlineAlreadyPassed(proposal.deadline, block.timestamp);
        }

        address voter = _msgSender();
        require(_balances[voter] > 0, "Must have balance to vote");

        // Si el usuario ya votó, restar su voto anterior
        if (_hasVoted[proposalId][voter]) {
            VoteType previousVote = _userVotes[proposalId][voter];
            if (previousVote == VoteType.A_FAVOR) {
                proposal.votesAFavor--;
            } else if (previousVote == VoteType.EN_CONTRA) {
                proposal.votesEnContra--;
            } else {
                proposal.votesAbstencion--;
            }
        }

        // Registrar nuevo voto
        _hasVoted[proposalId][voter] = true;
        _userVotes[proposalId][voter] = voteType;

        if (voteType == VoteType.A_FAVOR) {
            proposal.votesAFavor++;
        } else if (voteType == VoteType.EN_CONTRA) {
            proposal.votesEnContra++;
        } else {
            proposal.votesAbstencion++;
        }

        emit Voted(proposalId, voter, voteType);
    }

    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.id == 0) revert ProposalNotFound(proposalId);
        if (proposal.executed) revert ProposalAlreadyExecuted(proposalId);
        if (block.timestamp < proposal.deadline) {
            revert DeadlineNotPassed(proposal.deadline, block.timestamp);
        }

        uint256 safetyDeadline = proposal.deadline + SAFETY_PERIOD;
        if (block.timestamp < safetyDeadline) {
            revert SafetyPeriodNotPassed(safetyDeadline, block.timestamp);
        }

        if (proposal.votesAFavor <= proposal.votesEnContra) {
            revert ProposalNotApproved(
                proposal.votesAFavor,
                proposal.votesEnContra
            );
        }

        if (address(this).balance < proposal.amount) {
            revert InsufficientDAOFunds(proposal.amount, address(this).balance);
        }

        proposal.executed = true;
        totalDAOBalance -= proposal.amount;

        (bool success, ) = proposal.recipient.call{value: proposal.amount}("");
        require(success, "Transfer failed");

        emit ProposalExecuted(proposalId, proposal.recipient, proposal.amount);
    }

    function getProposal(
        uint256 proposalId
    ) external view returns (Proposal memory) {
        if (_proposals[proposalId].id == 0) revert ProposalNotFound(proposalId);
        return _proposals[proposalId];
    }

    function getUserBalance(address user) external view returns (uint256) {
        return _balances[user];
    }

    function hasUserVoted(
        uint256 proposalId,
        address user
    ) external view returns (bool) {
        return _hasVoted[proposalId][user];
    }

    function getUserVote(
        uint256 proposalId,
        address user
    ) external view returns (VoteType) {
        require(_hasVoted[proposalId][user], "User has not voted");
        return _userVotes[proposalId][user];
    }

    function getProposalCount() external view returns (uint256) {
        return _proposalCounter;
    }

    receive() external payable {
        address sender = _msgSender();
        _balances[sender] += msg.value;
        totalDAOBalance += msg.value;
        emit DAOFunded(sender, msg.value);
    }
}
