# Vercel CLI Reference

## Install / Update
```bash
npm i vercel         # install locally
npm i -g vercel      # install globally
```

## Authentication
```bash
vercel login [email]          # interactive login
vercel login --github         # OAuth login
vercel logout
vercel whoami                 # show current user
# CI/CD: use --token flag or VERCEL_TOKEN env var
vercel --token <token> <command>
```

## Deployment
```bash
vercel                        # deploy (preview)
vercel deploy                 # deploy (preview)
vercel deploy --prod          # deploy to production
vercel deploy --target=staging  # deploy to custom environment
vercel build                  # build locally without deploying
vercel build --prod
vercel redeploy <deployment-id-or-url>
vercel rollback [deployment-id-or-url]
vercel promote <deployment-id-or-url>
vercel list [project-name]    # list recent deployments
vercel inspect <deployment-id-or-url>
vercel remove <deployment-url-or-project>
```

## Project Linking
```bash
vercel link                   # link local dir to Vercel project
vercel link <path>
vercel pull                   # sync remote env vars + settings locally
vercel pull --environment=production
vercel open                   # open project in dashboard
```

## Environment Variables
```bash
vercel env ls
vercel env add <name> [environment]      # environments: production, preview, development
vercel env update <name> [environment]
vercel env rm <name> [environment]
vercel env pull [file]                   # pull to .env.local by default
vercel env run -- <command>              # run command with env vars injected
```

## Logs
```bash
vercel logs <deployment-url>
vercel logs <deployment-url> --follow    # tail logs
```

## Domains & DNS
```bash
vercel domains ls
vercel domains add <domain> <project>
vercel domains rm <domain>
vercel domains buy <domain>
vercel dns ls [domain]
vercel dns add <domain> <name> <type> <value>
vercel dns rm <record-id>
vercel alias set <deployment-url> <custom-domain>
vercel alias rm <custom-domain>
vercel alias ls
vercel certs ls
vercel certs issue <domain>
vercel certs rm <certificate-id>
```

## Cache
```bash
vercel cache purge                    # purge all cache
vercel cache purge --type cdn
vercel cache purge --type data
vercel cache invalidate --tag <tag>
```

## Projects & Teams
```bash
vercel project ls
vercel project add
vercel project rm
vercel project inspect [project-name]
vercel teams list
vercel teams add
vercel teams invite <email>
vercel switch [team-name]
```

## Dev Server
```bash
vercel dev                    # local dev replicating Vercel environment
vercel dev --port 3000
```

## Global Options
| Flag | Short | Description |
|------|-------|-------------|
| `--token <token>` | `-t` | Auth token (for CI/CD) |
| `--scope <team-slug>` | `-S` | Run as a different team scope |
| `--team <team-slug-or-id>` | `-T` | Specify team |
| `--project <name-or-id>` | | Specify project (also: `VERCEL_PROJECT_ID` env var) |
| `--cwd <path>` | | Set working directory |
| `--debug` | `-d` | Verbose output |
| `--no-color` | | Disable color/emoji output |
| `--local-config <path>` | `-A` | Path to vercel.json |
| `--global-config <path>` | `-Q` | Path to global config dir |
| `--help` | `-h` | Show help |
| `--version` | `-v` | Show version |

## CI/CD Usage
Set these env vars to skip interactive prompts:
```bash
VERCEL_TOKEN=<token>
VERCEL_ORG_ID=<org-id>
VERCEL_PROJECT_ID=<project-id>
```

Example CI deploy:
```bash
vercel deploy --prod --token $VERCEL_TOKEN
```
