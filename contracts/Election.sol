// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

contract Election {
    uint public constant periodDuration = 60; // 1 min

    uint public registrationEnd;
    uint public votingEnd;

    address[] public candidates;
    address[] public voters;

    mapping(address => bool) public isRegistered;
    mapping(address => bool) public hasVoted;
    mapping(address => uint) public numVotes;

    event Start();
    event Register();
    event Vote();

    function numCandidates() public view returns (uint) {
        return candidates.length;
    }

    function start() public {
        require(block.timestamp >= votingEnd, 'There is an active election.');

        // calculate period end times
        registrationEnd = block.timestamp + periodDuration;
        votingEnd = registrationEnd + periodDuration;

        // reset candidate mappings
        for (uint i = 0; i < candidates.length; ++i) {
            isRegistered[candidates[i]] = false;
            numVotes[candidates[i]] = 0;
        }

        // reset voter mappings
        for (uint i = 0; i < voters.length; ++i) {
            hasVoted[voters[i]] = false;
        }

        // reset arrays
        delete candidates;
        delete voters;

        emit Start();
    }

    function register() public {
        require(block.timestamp < registrationEnd, 'The registration period has ended.');
        require(!isRegistered[msg.sender], 'You have already registered.');

        // register candidate
        candidates.push(msg.sender);
        isRegistered[msg.sender] = true;

        emit Register();
    }

    function vote(address candidate) public {
        require(block.timestamp >= registrationEnd, 'The voting period has not started.');
        require(block.timestamp < votingEnd, 'The voting period has ended.');
        require(isRegistered[candidate], 'The candidate is not registered.');
        require(!hasVoted[msg.sender], 'You have already voted.');

        // process vote
        ++numVotes[candidate];
        voters.push(msg.sender);
        hasVoted[msg.sender] = true;

        emit Vote();
    }
}
