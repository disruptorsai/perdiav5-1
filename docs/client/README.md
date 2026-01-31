# Client Documentation (READ-ONLY)

**Source:** Tony Huffman (GetEducated.com)

This folder contains authoritative documentation provided directly by the client. These documents are the **primary source of truth** for all application behavior, AI rules, content guidelines, and business logic.

## Rules

1. **NEVER EDIT** these files - they are client-provided and read-only
2. All implementation decisions must align with these documents
3. If conflicts exist between these docs and our specs, **these docs take priority**
4. Our derived specifications in `docs/v5-updates/` should reference and implement these requirements

## Document Index

| File | Description | Date Added |
|------|-------------|------------|
| `Rules for GetEducated Content.md` | Core content rules - linking, cost data sources, school emphasis | 2025-12-17 |
| `List of Client Schools and Degrees for AI Training.xlsx` | 94 paid schools with 4,845 degrees - AI MUST prioritize these | 2025-12-17 |
| `School_Degree Category_Subject Organization - IPEDS (1).xlsx` | Category/concentration IDs, level codes, CIP mappings | 2025-12-17 |

## Usage

When implementing features or making AI prompt decisions, always check this folder first. Reference specific documents and sections in code comments and commit messages when relevant.
