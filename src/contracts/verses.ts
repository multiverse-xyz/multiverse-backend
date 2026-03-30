export const versesAbi = [
  {
    type: 'event',
    name: 'PartitionCreated',
    inputs: [
      { name: 'conditionId', type: 'bytes32', indexed: true },
      { name: 'oracle', type: 'address', indexed: true },
      { name: 'questionId', type: 'bytes32', indexed: false },
      { name: 'outcomeCount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PartitionResolved',
    inputs: [
      { name: 'conditionId', type: 'bytes32', indexed: true },
      { name: 'winningVerseId', type: 'bytes32', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'TokenEnabled',
    inputs: [
      { name: 'proxyAddress', type: 'address', indexed: true },
      { name: 'verseId', type: 'bytes32', indexed: true },
      { name: 'token', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'TokenDeposited',
    inputs: [
      { name: 'token', type: 'address', indexed: true },
      { name: 'depositor', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'conditionId', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TokenWithdrawn',
    inputs: [
      { name: 'token', type: 'address', indexed: true },
      { name: 'withdrawer', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'conditionId', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PositionDeposited',
    inputs: [
      { name: 'depositor', type: 'address', indexed: true },
      { name: 'conditionId', type: 'bytes32', indexed: false },
      { name: 'index', type: 'uint256', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PositionWithdrawn',
    inputs: [
      { name: 'withdrawer', type: 'address', indexed: true },
      { name: 'conditionId', type: 'bytes32', indexed: false },
      { name: 'index', type: 'uint256', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'function',
    name: 'getPartition',
    stateMutability: 'view',
    inputs: [{ name: 'conditionId', type: 'bytes32' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'outcomeCount', type: 'uint256' },
          { name: 'isResolved', type: 'bool' },
          { name: 'winningVerseId', type: 'bytes32' },
          { name: 'childIds', type: 'bytes32[]' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getTokenAddress',
    stateMutability: 'view',
    inputs: [
      { name: 'verseId', type: 'bytes32' },
      { name: 'token', type: 'address' },
    ],
    outputs: [{ type: 'address' }],
  },
] as const
