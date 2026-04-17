const mongoose = require('mongoose');

/**
 * Contract — D2Farm
 * Stores the full, immutable record of a binding agricultural supply agreement
 * between a buyer and a farmer. Generated when a Proposal is accepted and escrow is locked.
 */
const ContractSchema = new mongoose.Schema({

    // ── Reference ─────────────────────────────────────────────────────────────
    contractNumber: {
        type: String,
        unique: true,
        required: true,
        // Format: D2F-YYYYMM-XXXXX e.g. D2F-202604-00001
    },
    proposalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proposal',
        required: true,
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
    },

    // ── Parties ───────────────────────────────────────────────────────────────
    buyer: {
        name:             { type: String, required: true },
        businessName:     { type: String, default: '' },
        gstNumber:        { type: String, default: '' },
        panNumber:        { type: String, default: '' },
        address:          { type: String, default: '' },
        city:             { type: String, default: '' },
        state:            { type: String, default: '' },
        pincode:          { type: String, default: '' },
        phone:            { type: String, default: '' },
        email:            { type: String, default: '' },
        walletAddress:    { type: String, default: '' },   // Ethereum/Polygon wallet
    },

    farmer: {
        name:             { type: String, required: true },
        fatherName:       { type: String, default: '' },
        farmName:         { type: String, default: '' },
        khasraNumber:     { type: String, default: '' },   // Land record number
        village:          { type: String, default: '' },
        tehsil:           { type: String, default: '' },
        district:         { type: String, default: '' },
        state:            { type: String, default: '' },
        pincode:          { type: String, default: '' },
        phone:            { type: String, default: '' },
        aadharLast4:      { type: String, default: '' },   // Last 4 digits only
        bankAccountLast4: { type: String, default: '' },
        ifscCode:         { type: String, default: '' },
        walletAddress:    { type: String, default: '' },
    },

    // ── Produce Details ───────────────────────────────────────────────────────
    produce: {
        cropName:          { type: String, required: true },
        variety:           { type: String, default: '' },
        grade:             { type: String, default: 'Standard', enum: ['A+', 'A', 'B', 'Standard', 'Export Quality'] },
        quantityKg:        { type: Number, required: true },
        pricePerKg:        { type: Number, required: true },    // INR/kg agreed price
        mspPerKg:          { type: Number, default: 0 },        // Govt MSP at time of contract
        harvestPeriod:     { type: String, default: '' },       // e.g. "April 2026"
        expectedHarvestDate: { type: Date },
        deliveryLocation:  { type: String, default: '' },
        packagingType:     { type: String, default: 'Jute Bags' },
        qualityParameters: {
            moistureMaxPct:   { type: Number, default: 12 },
            foreignMatterMaxPct: { type: Number, default: 2 },
            shrinkageAllowedPct: { type: Number, default: 3 },
        },
    },

    // ── Financial Terms ───────────────────────────────────────────────────────
    financials: {
        totalContractValue:  { type: Number, required: true },   // INR
        escrowAmount:        { type: Number, required: true },   // 2% of totalContractValue
        remainingBalance:    { type: Number, required: true },   // 98% — paid on delivery
        currency:            { type: String, default: 'INR' },
        paymentMode:         { type: String, default: 'NEFT/IMPS', enum: ['NEFT/IMPS', 'UPI', 'RTGS', 'Cheque', 'Crypto'] },
        penaltyClause:       { type: String, default: '2% of contract value forfeited on cancellation post-acceptance' },
        latePenaltyPerDay:   { type: Number, default: 500 },     // INR per day late
    },

    // ── Blockchain Verification ────────────────────────────────────────────────
    blockchain: {
        network:             { type: String, default: 'Polygon' },
        contractAddress:     { type: String, default: '' },
        transactionHash:     { type: String, default: '' },
        blockNumber:         { type: Number, default: 0 },
        tokenStandard:       { type: String, default: 'ERC-20 Escrow' },
        escrowWalletAddress: { type: String, default: '' },
        timestampOnChain:    { type: Date },
        verificationUrl:     { type: String, default: '' },   // Polygonscan URL
    },

    // ── Contract Status & Lifecycle ────────────────────────────────────────────
    status: {
        type: String,
        enum: ['DRAFT', 'ACTIVE', 'DELIVERED', 'COMPLETED', 'DISPUTED', 'CANCELLED'],
        default: 'ACTIVE',
    },
    timeline: [{
        event:     { type: String },
        timestamp: { type: Date, default: Date.now },
        note:      { type: String },
        txHash:    { type: String },
    }],

    // ── Legal ─────────────────────────────────────────────────────────────────
    governingLaw:      { type: String, default: 'Laws of India' },
    jurisdiction:      { type: String, default: 'Courts of Maharashtra, India' },
    arbitrationClause: { type: String, default: 'Any disputes shall be resolved by mutual arbitration under the Arbitration and Conciliation Act, 1996.' },
    specialConditions: { type: String, default: '' },

    // ── Signatures ────────────────────────────────────────────────────────────
    signatures: {
        buyerSigned:    { type: Boolean, default: false },
        farmerSigned:   { type: Boolean, default: false },
        buyerSignedAt:  { type: Date },
        farmerSignedAt: { type: Date },
        witnessName:    { type: String, default: 'D2Farm Platform (Digital Witness)' },
    },

    // ── Metadata ──────────────────────────────────────────────────────────────
    contractDate:   { type: Date, default: Date.now },
    expiryDate:     { type: Date },
    issuedBy:       { type: String, default: 'D2Farm Procurement Platform' },
    version:        { type: String, default: '1.0' },

}, { timestamps: true });

// Auto-generate contract number before save
ContractSchema.pre('save', async function (next) {
    if (!this.contractNumber) {
        const now = new Date();
        const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        const count = await mongoose.model('Contract').countDocuments();
        this.contractNumber = `D2F-${ym}-${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

// Virtual: total paid on escrow lock
ContractSchema.virtual('escrowPct').get(function () {
    return ((this.financials.escrowAmount / this.financials.totalContractValue) * 100).toFixed(1);
});

ContractSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Contract', ContractSchema);
