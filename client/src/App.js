import React, { Component } from 'react'
import { Button, Flash, Flex, Heading, Loader, Progress } from 'rimble-ui'
import './App.css'
import { getWeb3 } from './getWeb3'
import map from './artifacts/deployments/map.json'
import { getEthereum } from './getEthereum'
import CandidateList from './CandidateList'

class App extends Component {
  state = {
    web3: null,
    accounts: null,
    chainid: null,
    registrationEnd: null,
    votingEnd: null,
    isRegistered: null,
    hasVoted: null,
    numVotes: null,
    now: null,
  }

  componentDidMount = async () => {
    // get time every second
    setInterval(() => this.setState({ now: Date.now() / 1000 }), 1000)

    // Get network provider and web3 instance.
    const web3 = await getWeb3()

    // Try and enable accounts (connect metamask)
    try {
      const ethereum = await getEthereum()
      ethereum.enable()
    } catch (e) {
      console.log(`Could not enable accounts. Interaction with contracts not available.
            Use a modern browser with a Web3 plugin to fix this issue.`)
      console.log(e)
    }

    // Use web3 to get the user's accounts
    const accounts = await web3.eth.getAccounts()

    // Get the current chain id
    const chainid = parseInt(await web3.eth.getChainId())

    this.setState(
      {
        web3,
        accounts,
        chainid,
      },
      await this.loadInitialContracts
    )
  }

  loadInitialContracts = async () => {
    // <=42 to exclude Kovan, <42 to include kovan
    if (this.state.chainid < 42) {
      // Wrong Network!
      return
    }
    console.log(this.state.chainid)

    var _chainID = 0
    if (this.state.chainid === 42) {
      _chainID = 42
    }
    if (this.state.chainid === 1337) {
      _chainID = 'dev'
    }
    console.log(_chainID)
    const election = await this.loadContract(_chainID, 'Election')

    if (!election) {
      return
    }

    this.periodDuration = await this.getInt(election, 'periodDuration')

    const registrationEnd = await this.getInt(election, 'registrationEnd')
    const votingEnd = await this.getInt(election, 'votingEnd')
    const isRegistered = await election.methods
      .isRegistered(this.state.accounts[0])
      .call()
    const hasVoted = await election.methods
      .hasVoted(this.state.accounts[0])
      .call()
    const numVotes = await this.getNumVotes(election)

    this.setState({
      election,
      registrationEnd,
      votingEnd,
      isRegistered,
      hasVoted,
      numVotes,
    })

    election.events.Start().on('data', this.onStart)
    election.events.Register().on('data', this.onRegister)
    election.events.Vote().on('data', this.onVote)
  }

  loadContract = async (chain, contractName) => {
    // Load a deployed contract instance into a web3 contract object
    const { web3 } = this.state

    // Get the address of the most recent deployment from the deployment map
    let address
    try {
      address = map[chain][contractName][0]
    } catch (e) {
      console.log(
        `Couldn't find any deployed contract "${contractName}" on the chain "${chain}".`
      )
      return undefined
    }

    // Load the artifact with the specified address
    let contractArtifact
    try {
      contractArtifact = await import(
        `./artifacts/deployments/${chain}/${address}.json`
      )
    } catch (e) {
      console.log(
        `Failed to load contract artifact "./artifacts/deployments/${chain}/${address}.json"`
      )
      return undefined
    }

    return new web3.eth.Contract(contractArtifact.abi, address)
  }

  getInt = async (election, prop) => {
    const method = election.methods[prop]
    const str = await method().call()
    return parseInt(str)
  }

  getNumVotes = async election => {
    const numCandidates = await election.methods.numCandidates().call()
    const numVotes = {}

    for (let i = 0; i < numCandidates; ++i) {
      const candidate = await election.methods.candidates(i).call()
      numVotes[candidate] = await election.methods.numVotes(candidate).call()
    }

    return numVotes
  }

  onStart = async e => {
    const { accounts, election } = this.state
    this.setState({
      registrationEnd: await this.getInt(election, 'registrationEnd'),
      votingEnd: await this.getInt(election, 'votingEnd'),
      isRegistered: await election.methods.isRegistered(accounts[0]).call(),
      hasVoted: await election.methods.hasVoted(accounts[0]).call(),
      numVotes: await this.getNumVotes(election),
    })
  }

