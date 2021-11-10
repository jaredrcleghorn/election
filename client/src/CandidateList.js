import React from 'react'
import { Box, Button, EthAddress, Flex, Heading, Text } from 'rimble-ui'

export default function CandidateList({
  my,
  numVotes,
  onVoteButtonsClick,
  showCounts,
  showHeading,
  showRanks,
  showVoteButtons,
  voteButtonsDisabled,
}) {
  const numVotesEntries = Object.entries(numVotes).sort(
    (entry1, entry2) => entry2[1] - entry1[1]
  )
  const ranks = []

  for (let i = 0; i < numVotesEntries.length; ++i) {
    if (i === 0 || numVotesEntries[i][1] !== numVotesEntries[i - 1][1]) {
      ranks.push(i + 1)
    } else {
      ranks.push(ranks.at(-1))
    }
  }

  return (
    <Box my={my}>
      {showHeading && (
        <Heading as="h3" mt={0} mb={2}>
          Candidates
        </Heading>
      )}
      {Object.keys(numVotes).length === 0 ? (
        <Text color="gray">No candidates</Text>
      ) : (
        numVotesEntries.map(([candidate, count], i) => (
          <Flex alignItems="center" key={candidate} mx={4} my={2}>
            {showRanks && <Text width={25}>{ranks[i]}.</Text>}
            <EthAddress address={candidate} mx={3} />
            {showCounts && <Text width={25}>{count}</Text>}
            {showVoteButtons && (
              <Button
                disabled={voteButtonsDisabled}
                ml={3}
                onClick={e => onVoteButtonsClick(e, candidate)}
                px={1}
              >
                Vote
              </Button>
            )}
          </Flex>
        ))
      )}
    </Box>
  )
}
