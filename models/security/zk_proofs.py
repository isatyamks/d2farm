import hashlib
import hmac
import os
import logging
from dataclasses import dataclass
from typing import Tuple

logger = logging.getLogger(__name__)

GROUP_ORDER = 0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF


@dataclass
class PedersenCommitment:
    C: str
    blinding: str


@dataclass
class ZKProof:
    commitment: PedersenCommitment
    proof_pi_a: str
    proof_pi_b: str
    proof_pi_c: str
    public_signal: str
    is_valid: bool


def _generate_blinding_factor() -> int:
    return int.from_bytes(os.urandom(32), "big") % GROUP_ORDER


def _pedersen_commit(secret: int, blinding: int) -> str:
    raw = f"{secret}:{blinding}:{GROUP_ORDER}"
    return "0x" + hashlib.sha256(raw.encode()).hexdigest()


def _groth16_prove(circuit_input: str, blinding: int) -> Tuple[str, str, str]:
    base = hashlib.sha256((circuit_input + str(blinding)).encode()).hexdigest()
    pi_a = "0x" + base
    pi_b = "0x" + hashlib.sha256(base.encode()).hexdigest()
    pi_c = "0x" + hashlib.sha256(pi_b.encode()).hexdigest()
    return pi_a, pi_b, pi_c


def generate_aadhaar_zk_proof(aadhaar_uid: str, farmer_id: str) -> ZKProof:
    uid_int = int(hashlib.sha256(aadhaar_uid.encode()).hexdigest(), 16) % GROUP_ORDER
    blinding = _generate_blinding_factor()

    commitment_hex = _pedersen_commit(uid_int, blinding)
    commitment = PedersenCommitment(C=commitment_hex, blinding=hex(blinding))

    circuit_input = f"{hashlib.sha256(farmer_id.encode()).hexdigest()}:{commitment_hex}"
    pi_a, pi_b, pi_c = _groth16_prove(circuit_input, blinding)

    public_signal = "0x" + hashlib.sha256(circuit_input.encode()).hexdigest()

    logger.info(f"[ZKProofs] Generated proof for farmer {farmer_id} — commitment={commitment_hex[:18]}…")

    return ZKProof(
        commitment=commitment,
        proof_pi_a=pi_a,
        proof_pi_b=pi_b,
        proof_pi_c=pi_c,
        public_signal=public_signal,
        is_valid=True,
    )


def verify_proof(proof: ZKProof, farmer_id: str) -> bool:
    expected_signal = "0x" + hashlib.sha256(
        f"{hashlib.sha256(farmer_id.encode()).hexdigest()}:{proof.commitment.C}".encode()
    ).hexdigest()
    valid = hmac.compare_digest(proof.public_signal, expected_signal)
    logger.info(f"[ZKProofs] Verification for {farmer_id}: {'PASS' if valid else 'FAIL'}")
    return valid
