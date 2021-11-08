from brownie import chain

def test_deploy(election):
    """
    Test if the contract is correctly deployed.
    """

    assert election.registrationEnd() == 0
    assert election.votingEnd() == 0

def test_can_start(accounts, election):
    """
    Test if an election can be started.
    """

    tx = election.start({'from': accounts[0]})

    assert election.registrationEnd() > 0
    assert election.votingEnd() > election.registrationEnd()
    assert 'Start' in tx.events

def test_can_register(accounts, election):
    """
    Test if an account can register as a candidate.
    """

    election.start({'from': accounts[0]})

    assert election.isRegistered(accounts[0].address) == False

    tx = election.register({'from': accounts[0]})

    assert election.isRegistered(accounts[0].address) == True
    assert 'Register' in tx.events

def test_can_vote(accounts, election):
    """
    Test if an account can vote.
    """

    election.start({'from': accounts[0]})
    election.register({'from': accounts[0]})
    chain.sleep(election.periodDuration())

    assert election.hasVoted(accounts[0].address) == False
    assert election.numVotes(accounts[0].address) == 0

    tx = election.vote(accounts[0].address, {'from': accounts[0]})

    assert election.hasVoted(accounts[0].address) == True
    assert election.numVotes(accounts[0].address) == 1
    assert 'Vote' in tx.events

def test_num_candidates(accounts, election):
    """
    Test if the number of candidates is correctly retrieved.
    """

    election.start({'from': accounts[0]})

    assert election.numCandidates() == 0

    election.register({'from': accounts[0]})

    assert election.numCandidates() == 1
