#!/usr/bin/env python3
import argparse
import json
import os
import sys
import requests
from datetime import datetime

def load_webhook_url():
    # Try to load from environment
    url = os.environ.get('DISCORD_WEBHOOK_URL')
    if url:
        return url

    # Try to load from .env file
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.strip().startswith('DISCORD_WEBHOOK_URL='):
                    return line.strip().split('=', 1)[1].strip('"\'')
    return None

def send_embed(webhook_url, title, description, color, footer):
    if not webhook_url:
        print("Warning: DISCORD_WEBHOOK_URL not set. Skipping send.", file=sys.stderr)
        return

    embed = {
        "title": title,
        "description": description,
        "color": color,
        "footer": {"text": footer},
        "timestamp": datetime.utcnow().isoformat()
    }

    payload = {"embeds": [embed]}

    response = requests.post(webhook_url, json=payload)
    if response.status_code != 204:
        print(f"Error sending embed: {response.status_code} - {response.text}", file=sys.stderr)

def upload_file(webhook_url, file_path, content="📎 Attached log file."):
    if not webhook_url:
        print("Warning: DISCORD_WEBHOOK_URL not set. Skipping upload.", file=sys.stderr)
        return

    if not os.path.exists(file_path):
        print(f"File not found: {file_path}", file=sys.stderr)
        return

    files = {'file': open(file_path, 'rb')}
    payload = {'payload_json': json.dumps({"content": content})}

    response = requests.post(webhook_url, data=payload, files=files)
    if response.status_code != 200:
        print(f"Error uploading file: {response.status_code} - {response.text}", file=sys.stderr)

def main():
    parser = argparse.ArgumentParser(description="ADW Discord Logging Tool")
    subparsers = parser.add_subparsers(dest='command', required=True)

    # Send embed subcommand
    embed_parser = subparsers.add_parser('send-embed', help='Send a Discord embed')
    embed_parser.add_argument('--title', required=True)
    embed_parser.add_argument('--description', required=True)
    embed_parser.add_argument('--color', type=int, default=16776960)  # Yellow default
    embed_parser.add_argument('--footer', default="Job Update")

    # Upload file subcommand
    upload_parser = subparsers.add_parser('upload-file', help='Upload a file to Discord')
    upload_parser.add_argument('--file-path', required=True)
    upload_parser.add_argument('--content', default="📎 Attached log file.")

    args = parser.parse_args()
    webhook_url = load_webhook_url()

    if args.command == 'send-embed':
        send_embed(webhook_url, args.title, args.description, args.color, args.footer)
    elif args.command == 'upload-file':
        upload_file(webhook_url, args.file_path, args.content)

if __name__ == "__main__":
    main()
