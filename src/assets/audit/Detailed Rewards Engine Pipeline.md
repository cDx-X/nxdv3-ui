```mermaid
flowchart TB
    classDef contract fill:#1E293B,stroke:#38BDF8,stroke-width:2px,color:#F8FAFC;
    classDef dex fill:#0F172A,stroke:#F59E0B,stroke-width:2px,color:#F8FAFC;
    classDef burn fill:#450A0A,stroke:#EF4444,stroke-width:2px,color:#FCA5A5;
    classDef external fill:#14532D,stroke:#22C55E,stroke-width:2px,color:#DCFCE7;
    classDef user fill:#312E81,stroke:#818CF8,stroke-width:2px,color:#EEF2FF;

    DBXen[("DBXen Fees\n(Harvested ETH)")]:::external
    Protocol["NXDv3Protocol\n(Core Coordinator)"]:::contract

    UniV3_DXN["Uniswap V3\n(ETH -> DXN Swap)"]:::dex
    UniV3_XEN["Uniswap V3\n(ETH -> XEN Swap)"]:::dex
    UniV2_NXD["Uniswap V2\n(DXN -> NXD Swap)"]:::dex

    BurnDXN[["0x...dEaD\nBurn DXN (10%)"]]:::burn
    BurnNXD[["address(0)\nBurn NXD (55% DXN equivalent)"]]:::burn
    DBXenStake[("DBXen Protocol\nStake DXN (35%)")]:::external

    Vault["NXDv3StakingVault\n(Dual-Reward Streaming Engine)"]:::contract
    Stakers(["NXD Stakers"]):::user

    DBXen --> Protocol

    Protocol -- "70% ETH" --> UniV3_DXN
    UniV3_DXN -- "10% DXN" --> BurnDXN
    UniV3_DXN -- "35% DXN" --> DBXenStake
    UniV3_DXN -- "55% DXN" --> UniV2_NXD
    UniV2_NXD -- "Output NXD" --> BurnNXD

    Protocol -- "15% ETH" --> Vault
    Protocol -- "15% ETH" --> UniV3_XEN
    UniV3_XEN -- "Output XEN" --> Vault

    Vault -- "7-Day Linear ETH Stream" --> Stakers
    Vault -- "7-Day Linear XEN Stream" --> Stakers
    