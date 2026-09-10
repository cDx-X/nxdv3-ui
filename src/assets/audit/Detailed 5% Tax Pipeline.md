```mermaid
flowchart TB
    classDef contract fill:#1E293B,stroke:#38BDF8,stroke-width:2px,color:#F8FAFC;
    classDef dex fill:#0F172A,stroke:#F59E0B,stroke-width:2px,color:#F8FAFC;
    classDef burn fill:#450A0A,stroke:#EF4444,stroke-width:2px,color:#FCA5A5;
    classDef external fill:#14532D,stroke:#22C55E,stroke-width:2px,color:#DCFCE7;
    classDef user fill:#312E81,stroke:#818CF8,stroke-width:2px,color:#EEF2FF;

    Transfer(["NXD Transfer (e.g., 100 NXD)"]):::user
    Recipient(["Transfer Recipient (95 NXD)"]):::user
    BurnZero[["address(0)\nPermanent Burn (1.5 NXD)"]]:::burn

    TaxRecipient["TaxRecipientV3\n(Receives 3.5 NXD)"]:::contract
    UniV2["Uniswap V2 Router\n(Swap 4/7 NXD to DXN)"]:::dex
    DBXen[("DBXen Protocol\nStaked via depositNoMint")]:::external
    UniV2LP["Uniswap V2 LP Pairing\n(3/7 NXD + 75% DXN)"]:::dex
    LockedLP[("Locked in TaxRecipientV3\n(Protocol-Owned Liquidity)")]:::dex

    Transfer -- "95% (95 NXD)" --> Recipient
    Transfer -- "30% of Tax (1.5 NXD)" --> BurnZero
    Transfer -- "70% of Tax (3.5 NXD)" --> TaxRecipient

    TaxRecipient -- "4/7 (2.0 NXD)" --> UniV2
    UniV2 -- "25% of DXN (0.5 NXD equiv.)" --> DBXen
    UniV2 -- "75% of DXN (1.5 NXD equiv.)" --> UniV2LP
    TaxRecipient -- "3/7 remaining NXD (1.5 NXD)" --> UniV2LP
    UniV2LP -- "Mint LP Tokens" --> LockedLP
