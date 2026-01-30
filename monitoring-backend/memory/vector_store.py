import faiss
import numpy as np
import pickle
import os

class VectorStore:
    def __init__(self, dim=384, index_path="memory.index", meta_path="memory_meta.pkl"):
        self.dim = dim
        self.index = faiss.IndexFlatL2(dim)
        self.metadata = []
        self.index_path = index_path
        self.meta_path = meta_path
        
        # Try to load existing data if available (simple persistence)
        # However, requirements said "Offline, Fast, No infra". 
        # Persistence "during runtime" is mandatory. 
        # I'll add simple disk persistence just in case, but rely on runtime memory mostly.
        # Actually user said "Memory persists during runtime". 
        # I'll keep it simple in-memory for now to match "No infra" strictness, 
        # but the class structure allows easy extension.
    
    def add(self, vector, meta):
        """
        Add a vector and its metadata to the store.
        """
        # FAISS expects float32
        vector = np.array([vector]).astype("float32")
        self.index.add(vector)
        self.metadata.append(meta)

    def search(self, vector, k=3):
        """
        Search for k nearest neighbors.
        """
        if self.index.ntotal == 0:
            return []
        
        vector = np.array([vector]).astype("float32")
        distances, indices = self.index.search(vector, k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx != -1 and idx < len(self.metadata):
                results.append(self.metadata[idx])
                
        return results

    def _persist(self):
        """Experimental file persistence if needed later"""
        pass
