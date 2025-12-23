// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title X4PNToken
 * @dev ERC20 token for the X4PN VPN network rewards system
 * Users earn X4PN tokens as rewards for using the VPN service
 */
contract X4PNToken is ERC20, ERC20Burnable, Ownable {
    // Maximum supply: 1 billion tokens
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    // Mapping of authorized minters (VPN session contract)
    mapping(address => bool) public minters;
    
    event MinterAdded(address indexed account);
    event MinterRemoved(address indexed account);
    event RewardsMinted(address indexed to, uint256 amount, uint256 sessionId);
    
    constructor() ERC20("X4PN Token", "X4PN") Ownable(msg.sender) {
        // Mint initial supply to deployer for liquidity/team allocation
        // 10% of max supply = 100 million tokens
        _mint(msg.sender, 100_000_000 * 10**18);
    }
    
    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _;
    }
    
    /**
     * @dev Add a minter address (typically the VPN sessions contract)
     */
    function addMinter(address account) external onlyOwner {
        require(account != address(0), "Invalid address");
        require(!minters[account], "Already a minter");
        minters[account] = true;
        emit MinterAdded(account);
    }
    
    /**
     * @dev Remove a minter address
     */
    function removeMinter(address account) external onlyOwner {
        require(minters[account], "Not a minter");
        minters[account] = false;
        emit MinterRemoved(account);
    }
    
    /**
     * @dev Mint reward tokens to a user for VPN usage
     * @param to Address to receive tokens
     * @param amount Amount of tokens to mint
     * @param sessionId ID of the VPN session for tracking
     */
    function mintRewards(address to, uint256 amount, uint256 sessionId) external onlyMinter {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
        emit RewardsMinted(to, amount, sessionId);
    }
    
    /**
     * @dev Standard mint function for owner
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
    
    /**
     * @dev Returns the remaining mintable supply
     */
    function remainingMintableSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
}
