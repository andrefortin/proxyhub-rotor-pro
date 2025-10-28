#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "anthropic",
# ]
# ///

"""
Event summarizer for Claude Desktop Hooks
"""

import json
import os
import sys
from contextlib import suppress


def generate_event_summary(event_data):
    """
    Generate a natural language summary of the event using Anthropic's API.

    Args:
        event_data: Dictionary containing the event information

    Returns:
        str: Natural language summary of the event, or None if error
    """
    # Extract key information from event
    event_type = event_data.get("hook_event_type", "Unknown")
    session_id = event_data.get("session_id", "Unknown")
    source_app = event_data.get("source_app", "Unknown")
    payload = event_data.get("payload", {})

    # Build context for summary
    context_parts = []

    if event_type in ["PreToolUse", "PostToolUse"]:
        tool_name = payload.get("tool_name", "Unknown")
        tool_input = payload.get("tool_input", {})
        context_parts.append(f"Tool: {tool_name}")

        # Add tool-specific context
        if tool_name == "Bash":
            if command := tool_input.get("command", ""):
                context_parts.append(f"Command: {command[:100]}...")
        elif tool_name in ["Read", "Edit", "Write"]:
            if file_path := tool_input.get("file_path", ""):
                context_parts.append(f"File: {file_path}")

    elif event_type == "UserPromptSubmit":
        if prompt := payload.get("prompt", ""):
            context_parts.append(f"Prompt: {prompt[:100]}...")

    elif event_type == "Notification":
        if message := payload.get("message", ""):
            context_parts.append(f"Message: {message}")

    # Create prompt for summary
    context = " | ".join(context_parts) if context_parts else "No specific context"

    prompt = f"""Summarize this Claude Desktop event in one concise sentence:

Event Type: {event_type}
App: {source_app}
Session: {session_id}
Context: {context}

Write a brief, natural language summary that captures what happened."""

    # Get API key
    if not (api_key := os.getenv("ANTHROPIC_API_KEY")):
        return None

    try:
        import anthropic  # type: ignore

        client = anthropic.Anthropic(api_key=api_key)

        message = client.messages.create(
            model="claude-3-5-haiku-20241022",  # Fast model for summaries
            max_tokens=50,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}],
        )

        return message.content[0].text.strip()

    except Exception:
        return None


def main():
    """Command line interface for testing."""
    if len(sys.argv) > 1:
        # Read event data from file
        event_file = sys.argv[1]
        try:
            with open(event_file, "r") as f:
                event_data = json.load(f)

            if summary := generate_event_summary(event_data):
                print(summary)
            else:
                print("Failed to generate summary")
        except Exception as e:
            print(f"Error: {e}")
    else:
        # Read from stdin
        with suppress(Exception):
            event_data = json.load(sys.stdin)
            if summary := generate_event_summary(event_data):
                print(summary)


if __name__ == "__main__":
    main()
