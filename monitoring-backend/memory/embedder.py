from sentence_transformers import SentenceTransformer

# Load model once at module level (singleton pattern by module caching)
# Using a small, fast model suitable for CPU
model = SentenceTransformer("all-MiniLM-L6-v2")

def embed(text: str):
    """
    Embeds a single string into a vector.
    
    Args:
        text (str): The text to embed.
        
    Returns:
        numpy.ndarray: The embedding vector.
    """
    return model.encode(text)