  onRegister = async e => {
    const { accounts, election } = this.state
    this.setState({
      isRegistered: await election.methods.isRegistered(accounts[0]).call(),
      numVotes: await this.getNumVotes(election),
    })
  }

  onVote = async e => {
    const { accounts, election } = this.state
    this.setState({
      hasVoted: await election.methods.hasVoted(accounts[0]).call(),
      numVotes: await this.getNumVotes(election),
    })
  }

  start = async e => {
    const { accounts, election } = this.state
    e.preventDefault()
    await election.methods.start().send({ from: accounts[0] })
  }

  register = async e => {
    const { accounts, election } = this.state
    e.preventDefault()
    await election.methods.register().send({ from: accounts[0] })
  }

  vote = async (e, candidate) => {
    const { accounts, election } = this.state
    e.preventDefault()
    await election.methods.vote(candidate).send({ from: accounts[0], gas: 0 })
  }

  calculateProgressValue = end => (end - this.state.now) / this.periodDuration

  render() {
    const {
      web3,
      accounts,
      chainid,
      election,
      registrationEnd,
      votingEnd,
      isRegistered,
      hasVoted,
      numVotes,
      now,
    } = this.state

    if (!web3) {
      return <div>Loading Web3, accounts, and contracts...</div>
    }

    // <=42 to exclude Kovan, <42 to include Kovan
    if (isNaN(chainid) || chainid < 42) {
      return (
        <div>
          Wrong Network! Switch to your local RPC "Localhost: 8545" in your Web3
          provider (e.g. Metamask)
        </div>
      )
    }

    if (!election) {
      return (
        <div>
          Could not find a deployed contract. Check console for details.
        </div>
      )
    }

    const isAccountsUnlocked = accounts ? accounts.length > 0 : false

    return (
      <div className="App">
        <Heading as="h1">Election</Heading>
        <Flash mx={4} variant="info" width="auto">
          All candidate registration and voting happens on-chain. Anyone can
          start an election. There is a registration period and a voting period,
          each lasting {this.periodDuration} seconds. Anyone can register as a
          candidate during the registration period, and anyone can vote once
          during the voting period.
        </Flash>
        {!isAccountsUnlocked ? (
          <p>
            <strong>
              Connect with Metamask and refresh the page to be able to edit the
              storage fields.
            </strong>
          </p>
        ) : null}
        {now === null ? (
          <Loader mx="auto" mt={4} size={50} />
        ) : registrationEnd === 0 ? (
          <Button mt={4} onClick={this.start}>
            Start the First Election
          </Button>
        ) : (
          <Flex flexDirection="column" alignItems="center" mb={4}>
            {now < registrationEnd ? (
              <>
                <Heading mb={3}>Registration</Heading>
                <Progress
                  value={this.calculateProgressValue(registrationEnd)}
                />
                <CandidateList my={4} numVotes={numVotes} showHeading />
                <Button disabled={isRegistered} onClick={this.register}>
                  Register
                </Button>
              </>
            ) : now < votingEnd ? (
              <>
                <Heading mb={3}>Voting</Heading>
                <Progress value={this.calculateProgressValue(votingEnd)} />
                <CandidateList
                  my={4}
                  numVotes={numVotes}
                  onVoteButtonsClick={this.vote}
                  showCounts
                  showHeading
                  showRanks
                  showVoteButtons
                  voteButtonsDisabled={hasVoted}
                />
                {accounts[0] in numVotes && (
                  <Button
                    disabled={hasVoted}
                    onClick={async e => await this.vote(e, accounts[0])}
                  >
                    Vote for Myself
                  </Button>
                )}
              </>
            ) : (
              <>
                <Heading mb={2}>Results</Heading>
                <CandidateList numVotes={numVotes} showCounts showRanks />
                <Button mt={3} onClick={this.start}>
                  Start a New Election
                </Button>
              </>
            )}
          </Flex>
        )}
      </div>
    )
  }
}

export default App
