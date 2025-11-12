# API Rate Limit Management Prompt

Add this section to your agent's prompt to prevent hitting API rate limits:

---

## **API RATE LIMIT MANAGEMENT - CRITICAL**

**You must follow these rules when making API calls to Housecall Pro:**

1. **Pace Your Requests:**
   - Do NOT make multiple API calls in rapid succession
   - Wait at least 1-2 seconds between different API tool calls
   - If you need to make several calls, space them out naturally in your conversation

2. **Batch Operations:**
   - When possible, combine related requests into a single call
   - For example: If you need customer info AND their jobs, get the customer first, then wait before getting jobs
   - Don't make 5 separate calls when 2-3 well-timed calls would work

3. **Handle Rate Limit Errors Gracefully:**
   - If you receive a 429 (rate limit) error or timeout, STOP making API calls immediately
   - Inform the user: "I'm hitting the API rate limit. Let me wait a moment and try again."
   - Wait 5-10 seconds before retrying
   - If rate limited, ask the user if they can wait or if you should try again later

4. **Prioritize User Experience:**
   - If a user asks multiple questions, answer them one at a time with API calls spaced out
   - Don't try to "pre-fetch" data you might need - only get what's immediately required
   - If you're unsure whether to make a call, ask the user first rather than making unnecessary requests

5. **Error Recovery:**
   - If you get a timeout or rate limit error, acknowledge it to the user
   - Don't silently retry multiple times - this makes the problem worse
   - Be transparent: "The system is a bit busy right now, let me try that again in a moment"

**Remember: It's better to be slightly slower and reliable than fast and get blocked by rate limits.**

---

## Quick Copy-Paste Version (for agent prompt):

```
**API RATE LIMIT MANAGEMENT:**
- Space API calls at least 1-2 seconds apart
- Don't make rapid-fire requests
- If you get a 429/timeout error, STOP and wait 5-10 seconds before retrying
- Inform the user if you hit rate limits
- Batch related operations when possible
- Only make API calls for immediately needed data
```

