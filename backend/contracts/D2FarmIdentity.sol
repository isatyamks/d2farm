// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title D2FarmIdentity
 * @dev Polygon-compatible ERC-721 smart contract for:
 *   1. Soulbound Farmer ID NFTs (non-transferable identity verification)
 *   2. Farmland Verification NFTs (geo-stamped farm records)
 *
 * Designed for Account Abstraction (ERC-4337) — farmers interact via
 * custodial wallets, never handling gas fees or private keys directly.
 */
contract D2FarmIdentity is ERC721, ERC721URIStorage, Ownable {

    // ─── State ───
    uint256 private _farmerIdCounter;
    uint256 private _farmlandCounter;

    // Farmer ID range: 1 - 999,999
    // Farmland range: 1,000,000+
    uint256 constant FARMLAND_OFFSET = 1000000;

    // Soulbound: track which tokens are non-transferable
    mapping(uint256 => bool) public isSoulbound;

    // Farmer identity records
    struct FarmerRecord {
        address farmer;
        string govIdHash;       // SHA-256 hash of Gov ID (privacy-preserving)
        uint256 mintedAt;
    }

    // Farmland verification records
    struct FarmlandRecord {
        address farmer;
        int256 latitude;        // Scaled by 1e6 (e.g., 19076000 = 19.076)
        int256 longitude;       // Scaled by 1e6 (e.g., 72877700 = 72.8777)
        uint256 farmSizeAcres;  // Scaled by 100 (e.g., 250 = 2.5 acres)
        uint256 mintedAt;
    }

    mapping(uint256 => FarmerRecord) public farmerRecords;
    mapping(uint256 => FarmlandRecord) public farmlandRecords;
    mapping(address => uint256) public farmerToTokenId;
    mapping(address => uint256[]) public farmerFarmlands;

    // ─── Events ───
    event FarmerIdMinted(
        address indexed farmer,
        uint256 indexed tokenId,
        string govIdHash,
        uint256 timestamp
    );

    event FarmlandRecorded(
        address indexed farmer,
        uint256 indexed tokenId,
        int256 latitude,
        int256 longitude,
        uint256 timestamp
    );

    // ─── Constructor ───
    constructor() ERC721("D2Farm Identity", "D2FID") Ownable(msg.sender) {
        _farmerIdCounter = 0;
        _farmlandCounter = 0;
    }

    // ─── Farmer ID Minting (Soulbound) ───

    /**
     * @dev Mint a soulbound Farmer ID NFT. Only platform admin can mint.
     * @param farmer The farmer's custodial wallet address
     * @param govIdHash SHA-256 hash of the farmer's government ID
     * @param metadataURI IPFS URI containing farmer metadata
     */
    function mintFarmerId(
        address farmer,
        string calldata govIdHash,
        string calldata metadataURI
    ) external onlyOwner returns (uint256) {
        require(farmerToTokenId[farmer] == 0, "Farmer ID already minted");
        
        _farmerIdCounter++;
        uint256 tokenId = _farmerIdCounter;

        _safeMint(farmer, tokenId);
        _setTokenURI(tokenId, metadataURI);

        // Mark as soulbound (non-transferable)
        isSoulbound[tokenId] = true;

        // Store record
        farmerRecords[tokenId] = FarmerRecord({
            farmer: farmer,
            govIdHash: govIdHash,
            mintedAt: block.timestamp
        });

        farmerToTokenId[farmer] = tokenId;

        emit FarmerIdMinted(farmer, tokenId, govIdHash, block.timestamp);
        return tokenId;
    }

    // ─── Farmland Record Minting ───

    /**
     * @dev Mint a Farmland Verification NFT with GPS coordinates.
     * @param farmer The farmer's custodial wallet address
     * @param latitude GPS latitude scaled by 1e6
     * @param longitude GPS longitude scaled by 1e6
     * @param farmSizeAcres Farm size in acres (scaled by 100)
     * @param metadataURI IPFS URI containing farmland metadata
     */
    function mintFarmlandRecord(
        address farmer,
        int256 latitude,
        int256 longitude,
        uint256 farmSizeAcres,
        string calldata metadataURI
    ) external onlyOwner returns (uint256) {
        require(farmerToTokenId[farmer] != 0, "Farmer must have ID first");

        _farmlandCounter++;
        uint256 tokenId = FARMLAND_OFFSET + _farmlandCounter;

        _safeMint(farmer, tokenId);
        _setTokenURI(tokenId, metadataURI);

        // Store farmland record
        farmlandRecords[tokenId] = FarmlandRecord({
            farmer: farmer,
            latitude: latitude,
            longitude: longitude,
            farmSizeAcres: farmSizeAcres,
            mintedAt: block.timestamp
        });

        farmerFarmlands[farmer].push(tokenId);

        emit FarmlandRecorded(farmer, tokenId, latitude, longitude, block.timestamp);
        return tokenId;
    }

    // ─── View Functions ───

    function getFarmerRecord(uint256 tokenId) external view returns (FarmerRecord memory) {
        return farmerRecords[tokenId];
    }

    function getFarmlandRecord(uint256 tokenId) external view returns (FarmlandRecord memory) {
        return farmlandRecords[tokenId];
    }

    function getFarmerFarmlands(address farmer) external view returns (uint256[] memory) {
        return farmerFarmlands[farmer];
    }

    function isFarmerVerified(address farmer) external view returns (bool) {
        return farmerToTokenId[farmer] != 0;
    }

    // ─── Soulbound Transfer Override ───

    /**
     * @dev Override transfer to prevent soulbound token transfers.
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) but block transfers for soulbound tokens
        if (from != address(0) && isSoulbound[tokenId]) {
            revert("D2Farm: Farmer ID is soulbound and non-transferable");
        }
        
        return super._update(to, tokenId, auth);
    }

    // ─── Required Overrides ───

    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
