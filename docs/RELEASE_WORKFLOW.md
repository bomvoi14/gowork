# GTD-GoWork release workflow

Production: https://gtd-gowork.vercel.app/
Repository: bomvoi14/gowork; production branch: main; Vercel Git integration.
Baseline backup: backup/pre-chat-cicd-20261125 (4673277).

1. Inspect current production and main. Create feature branch and backup before risky changes.
2. Review changes and open PR. Require successful Vercel preview build and relevant tests before merging. Never expose credentials or write production Sheets during preview testing.
3. Merge reviewed PR; Vercel automatically deploys main. Verify READY for exact merge SHA and production URL. Report version or commit, test results, limitations, and links.
4. If verification fails, investigate and revert offending commit or use authorized Vercel rollback. Preserve LINE Login, Google Sheets, existing domains and permissions.

No clasp, local VS Code or manual upload required. Do not treat build success alone as authenticated end-to-end testing.
