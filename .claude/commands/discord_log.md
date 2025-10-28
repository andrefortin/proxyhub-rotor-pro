# Discord Logging Command

Send log messages or upload files to Discord webhook.

This command provides functions to send embeds and upload files to Discord.

First, load the webhook URL from .env or environment.

```bash
DISCORD_WEBHOOK_URL=$(grep -oP '^DISCORD_WEBHOOK_URL=\K.*' .env || echo "$DISCORD_WEBHOOK_URL")
```

Define send_discord_embed function:

```bash
send_discord_embed() {
  local title="$1"
  local description="$2"
  local color="$3"
  local footer="$4"
  [[ -z "$DISCORD_WEBHOOK_URL" ]] && return 0
  curl -s -H "Content-Type: application/json" \
    -X POST -d "{
      \"embeds\": [{
        \"title\": \"$title\",
        \"description\": \"$description\",
        \"color\": $color,
        \"footer\": {\"text\": \"$footer\"},
        \"timestamp\": \"$(date -u +\"%Y-%m-%dT%H:%M:%SZ\")\"
      }]
    }" "$DISCORD_WEBHOOK_URL" >/dev/null 2>&1 || true
}
```

Define upload_to_discord function:

```bash
upload_to_discord() {
  local file_path="$1"
  local content="$2"
  [[ -z "$DISCORD_WEBHOOK_URL" || ! -f "$file_path" ]] && return 0
  curl -s -F "payload_json={\"content\":\"$content\"}" \
       -F "file=@${file_path}" \
       "$DISCORD_WEBHOOK_URL" >/dev/null 2>&1 || true
}
```

Usage examples:

- Send start embed: send_discord_embed "🛰️ Starting Job" "Host: $(hostname)" 16776960 "Job Started"

- Upload log: upload_to_discord "path/to/logfile.log" "📦 Job Logs"

This command can be used in other scripts or directly for logging Claude Code activities to Discord.
