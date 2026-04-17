"use client";
import { useState, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ContractData {
    contractNumber: string;
    contractDate: string;
    expiryDate: string;
    status: string;
    buyer: {
        name: string; businessName: string; gstNumber: string; panNumber: string;
        address: string; city: string; state: string; pincode: string; phone: string; email: string;
    };
    farmer: {
        name: string; fatherName: string; farmName: string; khasraNumber: string;
        village: string; tehsil: string; district: string; state: string; phone: string;
        aadharLast4: string; bankAccountLast4: string; ifscCode: string;
    };
    produce: {
        cropName: string; variety: string; grade: string; quantityKg: number;
        pricePerKg: number; mspPerKg: number; harvestPeriod: string;
        deliveryLocation: string; packagingType: string;
        qualityParameters: { moistureMaxPct: number; foreignMatterMaxPct: number; shrinkageAllowedPct: number };
    };
    financials: {
        totalContractValue: number; escrowAmount: number; remainingBalance: number;
        currency: string; paymentMode: string; penaltyClause: string; latePenaltyPerDay: number;
    };
    blockchain: {
        network: string; transactionHash: string; blockNumber: number;
        tokenStandard: string; verificationUrl: string; contractAddress: string;
    };
    signatures: {
        buyerSigned: boolean; farmerSigned: boolean;
        buyerSignedAt: string; farmerSignedAt: string; witnessName: string;
    };
    governingLaw: string; jurisdiction: string; arbitrationClause: string; specialConditions: string;
    issuedBy: string; version: string;
}

interface Props {
    proposalId: string;
    cropName: string;
    onClose: () => void;
}

const fmt = (n: number) => n?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00';
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
const row = (label: string, val: string) => `<tr><td style="color:#555;width:38%;padding-bottom:3px;vertical-align:top">${label}</td><td style="font-weight:500;padding-bottom:3px">${val}</td></tr>`;

const buildContractHTML = (c: ContractData): string => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>AGRICULTURAL PRODUCE SUPPLY AGREEMENT - ${c.contractNumber}</title>
<style>
  @page { size: A4; margin: 18mm 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 10.5pt; color: #000; line-height: 1.5; background: #fff; padding: 0; text-align: justify; }
  .header { border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
  .logo { font-size: 24pt; font-weight: bold; letter-spacing: 2px; font-family: Georgia, serif; color: #000; }
  .company-info { font-size: 8pt; color: #333; line-height: 1.3; }
  .title-block { text-align: center; margin-bottom: 25px; }
  .contract-title { font-size: 14pt; font-weight: bold; text-decoration: underline; margin-bottom: 5px; }
  .contract-no { font-size: 10pt; font-weight: bold; }
  
  .section-title { font-size: 11pt; font-weight: bold; text-transform: uppercase; margin: 15px 0 8px 0; border-bottom: 1px solid #eee; padding-bottom: 2px; }
  .clause { margin-bottom: 12px; }
  .clause-num { font-weight: bold; margin-right: 5px; }
  
  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9.5pt; }
  th { background: #f2f2f2; border: 1px solid #999; padding: 6px 10px; text-align: left; font-weight: bold; }
  td { border: 1px solid #ccc; padding: 5px 10px; vertical-align: top; }
  
  .party-table td { border: none; padding: 2px 5px; }
  .party-container { display: flex; gap: 30px; margin-bottom: 20px; }
  .party-box { flex: 1; border: 1px solid #ddd; padding: 12px; border-radius: 2px; }
  .party-header { font-weight: bold; border-bottom: 1px solid #ddd; margin-bottom: 8px; padding-bottom: 3px; font-size: 9pt; }
  
  .signature-section { margin-top: 40px; display: flex; justify-content: space-between; gap: 30px; page-break-inside: avoid; }
  .sig-block { flex: 1; text-align: center; }
  .sig-line { border-bottom: 1px solid #000; height: 60px; margin-bottom: 10px; display: flex; align-items: flex-end; justify-content: center; }
  .sig-name { font-family: 'Brush Script MT', cursive; font-size: 20pt; color: #1a3a6e; }
  
  .footer { border-top: 1px solid #000; margin-top: 30px; padding-top: 10px; font-size: 8pt; color: #666; display: flex; justify-content: space-between; }
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80pt; color: rgba(0,0,0,0.03); z-index: -1; pointer-events: none; white-space: nowrap; }
  
  @media screen {
    body { max-width: 850px; margin: 30px auto; padding: 50px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
  }
</style>
</head>
<body>

<div class="watermark">D2FARM ORIGINAL</div>

<div class="header">
  <div>
    <div class="logo">D2FARM</div>
    <div class="company-info">
      <strong>D2FARM AGRICULTURAL PLATFORM</strong><br/>
      CIN: U01400MH2024PTC000001<br/>
      4th Floor, Agri Tower, BKC, Mumbai — 400051<br/>
      Verification: contracts.d2farm.in/${c.contractNumber}
    </div>
  </div>
  <div style="text-align: right">
    <div class="contract-no">Agreement Ref No: ${c.contractNumber}</div>
    <div class="company-info">Date of Execution: ${fmtDate(c.contractDate)}</div>
    <div class="company-info">Validity: Until ${fmtDate(c.expiryDate)}</div>
  </div>
</div>

<div class="title-block">
  <div class="contract-title">AGRICULTURAL PRODUCE SUPPLY AGREEMENT</div>
  <p style="font-size: 9pt; margin-top: 10px;">
    (Executed Electronically under the Information Technology Act, 2000)
  </p>
</div>

<div class="clause">
  <p> This AGRICULTURAL PRODUCE SUPPLY AGREEMENT (hereinafter referred to as the <strong>"Agreement"</strong>) is made and entered into on this <strong>${fmtDate(c.contractDate)}</strong> (hereinafter referred to as the <strong>"Effective Date"</strong>) by and between: </p>
</div>

<div class="party-container">
  <div class="party-box">
    <div class="party-header">THE BUYER / PROCURER</div>
    <table class="party-table">
      ${row('Entity Name', c.buyer.businessName || c.buyer.name)}
      ${row('Represented By', c.buyer.name)}
      ${row('GSTIN', c.buyer.gstNumber || 'Not Provided')}
      ${row('PAN', c.buyer.panNumber || 'Not Provided')}
      ${row('Address', [c.buyer.address, c.buyer.city, c.buyer.state].filter(Boolean).join(', '))}
      ${row('Contact', c.buyer.phone)}
    </table>
    <p style="font-size: 8pt; margin-top: 5px; font-style: italic;">
      (Hereinafter referred to as the <strong>"Buyer"</strong>, which expression shall include its successors and permitted assigns)
    </p>
  </div>
  <div class="party-box">
    <div class="party-header">THE FARMER / SUPPLIER</div>
    <table class="party-table">
      ${row('Name', c.farmer.name)}
      ${row('Father Name', c.farmer.fatherName)}
      ${row('Farm Location', [c.farmer.village, c.farmer.tehsil, c.farmer.district].filter(Boolean).join(', '))}
      ${row('Khasra No.', c.farmer.khasraNumber || 'Verified')}
      ${row('Aadhaar Ref', c.farmer.aadharLast4 ? 'XXXX-XXXX-' + c.farmer.aadharLast4 : 'Verified')}
      ${row('Contact', c.farmer.phone)}
    </table>
    <p style="font-size: 8pt; margin-top: 5px; font-style: italic;">
      (Hereinafter referred to as the <strong>"Farmer"</strong>, which expression shall include his/her heirs, executors, and legal representatives)
    </p>
  </div>
</div>

<div class="section-title">RECITALS</div>
<div class="clause">
  <p><strong>WHEREAS:</strong></p>
  <p style="margin-left: 20px;">
    A. The Farmer is engaged in the cultivation of agricultural produce and has represented to have the necessary rights and land holding to supply the Goods (as defined below).<br/>
    B. The Buyer is engaged in the business of procurement and distribution of agricultural produce and desires to purchase the Goods from the Farmer.<br/>
    C. The Parties have agreed to transact via the D2Farm Digital Platform, utilizing its digital escrow mechanism and electronic record system to ensure performance and transparency.
  </p>
</div>

<div class="clause">
  <p><strong>NOW, THEREFORE, IN CONSIDERATION OF THE MUTUAL COVENANTS CONTAINED HEREIN, THE PARTIES HERETO AGREE AS FOLLOWS:</strong></p>
</div>

<div class="section-title">1. SCOPE OF AGREEMENT</div>
<div class="clause">
  <p>1.1 The Farmer hereby agrees to sell and the Buyer hereby agrees to purchase the agricultural produce as specified in Clause 2, subject to the terms and conditions set forth in this Agreement.</p>
</div>

<div class="section-title">2. PRODUCE SPECIFICATIONS (THE "GOODS")</div>
<table>
  <thead>
    <tr>
      <th>Commodity & Variety</th>
      <th>Quality Grade</th>
      <th>Quantity (Net Weight)</th>
      <th>Delivery Location</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>${c.produce.cropName} (${c.produce.variety || 'Standard'})</td>
      <td>${c.produce.grade}</td>
      <td>${(c.produce.quantityKg || 0).toLocaleString('en-IN')} Kilograms</td>
      <td>${c.produce.deliveryLocation}</td>
    </tr>
  </tbody>
</table>
<div class="clause">
  <p>2.1 <strong>Quality Parameters:</strong> The Goods shall strictly adhere to the following parameters: Moisture content not exceeding ${c.produce.qualityParameters?.moistureMaxPct ?? 12}%; Foreign matter not exceeding ${c.produce.qualityParameters?.foreignMatterMaxPct ?? 2}%.</p>
</div>

<div class="section-title">3. PRICE AND CONSIDERATION</div>
<div class="clause">
  <p>3.1 The Parties have mutually agreed upon a unit price of <strong>&#8377;${c.produce.pricePerKg} per Kilogram</strong>.</p>
  <p>3.2 The Total Contract Value for the Goods is calculated at <strong>&#8377;${fmt(c.financials.totalContractValue)}</strong> (inclusive of all applicable taxes, if any).</p>
</div>

<div class="section-title">4. PAYMENT TERMS</div>
<div class="clause">
  <p>4.1 <strong>Advance Escrow:</strong> An amount of &#8377;${fmt(c.financials.escrowAmount)} (representing 2% of total value) shall be secured within the Digital Escrow Mechanism upon execution of this Agreement.</p>
  <p>4.2 <strong>Final Disbursement:</strong> The remaining balance of &#8377;${fmt(c.financials.remainingBalance)} shall be disbursed to the Farmer via ${c.financials.paymentMode} within 48 hours of successful delivery confirmation and quality verification.</p>
</div>

<div class="section-title">5. DELIVERY AND RISK TRANSFER</div>
<div class="clause">
  <p>5.1 The Farmer shall effect delivery at the designated Delivery Location on or before the specified Harvest/Delivery period.</p>
  <p>5.2 The risk of loss and title to the Goods shall pass from the Farmer to the Buyer only upon actual physical receipt and acceptance of the Goods by the Buyer.</p>
</div>

<div class="section-title">6. QUALITY ASSURANCE AND INSPECTION</div>
<div class="clause">
  <p>6.1 The Buyer shall have the right to inspect the Goods upon delivery. Any Goods not meeting the defined quality parameters shall be subject to price renegotiation or rejection at the Buyer's sole discretion.</p>
</div>

<div class="section-title">7. DIGITAL ESCROW AND ELECTRONIC RECORD</div>
<div class="clause">
  <p>7.1 <strong>Electronic Execution:</strong> This Agreement is executed digitally and is binding upon the parties under the Information Technology Act, 2000. Use of digital signatures and electronic timestamping constitutes valid execution.</p>
  <p>7.2 <strong>Platform Record:</strong> The transaction data, including the digital escrow status and delivery logs, are maintained as immutable electronic records on the D2Farm Platform (Reference TX: ${c.blockchain.transactionHash || 'Pending'}).</p>
</div>

<div class="section-title">8. OBLIGATIONS OF PARTIES</div>
<div class="clause">
  <p>8.1 The Farmer shall ensure the produce is free from any encumbrances or prior claims. The Farmer shall provide all necessary documents, including KCC and weight certificates.</p>
  <p>8.2 The Buyer shall ensure timely payment as per Clause 4 and provide adequate facilities for offloading upon arrival at the Delivery Location.</p>
</div>

<div class="section-title">9. BREACH AND REMEDIES</div>
<div class="clause">
  <p>9.1 Failure by either party to perform its obligations shall constitute a breach. In case of delay, a penalty of &#8377;${(c.financials.latePenaltyPerDay || 500).toLocaleString('en-IN')} per day shall be applicable.</p>
  <p>9.2 <strong>Cancellation:</strong> ${c.financials.penaltyClause}. Unauthorized cancellation leading to escrow forfeiture shall be final.</p>
</div>

<div class="section-title">10. FORCE MAJEURE</div>
<div class="clause">
  <p>10.1 Neither party shall be liable for failure to perform due to unforeseen events beyond their control, including but not limited to natural disasters, government-imposed restrictions, or agricultural emergencies.</p>
</div>

<div class="section-title">11. DISPUTE RESOLUTION</div>
<div class="clause">
  <p>11.1 Any dispute arising out of this Agreement shall be resolved through mutual consultation. Failing such resolution, the dispute shall be referred to Arbitration under the Arbitration and Conciliation Act, 1996.</p>
</div>

<div class="section-title">12. GOVERNING LAW</div>
<div class="clause">
  <p>12.1 This Agreement shall be governed by and construed in accordance with the <strong>${c.governingLaw}</strong>. The Courts at <strong>${c.jurisdiction}</strong> shall have exclusive jurisdiction.</p>
</div>

<div class="section-title">13. MISCELLANEOUS</div>
<div class="clause">
  <p>13.1 This Agreement constitutes the entire understanding between the Parties. No modification shall be valid unless in writing and recorded on the D2Farm Platform.</p>
</div>

<div class="signature-section">
  <div class="sig-block">
    <div class="sig-line">
      ${c.signatures.buyerSigned ? `<span class="sig-name">${c.buyer.name}</span>` : '<span style="color: #999">Pending Electronic Signature</span>'}
    </div>
    <div style="font-weight: bold;">FOR THE BUYER</div>
    <div style="font-size: 8pt; color: #666;">Digitally Signed at: ${fmtDate(c.signatures.buyerSignedAt)}</div>
  </div>
  
  <div class="sig-block" style="flex: 0.5; border: 1px dashed #ccc; padding: 10px; border-radius: 4px; background: #fafafa;">
    <div style="font-size: 8.5pt; color: #555; text-align: left;">
      <strong>PLATFORM ATTESTATION:</strong><br/>
      Witness: ${c.signatures.witnessName}<br/>
      Ref No: ${c.contractNumber}<br/>
      Status: Legally Sealed
    </div>
  </div>

  <div class="sig-block">
    <div class="sig-line">
      ${c.signatures.farmerSigned ? `<span class="sig-name" style="color: #1a5c1a">${c.farmer.name}</span>` : '<span style="color: #999">Pending Electronic Signature</span>'}
    </div>
    <div style="font-weight: bold;">FOR THE FARMER</div>
    <div style="font-size: 8pt; color: #666;">Digitally Signed at: ${fmtDate(c.signatures.farmerSignedAt)}</div>
  </div>
</div>

<div class="footer">
  <div>Agreement v${c.version} | D2Farm Blockchain-Security Protocol</div>
  <div style="text-align: right">Page 1 of 1 | Non-Transferable Electronic Record</div>
</div>

<script>window.onload = function(){ window.print(); }</script>
</body>
</html>`;

export default function ContractExport({ proposalId, cropName, onClose }: Props) {
    const [contract, setContract] = useState<ContractData | null>(null);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState<string | null>(null);

    const generate = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res  = await fetch(`${API_BASE}/api/contracts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proposalId }),
            });
            const json = await res.json();
            if (json.success) setContract(json.contract);
            else setError(json.message || 'Failed to generate contract.');
        } catch {
            setError('Backend offline — start server on port 4000.');
        } finally { setLoading(false); }
    }, [proposalId]);

    const printContract = () => {
        if (!contract) return;
        const html = buildContractHTML(contract);
        const win  = window.open('', '_blank', 'width=900,height=700');
        if (!win) { alert('Allow pop-ups for this site to open the contract PDF.'); return; }
        win.document.open();
        win.document.write(html);
        win.document.close();
    };

    return (
        <>
            {/* ── Print-only contract document ─────────────────────────────── */}
            {contract && (
                <style>{`
                    @media print {
                        body > *:not(#contract-print-root) { display: none !important; }
                        #contract-print-root { display: block !important; position: fixed; top: 0; left: 0; width: 100%; z-index: 99999; }
                        @page { size: A4; margin: 18mm 20mm; }
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    }
                    @media screen {
                        #contract-print-root { display: none; }
                    }
                `}</style>
            )}

            {/* ── The actual printable contract (hidden on screen, shown on print) ── */}
            {contract && (
                <div id="contract-print-root">
                    <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '11pt', color: '#000', lineHeight: 1.6, background: '#fff', padding: '0' }}>

                        {/* HEADER */}
                        <div style={{ borderBottom: '3px double #000', paddingBottom: '10px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '22pt', fontWeight: 'bold', letterSpacing: '1px', fontFamily: 'Georgia, serif' }}>D2FARM</div>
                                <div style={{ fontSize: '8.5pt', color: '#555', marginTop: '2px' }}>Agricultural Procurement Platform · CIN: U01400MH2024PTC000001</div>
                                <div style={{ fontSize: '8.5pt', color: '#555' }}>Registered Office: 4th Floor, Agri Tower, Bandra Kurla Complex, Mumbai — 400 051</div>
                                <div style={{ fontSize: '8.5pt', color: '#555' }}>Email: contracts@d2farm.in  |  Tel: +91 22 4000 8800  |  www.d2farm.in</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '14pt', fontWeight: 'bold', fontFamily: 'Georgia, serif', marginBottom: '4px' }}>
                                    AGRICULTURAL SUPPLY CONTRACT
                                </div>
                                <div style={{ fontSize: '9pt', border: '1px solid #000', padding: '4px 10px', display: 'inline-block' }}>
                                    <span style={{ fontWeight: 'bold' }}>Contract No.:</span> {contract.contractNumber}
                                </div>
                                <div style={{ fontSize: '8.5pt', marginTop: '4px', color: '#333' }}>
                                    Date: {fmtDate(contract.contractDate)}<br />
                                    Valid Until: {fmtDate(contract.expiryDate)}<br />
                                    Version: {contract.version}
                                </div>
                            </div>
                        </div>

                        {/* PREAMBLE */}
                        <p style={{ marginBottom: '14px', textAlign: 'justify', fontSize: '10.5pt' }}>
                            This Agricultural Supply Contract ("<strong>Contract</strong>") is entered into as of <strong>{fmtDate(contract.contractDate)}</strong>,
                            by and between the parties named below, and is governed by the terms and conditions set forth herein.
                            This Contract is secured by blockchain-based escrow technology administered by the D2Farm Platform.
                        </p>

                        {/* PARTIES */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                            {/* Buyer */}
                            <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: '4px', padding: '10px 14px' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '8px' }}>
                                    PARTY A — BUYER / PROCURER
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
                                    {[
                                        ['Full Name',     contract.buyer.name       || '—'],
                                        ['Business Name', contract.buyer.businessName|| '—'],
                                        ['GST Number',    contract.buyer.gstNumber   || 'To be furnished'],
                                        ['PAN Number',    contract.buyer.panNumber   || 'To be furnished'],
                                        ['Address',       [contract.buyer.address, contract.buyer.city, contract.buyer.state, contract.buyer.pincode].filter(Boolean).join(', ') || '—'],
                                        ['Phone',         contract.buyer.phone       || '—'],
                                        ['Email',         contract.buyer.email       || '—'],
                                    ].map(([k, v]) => (
                                        <tr key={k}><td style={{ color: '#555', width: '38%', paddingBottom: '2px' }}>{k}</td><td style={{ fontWeight: 500, paddingBottom: '2px' }}>{v}</td></tr>
                                    ))}
                                </table>
                            </div>
                            {/* Farmer */}
                            <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: '4px', padding: '10px 14px' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '8px' }}>
                                    PARTY B — FARMER / SUPPLIER
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
                                    {[
                                        ['Full Name',      contract.farmer.name       || '—'],
                                        ["Father's Name",  contract.farmer.fatherName || '—'],
                                        ['Farm / Khasra',  contract.farmer.khasraNumber || '—'],
                                        ['Village / Tehsil', [contract.farmer.village, contract.farmer.tehsil].filter(Boolean).join(', ') || '—'],
                                        ['District, State', [contract.farmer.district, contract.farmer.state].filter(Boolean).join(', ') || '—'],
                                        ['Phone',           contract.farmer.phone || '—'],
                                        ['Aadhaar (Last 4)', contract.farmer.aadharLast4 ? `XXXX-XXXX-${contract.farmer.aadharLast4}` : 'Verified'],
                                    ].map(([k, v]) => (
                                        <tr key={k}><td style={{ color: '#555', width: '42%', paddingBottom: '2px' }}>{k}</td><td style={{ fontWeight: 500, paddingBottom: '2px' }}>{v}</td></tr>
                                    ))}
                                </table>
                            </div>
                        </div>

                        {/* SECTION 1: PRODUCE */}
                        <div style={{ marginBottom: '14px' }}>
                            <div style={{ background: '#1a1a1a', color: '#fff', padding: '5px 12px', fontWeight: 'bold', fontSize: '9.5pt', letterSpacing: '0.06em', marginBottom: '8px' }}>
                                1. PRODUCE SPECIFICATIONS
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
                                <tbody>
                                    <tr style={{ background: '#f8f8f8' }}>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px', fontWeight: 'bold', width: '30%' }}>Crop Name</td>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px' }}>{contract.produce.cropName}</td>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px', fontWeight: 'bold', width: '20%' }}>Variety</td>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px' }}>{contract.produce.variety || '—'}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px', fontWeight: 'bold' }}>Quantity</td>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px' }}>{contract.produce.quantityKg?.toLocaleString('en-IN')} kg</td>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px', fontWeight: 'bold' }}>Grade</td>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px' }}>{contract.produce.grade}</td>
                                    </tr>
                                    <tr style={{ background: '#f8f8f8' }}>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px', fontWeight: 'bold' }}>Agreed Rate</td>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px' }}>₹{contract.produce.pricePerKg} per kg</td>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px', fontWeight: 'bold' }}>MSP (Ref.)</td>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px' }}>{contract.produce.mspPerKg ? `₹${contract.produce.mspPerKg}/kg` : 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px', fontWeight: 'bold' }}>Packaging</td>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px' }}>{contract.produce.packagingType}</td>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px', fontWeight: 'bold' }}>Delivery Location</td>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px' }}>{contract.produce.deliveryLocation || '—'}</td>
                                    </tr>
                                    <tr style={{ background: '#f8f8f8' }}>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px', fontWeight: 'bold' }}>Max Moisture</td>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px' }}>{contract.produce.qualityParameters?.moistureMaxPct ?? 12}%</td>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px', fontWeight: 'bold' }}>Foreign Matter</td>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px' }}>{contract.produce.qualityParameters?.foreignMatterMaxPct ?? 2}% (max)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* SECTION 2: FINANCIAL */}
                        <div style={{ marginBottom: '14px' }}>
                            <div style={{ background: '#1a1a1a', color: '#fff', padding: '5px 12px', fontWeight: 'bold', fontSize: '9.5pt', letterSpacing: '0.06em', marginBottom: '8px' }}>
                                2. FINANCIAL TERMS &amp; PAYMENT SCHEDULE
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
                                <thead>
                                    <tr style={{ background: '#333', color: '#fff' }}>
                                        <th style={{ border: '1px solid #999', padding: '6px 10px', textAlign: 'left' }}>Component</th>
                                        <th style={{ border: '1px solid #999', padding: '6px 10px', textAlign: 'right' }}>Amount (INR)</th>
                                        <th style={{ border: '1px solid #999', padding: '6px 10px', textAlign: 'left' }}>Trigger</th>
                                        <th style={{ border: '1px solid #999', padding: '6px 10px', textAlign: 'left' }}>Mode</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px' }}>Advance Escrow (2%)</td>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px', textAlign: 'right', fontWeight: 'bold' }}>₹{fmt(contract.financials.escrowAmount)}</td>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px' }}>On contract acceptance</td>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px' }}>Blockchain Escrow</td>
                                    </tr>
                                    <tr style={{ background: '#f8f8f8' }}>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px' }}>Balance Payment (98%)</td>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px', textAlign: 'right', fontWeight: 'bold' }}>₹{fmt(contract.financials.remainingBalance)}</td>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px' }}>On delivery confirmation</td>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px' }}>{contract.financials.paymentMode}</td>
                                    </tr>
                                    <tr style={{ fontWeight: 'bold' }}>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px' }}>TOTAL CONTRACT VALUE</td>
                                        <td style={{ border: '1px solid #ccc', padding: '5px 10px', textAlign: 'right' }}>₹{fmt(contract.financials.totalContractValue)}</td>
                                        <td colSpan={2} style={{ border: '1px solid #ccc', padding: '5px 10px', color: '#555' }}>Currency: {contract.financials.currency}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <p style={{ fontSize: '9pt', marginTop: '6px', color: '#444' }}>
                                <strong>Late Delivery Penalty:</strong> ₹{contract.financials.latePenaltyPerDay?.toLocaleString('en-IN')} per day after agreed delivery date.&nbsp;
                                <strong>Cancellation:</strong> {contract.financials.penaltyClause}.
                            </p>
                        </div>

                        {/* SECTION 3: BLOCKCHAIN */}
                        <div style={{ marginBottom: '14px' }}>
                            <div style={{ background: '#1a1a1a', color: '#fff', padding: '5px 12px', fontWeight: 'bold', fontSize: '9.5pt', letterSpacing: '0.06em', marginBottom: '8px' }}>
                                3. BLOCKCHAIN ESCROW VERIFICATION
                            </div>
                            <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '10px 14px', fontSize: '9pt' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    {[
                                        ['Network',          contract.blockchain.network || 'Polygon Mumbai (Testnet)'],
                                        ['Contract Address', contract.blockchain.contractAddress || 'AgriContract_v1 (Platform Escrow)'],
                                        ['Transaction Hash', contract.blockchain.transactionHash || 'Simulated — Pending On-chain Migration'],
                                        ['Block Number',     contract.blockchain.blockNumber || 'N/A'],
                                        ['Token Standard',   contract.blockchain.tokenStandard],
                                        ['Verification URL', contract.blockchain.verificationUrl || 'https://polygonscan.com (on deployment)'],
                                    ].map(([k, v]) => (
                                        <tr key={String(k)}>
                                            <td style={{ color: '#555', width: '28%', paddingBottom: '3px', verticalAlign: 'top', fontWeight: 'bold' }}>{k}</td>
                                            <td style={{ fontFamily: 'Courier New, monospace', fontSize: '8.5pt', overflowWrap: 'break-word', paddingBottom: '3px' }}>{String(v)}</td>
                                        </tr>
                                    ))}
                                </table>
                                <p style={{ marginTop: '8px', fontSize: '8.5pt', color: '#444', fontStyle: 'italic' }}>
                                    The 2% escrow amount is held in a smart contract address. Funds are released to the farmer only
                                    upon buyer confirmation of delivery. If the farmer cancels post-acceptance, the escrow is forfeited
                                    as a trust penalty under AgriContract.sol §cancelOrder().
                                </p>
                            </div>
                        </div>

                        {/* SECTION 4: TERMS */}
                        <div style={{ marginBottom: '14px' }}>
                            <div style={{ background: '#1a1a1a', color: '#fff', padding: '5px 12px', fontWeight: 'bold', fontSize: '9.5pt', letterSpacing: '0.06em', marginBottom: '8px' }}>
                                4. TERMS AND CONDITIONS
                            </div>
                            <ol style={{ fontSize: '9pt', paddingLeft: '18px', margin: 0, lineHeight: 1.7 }}>
                                <li>The Farmer agrees to supply the stated quantity of produce meeting the quality parameters specified in Section 1 of this Contract.</li>
                                <li>The Buyer agrees to accept delivery and release the balance payment (98%) within <strong>48 hours</strong> of confirmed delivery.</li>
                                <li>The Farmer shall provide a valid E-Way Bill, Kisan Credit Card (KCC) copy, and weight certificate at the time of delivery.</li>
                                <li>In the event of quality shortfall, the Buyer reserves the right to deduct up to <strong>5%</strong> of the contract value, subject to third-party grading verification.</li>
                                <li>Force Majeure: Neither party shall be held liable for delays caused by flood, drought, or government-declared agricultural emergencies under the Farmers (Empowerment and Protection) Agreement Act, 2020.</li>
                                <li>The Farmer shall not sell or commit the contracted produce to any third party after digital acceptance of this Contract.</li>
                                <li>Any amendments to this Contract must be agreed in writing (digitally via the D2Farm platform) by both parties before taking effect.</li>
                                <li>{contract.arbitrationClause}</li>
                                <li>This Contract shall be governed by the {contract.governingLaw} and subject to the exclusive jurisdiction of the {contract.jurisdiction}.</li>
                                {contract.specialConditions && <li><strong>Special Conditions:</strong> {contract.specialConditions}</li>}
                            </ol>
                        </div>

                        {/* SIGNATURES */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ background: '#1a1a1a', color: '#fff', padding: '5px 12px', fontWeight: 'bold', fontSize: '9.5pt', letterSpacing: '0.06em', marginBottom: '12px' }}>
                                5. SIGNATURES &amp; DIGITAL ACCEPTANCE
                            </div>
                            <div style={{ display: 'flex', gap: '30px' }}>
                                {/* Buyer signature */}
                                <div style={{ flex: 1, textAlign: 'center' }}>
                                    <div style={{ minHeight: '50px', borderBottom: '1px solid #000', marginBottom: '6px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '4px' }}>
                                        {contract.signatures.buyerSigned && (
                                            <div style={{ fontFamily: 'cursive', fontSize: '18pt', color: '#1a3a6e' }}>{contract.buyer.name}</div>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '9pt' }}><strong>Party A — Buyer / Procurer</strong></div>
                                    <div style={{ fontSize: '8.5pt', color: '#555' }}>{contract.buyer.name}</div>
                                    <div style={{ fontSize: '8.5pt', color: '#555' }}>{contract.buyer.businessName}</div>
                                    <div style={{ fontSize: '8pt', color: '#777', marginTop: '3px' }}>
                                        Digitally signed on {fmtDate(contract.signatures.buyerSignedAt)}
                                    </div>
                                </div>

                                {/* Witness */}
                                <div style={{ flex: 1, textAlign: 'center' }}>
                                    <div style={{ minHeight: '50px', borderBottom: '1px solid #000', marginBottom: '6px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '4px' }}>
                                        <div style={{ fontFamily: 'cursive', fontSize: '14pt', color: '#333' }}>D2Farm Platform</div>
                                    </div>
                                    <div style={{ fontSize: '9pt' }}><strong>Digital Witness</strong></div>
                                    <div style={{ fontSize: '8.5pt', color: '#555' }}>{contract.signatures.witnessName}</div>
                                    <div style={{ fontSize: '8pt', color: '#777', marginTop: '3px' }}>
                                        Platform-attested · Contract No. {contract.contractNumber}
                                    </div>
                                </div>

                                {/* Farmer signature */}
                                <div style={{ flex: 1, textAlign: 'center' }}>
                                    <div style={{ minHeight: '50px', borderBottom: '1px solid #000', marginBottom: '6px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '4px' }}>
                                        {contract.signatures.farmerSigned && (
                                            <div style={{ fontFamily: 'cursive', fontSize: '18pt', color: '#1a5c1a' }}>{contract.farmer.name}</div>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '9pt' }}><strong>Party B — Farmer / Supplier</strong></div>
                                    <div style={{ fontSize: '8.5pt', color: '#555' }}>{contract.farmer.name}</div>
                                    <div style={{ fontSize: '8.5pt', color: '#555' }}>{[contract.farmer.village, contract.farmer.district].filter(Boolean).join(', ')}</div>
                                    <div style={{ fontSize: '8pt', color: '#777', marginTop: '3px' }}>
                                        Digitally signed on {fmtDate(contract.signatures.farmerSignedAt)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div style={{ borderTop: '2px solid #000', paddingTop: '8px', fontSize: '8pt', color: '#555', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                Issued by: {contract.issuedBy} · {fmtDate(contract.contractDate)}<br />
                                This is a digitally generated contract. Verify authenticity at contracts.d2farm.in/{contract.contractNumber}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                Page 1 of 1 · Contract v{contract.version}<br />
                                {contract.blockchain.transactionHash ? `TX: ${contract.blockchain.transactionHash.slice(0, 20)}...` : 'On-chain verification pending'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── On-screen modal ───────────────────────────────────────────── */}
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                <div className="card-glass" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
                    {/* Modal header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                                <i className="ph ph-file-pdf" style={{ marginRight: 6, color: 'var(--danger)' }}></i> Export Contract
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {cropName} — Blockchain-attested legal document
                            </p>
                        </div>
                        <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem' }} onClick={onClose}>
                            <i className="ph ph-x"></i>
                        </button>
                    </div>

                    {!contract && !loading && !error && (
                        <>
                            {/* What's inside */}
                            <div style={{ background: 'var(--surface-bg)', borderRadius: 'var(--border-radius-md)', padding: '1rem', marginBottom: '1.25rem' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                                    PDF will include
                                </div>
                                {['Buyer & Farmer party details', 'Produce specifications & quality parameters', 'Financial terms & payment schedule', 'Blockchain escrow verification hash', 'Legal T&Cs under Indian law', 'Digital signatures & witness'].map((item, i) => (
                                    <div key={i} style={{ fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                                        <i className="ph ph-check-circle" style={{ color: 'var(--success)', flexShrink: 0 }}></i> {item}
                                    </div>
                                ))}
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }} onClick={generate}>
                                <i className="ph ph-file-arrow-down"></i> Generate Contract Document
                            </button>
                        </>
                    )}

                    {loading && (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <i className="ph ph-spinner ph-spin" style={{ fontSize: '2rem', color: 'var(--primary)', display: 'block', marginBottom: '0.75rem' }}></i>
                            <p style={{ color: 'var(--text-muted)' }}>Generating contract &amp; storing in database...</p>
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                            <span className="alert-icon"><i className="ph ph-warning"></i></span>
                            <div className="alert-text"><strong>Error</strong><p>{error}</p></div>
                        </div>
                    )}

                    {contract && (
                        <div>
                            <div style={{ background: 'var(--success-light)', border: '1px solid var(--success)', borderRadius: 'var(--border-radius-md)', padding: '0.9rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                <i className="ph ph-check-circle" style={{ color: 'var(--success)', fontSize: '1.4rem', flexShrink: 0, marginTop: '1px' }}></i>
                                <div>
                                    <strong style={{ color: 'var(--success)' }}>Contract Generated</strong>
                                    <p style={{ fontSize: '0.82rem', color: '#166534', margin: '2px 0 0' }}>
                                        Contract No. <strong>{contract.contractNumber}</strong> stored in database.
                                    </p>
                                </div>
                            </div>

                            {/* Summary */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1.25rem' }}>
                                {[
                                    { l: 'Buyer',     v: contract.buyer.name },
                                    { l: 'Farmer',    v: contract.farmer.name },
                                    { l: 'Crop',      v: `${contract.produce.cropName} (${contract.produce.variety})` },
                                    { l: 'Quantity',  v: `${contract.produce.quantityKg?.toLocaleString('en-IN')} kg` },
                                    { l: 'Rate',      v: `₹${contract.produce.pricePerKg}/kg` },
                                    { l: 'Total',     v: `₹${fmt(contract.financials.totalContractValue)}` },
                                ].map((x, i) => (
                                    <div key={i} style={{ background: 'var(--surface-bg)', padding: '0.65rem', borderRadius: 'var(--border-radius-sm)' }}>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>{x.l}</div>
                                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{x.v}</div>
                                    </div>
                                ))}
                            </div>

                            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }} onClick={printContract}>
                                <i className="ph ph-printer"></i> Print / Save as PDF
                            </button>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.6rem' }}>
                                In print dialog: select "Save as PDF" for a file, or choose your printer.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
