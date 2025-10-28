# ADW Discord Logging Command

Log messages or upload files to Discord using the ADW Discord logging script.

Arguments:
- $1: subcommand (send-embed or upload-file)
- Additional arguments depend on subcommand

If subcommand is send-embed:
- $2: title
- $3: description
- $4: color (optional, decimal)
- $5: footer (optional)

If subcommand is upload-file:
- $2: file-path
- $3: content (optional)

Run the ADW Discord logging script:
!uv run adws/adw_discord_log.py $1 --title "$2" --description "$3" --color ${4:-16776960} --footer "${5:-Job Update}"

For upload-file:
!uv run adws/adw_discord_log.py $1 --file-path "$2" --content "${3:-📎 Attached log file.}"

This command uses the DISCORD_WEBHOOK_URL from .env or environment.

After execution, confirm the log was sent successfully.
