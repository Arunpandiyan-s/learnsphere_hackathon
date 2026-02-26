import httpx
from app.core.config import settings

async def ask_qubrid(prompt: str) -> str:
    """
    Communicates securely with Qubrid AI platform utilizing native API keys.
    Extracts response payload agnostic of the HTTP layer.
    """
    url = f"{settings.QUBRID_BASE_URL}/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.QUBRID_API_KEY}"
    }
    payload = {
        "model": "meta-llama/Llama-3.3-70B-Instruct",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 4096,
        "temperature": 0.7,
        "top_p": 0.9,
        "stream": False
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        # Safely parse both Qubrid native and OpenAI compatible structures
        text = data.get("content") or data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return text.strip()
