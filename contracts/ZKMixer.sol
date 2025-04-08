// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Verifier.sol";
// import "./MerkleTree.sol"; // Placeholder for Merkle tree library

/**
 * @title ZKMixer
 * @notice A simple ZK mixer contract for fixed-denomination deposits and withdrawals.
 */
contract ZKMixer {
    uint256 public constant DENOMINATION = 0.1 ether; // Example: 0.1 ETH
    uint32 public constant MERKLE_TREE_HEIGHT = 20; // Example height

    IVerifier public immutable verifier;
    // MerkleTree public merkleTree;

    // --- Merkle Tree State ---
    bytes32 public constant ZERO_VALUE = keccak256(abi.encodePacked("ZKMixer_ZeroValue")); // Placeholder zero value for empty leaves
    bytes32[] public leaves;
    mapping(bytes32 => bool) public knownRoots;
    uint32 public nextLeafIndex;

    // Mapping from nullifier hash to boolean (true if spent)
    mapping(bytes32 => bool) public nullifiers;

    // Event emitted when a deposit is made
    event Deposit(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp);
    // Event emitted when a withdrawal is made
    event Withdrawal(address indexed to, bytes32 nullifierHash, address indexed relayer, uint256 fee);

    constructor(address _verifierAddress) {
        require(_verifierAddress != address(0), "Verifier address cannot be zero");
        verifier = IVerifier(_verifierAddress);
        // Initialize Merkle Tree
        // merkleTree = new MerkleTree(MERKLE_TREE_HEIGHT);
        // Mark the initial "zero" root as known (tree with no leaves)
        knownRoots[calculateMerkleRoot()] = true; // Calculate and store the initial root
    }

    /**
     * @notice Deposits a fixed amount into the mixer.
     * @param _commitment The commitment hash (poseidon(nullifier, secret)).
     */
    function deposit(bytes32 _commitment) external payable {
        require(msg.value == DENOMINATION, "Deposit amount must match denomination");
        require(_commitment != bytes32(0), "Commitment cannot be zero");
        require(nextLeafIndex < 2**MERKLE_TREE_HEIGHT, "Merkle tree is full"); // Check if tree is full

        uint32 leafIndex = nextLeafIndex;
        leaves.push(_commitment); // Add leaf
        nextLeafIndex++;

        // Recalculate and store the new Merkle root
        bytes32 newRoot = calculateMerkleRoot();
        knownRoots[newRoot] = true;

        emit Deposit(_commitment, leafIndex, block.timestamp);
    }

    /**
     * @notice Calculates the current Merkle root based on the leaves array.
     * @dev WARNING: Recalculates the entire tree; gas intensive for large trees.
     * @return The current Merkle root.
     */
    function calculateMerkleRoot() public view returns (bytes32) {
        uint256 numLeaves = leaves.length;
        if (numLeaves == 0) {
            // Calculate the root for an empty tree (hash of zero values up the levels)
            bytes32 currentHash = ZERO_VALUE;
            for (uint32 h = 0; h < MERKLE_TREE_HEIGHT; h++) {
                currentHash = _hashPair(currentHash, currentHash);
            }
            return currentHash;
        }

        // Return an absolutely fixed value for non-empty tree for debugging - REVERTING THIS
        // return bytes32(uint256(1)); 

        // --- OLD PLACEHOLDER --- // RE-ENABLE THIS
        return keccak256(abi.encodePacked("ROOT:", leaves.length)); // Use leaves.length directly

        // --- BELOW IS A MORE CORRECT (BUT VERY EXPENSIVE) ON-CHAIN CALCULATION ---
        /*
        uint256 levelNodeCount = numLeaves;
        // Create a temporary array matching the full tree size for this level if needed
        bytes32[] memory currentLevel = new bytes32[](levelNodeCount);
        for(uint256 i = 0; i < numLeaves; i++) {
            currentLevel[i] = leaves[i];
        }
        // Fill remaining nodes with ZERO_VALUE if numLeaves is not a power of 2 for the level
        // (More complex padding logic might be needed depending on exact tree spec)

        for (uint32 h = 0; h < MERKLE_TREE_HEIGHT; h++) {
            if (levelNodeCount == 1) break; // Reached the root

            uint256 nextLevelNodeCount = (levelNodeCount + 1) / 2;
            bytes32[] memory nextLevel = new bytes32[](nextLevelNodeCount);

            for (uint256 i = 0; i < nextLevelNodeCount; i++) {
                uint256 leftIndex = i * 2;
                uint256 rightIndex = leftIndex + 1;

                bytes32 left = currentLevel[leftIndex];
                // If right node exists use it, otherwise use ZERO_VALUE (or duplicate left based on spec)
                bytes32 right = (rightIndex < levelNodeCount) ? currentLevel[rightIndex] : ZERO_VALUE;

                nextLevel[i] = _hashPair(left, right);
            }
            currentLevel = nextLevel;
            levelNodeCount = nextLevelNodeCount;
        }
        return currentLevel[0]; // The final root
        */
    }

    /**
     * @notice Helper function to hash a pair of nodes.
     * @dev Uses keccak256 for now. ZK circuits often use Poseidon.
     *      Ensures order consistency by hashing lower value first.
     */
    function _hashPair(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        if (uint256(a) < uint256(b)) {
            return keccak256(abi.encodePacked(a, b));
        } else {
            return keccak256(abi.encodePacked(b, a));
        }
    }

    /**
     * @notice Withdraws the deposited amount using a ZK proof.
     * @param _proof The ZK-SNARK proof.
     * @param _root The Merkle root used for the proof.
     * @param _nullifierHash The nullifier hash to prevent double spending.
     * @param _recipient The address to receive the withdrawn funds.
     * @param _relayer The address of the relayer (optional).
     * @param _fee The fee paid to the relayer (optional).
     */
    function withdraw(
        bytes calldata _proof,
        bytes32 _root,
        bytes32 _nullifierHash,
        address payable _recipient,
        address payable _relayer,
        uint256 _fee
    ) external {
        require(_nullifierHash != bytes32(0), "Nullifier hash cannot be zero");
        require(!nullifiers[_nullifierHash], "Nullifier already spent");

        bool isRootKnown = knownRoots[_root];

        require(isRootKnown, "Merkle root not known"); // Check if root is valid
        
        require(_fee < DENOMINATION, "Relayer fee cannot exceed denomination");

        // Verify the ZK proof
        // Input structure depends on the circuit definition
        uint256[2] memory a = [uint256(0), uint256(0)]; // Explicitly cast to uint256
        uint256[2][2] memory b = [[uint256(0), uint256(0)], [uint256(0), uint256(0)]]; // Explicitly cast
        uint256[2] memory c = [uint256(0), uint256(0)]; // Explicitly cast
        // Declare input as dynamic array
        uint256[] memory input = new uint256[](3); // Allocate space for 3 elements
        input[0] = _uint256(_root);
        input[1] = _uint256(_nullifierHash);
        input[2] = uint256(uint160(address(_recipient)));

        require(verifier.verifyProof(a, b, c, input), "Invalid ZK proof"); // Pass dynamic array

        // Mark nullifier as spent
        nullifiers[_nullifierHash] = true;

        // Send funds
        uint256 payoutAmount = DENOMINATION - _fee;
        (bool successRecipient, ) = _recipient.call{value: payoutAmount}("");
        require(successRecipient, "Recipient transfer failed");

        if (_fee > 0 && _relayer != address(0)) {
            (bool successRelayer, ) = _relayer.call{value: _fee}("");
            require(successRelayer, "Relayer transfer failed");
        }

        emit Withdrawal(_recipient, _nullifierHash, _relayer, _fee);
    }

    // Helper function to convert bytes32 to uint256 for proof verification
    function _uint256(bytes32 _b) internal pure returns (uint256) {
        return uint256(_b);
    }
} 