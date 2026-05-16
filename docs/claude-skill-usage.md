# Claude Skill Usage — TestPilot AI

Files added:
- `.claude/rtk_claude_skill.md` — System instruction / skill to inject into Claude.

Options to enable the skill:

1) With RTK (preferred for token savings)
- Install RTK per https://github.com/rtk-ai/rtk
- Copy `.claude/rtk_claude_skill.md` to `~/.config/rtk/CLAUDE.md` (or keep project-scoped `.claude/` if RTK picks it up on Windows)
- Run `rtk init -g` and restart Claude Code.

2) Without RTK (manual)
- Open Claude UI or SDK.
- Paste the entire content of `.claude/rtk_claude_skill.md` into the System instruction field.
- Save as default or paste before each session.

3) Programmatic use (SDK)
- Prepend the skill content as the first system message in your SDK call.
- Example pseudo-code:

```python
system_prompt = open('.claude/rtk_claude_skill.md').read()
response = client.chat.create(system=[{"role":"system","content":system_prompt}],
                              user=[{"role":"user","content":user_prompt}])
```

Notes:
- The skill forces Claude to return compact, structured JSON for features; ensure your caller validates the JSON schema.
- If you need verbose explanations, append `VERBOSE=true` to the user prompt.

