// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MinimalForwarder.sol";
import "../src/DAOVoting.sol";

contract DAOVotingTest is Test {
    MinimalForwarder public forwarder;
    DAOVoting public dao;
    
    address public user1;
    address public user2;
    address public user3;
    address public recipient;
    address public relayer;
    
    uint256 public user1PrivateKey = 0x1;
    uint256 public user2PrivateKey = 0x2;
    uint256 public user3PrivateKey = 0x3;
    
    function setUp() public {
        forwarder = new MinimalForwarder();
        dao = new DAOVoting(address(forwarder));
        
        user1 = vm.addr(user1PrivateKey);
        user2 = vm.addr(user2PrivateKey);
        user3 = vm.addr(user3PrivateKey);
        recipient = makeAddr("recipient");
        relayer = makeAddr("relayer");
        
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(user3, 100 ether);
        vm.deal(relayer, 10 ether);
    }
    
    function testFundDAO() public {
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}();
        
        assertEq(dao.getUserBalance(user1), 10 ether);
        assertEq(dao.totalDAOBalance(), 10 ether);
        assertEq(address(dao).balance, 10 ether);
    }
    
    function testCreateProposalWithSufficientBalance() public {
        // Fund DAO
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}();
        
        // Create proposal (user1 has 100% of balance, needs 10%)
        vm.prank(user1);
        uint256 proposalId = dao.createProposal(recipient, 5 ether, block.timestamp + 1 days, "Test proposal");
        
        assertEq(proposalId, 1);
        assertEq(dao.getProposalCount(), 1);
        
        DAOVoting.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(proposal.id, 1);
        assertEq(proposal.recipient, recipient);
        assertEq(proposal.amount, 5 ether);
        assertFalse(proposal.executed);
    }
    
    function test_RevertWhen_CreateProposalWithInsufficientBalance() public {
        // User1 funds 10 ether
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}();
        
        // User2 tries to create proposal without having 10% of balance
        vm.prank(user2);
        vm.expectRevert(abi.encodeWithSignature("InsufficientBalance(uint256,uint256)", 1 ether, 0));
        dao.createProposal(recipient, 1 ether, block.timestamp + 1 days, "Test proposal");
    }
    
    function testVote() public {
        // Setup
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}();
        
        vm.prank(user2);
        dao.fundDAO{value: 5 ether}();
        
        vm.prank(user1);
        uint256 proposalId = dao.createProposal(recipient, 3 ether, block.timestamp + 1 days, "Test proposal");
        
        // User1 votes A FAVOR
        vm.prank(user1);
        dao.vote(proposalId, DAOVoting.VoteType.A_FAVOR);
        
        // User2 votes EN CONTRA
        vm.prank(user2);
        dao.vote(proposalId, DAOVoting.VoteType.EN_CONTRA);
        
        DAOVoting.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(proposal.votesAFavor, 1);
        assertEq(proposal.votesEnContra, 1);
        assertEq(proposal.votesAbstencion, 0);
    }
    
    function testChangeVote() public {
        // Setup
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}();
        
        vm.prank(user1);
        uint256 proposalId = dao.createProposal(recipient, 3 ether, block.timestamp + 1 days, "Test proposal");
        
        // User1 votes A FAVOR
        vm.prank(user1);
        dao.vote(proposalId, DAOVoting.VoteType.A_FAVOR);
        
        DAOVoting.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(proposal.votesAFavor, 1);
        assertEq(proposal.votesEnContra, 0);
        
        // User1 changes vote to EN CONTRA
        vm.prank(user1);
        dao.vote(proposalId, DAOVoting.VoteType.EN_CONTRA);
        
        proposal = dao.getProposal(proposalId);
        assertEq(proposal.votesAFavor, 0);
        assertEq(proposal.votesEnContra, 1);
    }
    
    function test_RevertWhen_VoteAfterDeadline() public {
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}();
        
        vm.prank(user1);
        uint256 proposalId = dao.createProposal(recipient, 3 ether, block.timestamp + 1 days, "Test proposal");
        
        // Fast forward past deadline
        vm.warp(block.timestamp + 2 days);
        
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("DeadlineAlreadyPassed(uint256,uint256)", block.timestamp - 1 days, block.timestamp));
        dao.vote(proposalId, DAOVoting.VoteType.A_FAVOR);
    }
    
    function test_RevertWhen_VoteWithoutBalance() public {
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}();
        
        vm.prank(user1);
        uint256 proposalId = dao.createProposal(recipient, 3 ether, block.timestamp + 1 days, "Test proposal");
        
        // User2 tries to vote without balance
        vm.prank(user2);
        vm.expectRevert("Must have balance to vote");
        dao.vote(proposalId, DAOVoting.VoteType.A_FAVOR);
    }
    
    function testExecuteApprovedProposal() public {
        // Setup
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}();
        
        vm.prank(user2);
        dao.fundDAO{value: 5 ether}();
        
        vm.prank(user1);
        uint256 proposalId = dao.createProposal(recipient, 3 ether, block.timestamp + 1 days, "Test proposal");
        
        // Vote
        vm.prank(user1);
        dao.vote(proposalId, DAOVoting.VoteType.A_FAVOR);
        
        vm.prank(user2);
        dao.vote(proposalId, DAOVoting.VoteType.A_FAVOR);
        
        // Fast forward past deadline + safety period
        vm.warp(block.timestamp + 1 days + 1 hours + 1);
        
        uint256 recipientBalanceBefore = recipient.balance;
        
        // Execute proposal
        dao.executeProposal(proposalId);
        
        assertEq(recipient.balance, recipientBalanceBefore + 3 ether);
        
        DAOVoting.Proposal memory proposal = dao.getProposal(proposalId);
        assertTrue(proposal.executed);
    }
    
    function test_RevertWhen_ExecuteBeforeDeadline() public {
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}();
        
        vm.prank(user1);
        uint256 proposalId = dao.createProposal(recipient, 3 ether, block.timestamp + 1 days, "Test proposal");
        
        vm.prank(user1);
        dao.vote(proposalId, DAOVoting.VoteType.A_FAVOR);
        
        // Try to execute before deadline
        vm.expectRevert(abi.encodeWithSignature("DeadlineNotPassed(uint256,uint256)", block.timestamp + 1 days, block.timestamp));
        dao.executeProposal(proposalId);
    }
    
    function test_RevertWhen_ExecuteBeforeSafetyPeriod() public {
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}();
        
        vm.prank(user1);
        uint256 proposalId = dao.createProposal(recipient, 3 ether, block.timestamp + 1 days, "Test proposal");
        
        vm.prank(user1);
        dao.vote(proposalId, DAOVoting.VoteType.A_FAVOR);
        
        // Fast forward past deadline but not safety period
        vm.warp(block.timestamp + 1 days + 30 minutes);
        
        vm.expectRevert(abi.encodeWithSignature("SafetyPeriodNotPassed(uint256,uint256)", block.timestamp + 30 minutes, block.timestamp));
        dao.executeProposal(proposalId);
    }
    
    function test_RevertWhen_ExecuteRejectedProposal() public {
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}();
        
        vm.prank(user2);
        dao.fundDAO{value: 5 ether}();
        
        vm.prank(user1);
        uint256 proposalId = dao.createProposal(recipient, 3 ether, block.timestamp + 1 days, "Test proposal");
        
        // More votes against
        vm.prank(user1);
        dao.vote(proposalId, DAOVoting.VoteType.EN_CONTRA);
        
        vm.prank(user2);
        dao.vote(proposalId, DAOVoting.VoteType.EN_CONTRA);
        
        vm.warp(block.timestamp + 1 days + 1 hours + 1);
        
        vm.expectRevert(abi.encodeWithSignature("ProposalNotApproved(uint256,uint256)", 0, 2));
        dao.executeProposal(proposalId);
    }
    
    function test_RevertWhen_ExecuteProposalTwice() public {
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}();
        
        vm.prank(user1);
        uint256 proposalId = dao.createProposal(recipient, 3 ether, block.timestamp + 1 days, "Test proposal");
        
        vm.prank(user1);
        dao.vote(proposalId, DAOVoting.VoteType.A_FAVOR);
        
        vm.warp(block.timestamp + 1 days + 1 hours + 1);
        
        dao.executeProposal(proposalId);
        
        // Should fail
        vm.expectRevert(abi.encodeWithSignature("ProposalAlreadyExecuted(uint256)", 1));
        dao.executeProposal(proposalId);
    }
    
    function testGaslessVote() public {
        // Setup
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}();
        
        vm.prank(user1);
        uint256 proposalId = dao.createProposal(recipient, 3 ether, block.timestamp + 1 days, "Test proposal");
        
        // Prepare gasless vote
        bytes memory data = abi.encodeWithSelector(
            dao.vote.selector,
            proposalId,
            DAOVoting.VoteType.A_FAVOR
        );
        
        MinimalForwarder.ForwardRequest memory request = MinimalForwarder.ForwardRequest({
            from: user1,
            to: address(dao),
            value: 0,
            gas: 200000,
            nonce: forwarder.getNonce(user1),
            data: data
        });
        
        bytes32 digest = _getTypedDataHash(request);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1PrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Execute gasless vote
        vm.prank(relayer);
        (bool success,) = forwarder.execute(request, signature);
        assertTrue(success);
        
        // Verify vote was recorded
        DAOVoting.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(proposal.votesAFavor, 1);
        assertTrue(dao.hasUserVoted(proposalId, user1));
    }
    
    function _getTypedDataHash(MinimalForwarder.ForwardRequest memory request) internal view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)"),
                request.from,
                request.to,
                request.value,
                request.gas,
                request.nonce,
                keccak256(request.data)
            )
        );
        
        return keccak256(
            abi.encodePacked(
                "\x19\x01",
                forwarder.DOMAIN_SEPARATOR(),
                structHash
            )
        );
    }

    // --- NEW TESTS START ---

    function test_RevertWhen_CreateProposalInvalidRecipient() public {
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}();
        
        vm.prank(user1);
        vm.expectRevert("Invalid recipient");
        dao.createProposal(address(0), 1 ether, block.timestamp + 1 days, "Invalid recipient");
    }

    function test_RevertWhen_CreateProposalInvalidAmount() public {
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}();
        
        vm.prank(user1);
        vm.expectRevert("Amount must be greater than 0");
        dao.createProposal(recipient, 0, block.timestamp + 1 days, "Invalid amount");
    }

    function test_RevertWhen_CreateProposalInvalidDeadline() public {
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}();
        
        vm.prank(user1);
        vm.expectRevert("Deadline must be in the future");
        dao.createProposal(recipient, 1 ether, block.timestamp - 1, "Invalid deadline");
    }

    function test_RevertWhen_VoteNonExistentProposal() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("ProposalNotFound(uint256)", 999));
        dao.vote(999, DAOVoting.VoteType.A_FAVOR);
    }

    function test_RevertWhen_ExecuteNonExistentProposal() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("ProposalNotFound(uint256)", 999));
        dao.executeProposal(999);
    }

    function testVoteAbstention() public {
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}();
        
        vm.prank(user1);
        uint256 proposalId = dao.createProposal(recipient, 1 ether, block.timestamp + 1 days, "Test");

        vm.prank(user1);
        dao.vote(proposalId, DAOVoting.VoteType.ABSTENCION);

        DAOVoting.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(proposal.votesAbstencion, 1);
        assertEq(proposal.votesAFavor, 0);
        assertEq(proposal.votesEnContra, 0);
    }

    function testChangeVoteFromAbstention() public {
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}();
        
        vm.prank(user1);
        uint256 proposalId = dao.createProposal(recipient, 1 ether, block.timestamp + 1 days, "Test");

        vm.prank(user1);
        dao.vote(proposalId, DAOVoting.VoteType.ABSTENCION);

        vm.prank(user1);
        dao.vote(proposalId, DAOVoting.VoteType.A_FAVOR);

        DAOVoting.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(proposal.votesAbstencion, 0);
        assertEq(proposal.votesAFavor, 1);
    }

    function testChangeVoteToAbstention() public {
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}();
        
        vm.prank(user1);
        uint256 proposalId = dao.createProposal(recipient, 1 ether, block.timestamp + 1 days, "Test");

        vm.prank(user1);
        dao.vote(proposalId, DAOVoting.VoteType.A_FAVOR);

        vm.prank(user1);
        dao.vote(proposalId, DAOVoting.VoteType.ABSTENCION);

        DAOVoting.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(proposal.votesAFavor, 0);
        assertEq(proposal.votesAbstencion, 1);
    }

    function testChangeVoteFromEnContra() public {
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}();
        
        vm.prank(user1);
        uint256 proposalId = dao.createProposal(recipient, 1 ether, block.timestamp + 1 days, "Test");

        vm.prank(user1);
        dao.vote(proposalId, DAOVoting.VoteType.EN_CONTRA);

        vm.prank(user1);
        dao.vote(proposalId, DAOVoting.VoteType.A_FAVOR);

        DAOVoting.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(proposal.votesEnContra, 0);
        assertEq(proposal.votesAFavor, 1);
    }

    function test_RevertWhen_ExecuteInsufficientDAOFunds() public {
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}(); // Fund with 10

        vm.prank(user1);
        // Create proposal for 100 ether (more than balance but less than user balance if we didn't check user balance here logic wise, but logic checks DAO balance at execution)
        // Wait, logic checks:
        // createProposal: userBalance >= requiredBalance (10% of total) -> 1 ether. User has 10. OK.
        // executeProposal: address(this).balance < proposal.amount
        
        // Let's make a proposal that passes creation checks but fails execution check.
        // Total DAO balance: 10. 10% = 1. User has 10. OK.
        // But if we want proposal amount > 10, we can't create it if createProposal checked that...
        // createProposal DOES NOT check if DAO has enough funds at creation time! It only checks if user has enough "shares" to propose.
        // So we can propose 100 ether.
        
        uint256 proposalId = dao.createProposal(recipient, 100 ether, block.timestamp + 1 days, "Big spend");
        
        vm.prank(user1);
        dao.vote(proposalId, DAOVoting.VoteType.A_FAVOR);

        vm.warp(block.timestamp + 1 days + 1 hours + 1);

        vm.expectRevert(abi.encodeWithSignature("InsufficientDAOFunds(uint256,uint256)", 100 ether, 10 ether));
        dao.executeProposal(proposalId);
    }

    function test_RevertWhen_GetNonExistentProposal() public {
        vm.expectRevert(abi.encodeWithSignature("ProposalNotFound(uint256)", 999));
        dao.getProposal(999);
    }
    
    function test_RevertWhen_GetUserVoteNotVoted() public {
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}();

        vm.prank(user1);
        uint256 proposalId = dao.createProposal(recipient, 1 ether, block.timestamp + 1 days, "Test");
        
        vm.expectRevert("User has not voted");
        dao.getUserVote(proposalId, user1);
    }
}
