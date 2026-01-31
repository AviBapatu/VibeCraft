from sentence_transformers import SentenceTransformer

# Load model once at module level (singleton pattern by module caching)
# Using a small, fast model suitable for CPU
_model = SentenceTransformer("all-MiniLM-L6-v2")

class Embedder:
    def __init__(self):
        self.model = _model
        self.dim = self.model.get_sentence_embedding_dimension()

    def embed(self, text: str):
        """
        Embeds a single string into a vector.
        
        Args:
            text (str): The text to embed.
            
        Returns:
            list: The embedding vector as a list.
        """
        return self.model.encode(text).tolist()

# Expose a default instance for backward compatibility if needed, 
# or for simple usage, though IncidentManager will instantiate its own or use this.
embedder = Embedder()

def embed(text: str):
    """Legacy wrapper for backward compatibility"""
    return embedder.embed(text)
