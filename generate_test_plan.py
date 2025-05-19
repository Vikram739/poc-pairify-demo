import os
import requests

def read_diff():
    with open("diff.txt", "r") as f:
        return f.read()

def generate_test_plan(diff):
    prompt = f"""
You are an expert QA engineer.

Generate a detailed test plan based on the following code diff from a GitHub Pull Request. Include:

- Acceptance criteria
- Manual test steps
- Pre-conditions
- Test data (as a markdown table)
- Regression checklist

Code diff:
{diff}
"""

    headers = {
        "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": os.getenv("GROQ_MODEL", "llama3-70b-8192"),
        "messages": [
            {"role": "system", "content": "You are a senior QA engineer."},
            {"role": "user", "content": prompt}
        ]
    }

    response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    return content

if __name__ == "__main__":
    diff = read_diff()
    test_plan = generate_test_plan(diff)
    with open("qa_test_plan.md", "w") as f:
        f.write(test_plan)
