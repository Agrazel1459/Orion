#!/usr/bin/env python3
"""
Signs a SignatureBundle (malicious hashes/domains/wallet publishers) with the
backend's private Ed25519 key before publishing to the CDN. The corresponding
public key is pinned in both mobile clients (see SignatureVerifier.kt /
SignatureStore.swift). Never publish an unsigned bundle.

Usage: python3 sign_bundle.py bundle.json private_key.pem > bundle.signed.json
"""
import sys
import json
import base64
from cryptography.hazmat.primitives.serialization import load_pem_private_key


def canonical_bytes(bundle: dict) -> bytes:
    # Exclude "signature" field, sort keys, no whitespace ambiguity.
    payload = {k: v for k, v in bundle.items() if k != "signature"}
    return json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")


def main():
    if len(sys.argv) != 3:
        sys.exit("usage: sign_bundle.py bundle.json private_key.pem")

    with open(sys.argv[1]) as f:
        bundle = json.load(f)
    with open(sys.argv[2], "rb") as f:
        private_key = load_pem_private_key(f.read(), password=None)

    signature = private_key.sign(canonical_bytes(bundle))
    bundle["signature"] = base64.b64encode(signature).decode("ascii")
    print(json.dumps(bundle, indent=2))


if __name__ == "__main__":
    main()
