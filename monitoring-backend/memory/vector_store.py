import faiss
import json
import os
import numpy as np

class VectorStore:
    def __init__(self, dim=384, index_path="memory/storage/index.faiss", meta_path="memory/storage/meta.json"):
        self.dim = dim
        self.index_path = index_path
        self.meta_path = meta_path

        # Create storage directory if it doesn't exist
        os.makedirs(os.path.dirname(index_path), exist_ok=True)

        if os.path.exists(index_path) and os.path.exists(meta_path):
            try:
                self.index = faiss.read_index(index_path)
                with open(meta_path, "r") as f:
                    self.meta = json.load(f)
                print(f"Loaded VectorStore with {self.index.ntotal} entries.")
            except Exception as e:
                print(f"Failed to load VectorStore, starting fresh: {e}")
                self.index = faiss.IndexFlatL2(dim)
                self.meta = []
        else:
            self.index = faiss.IndexFlatL2(dim)
            self.meta = []

    def add(self, vector, metadata):
        vector = np.array(vector).astype("float32").reshape(1, -1)
        self.index.add(vector)
        self.meta.append(metadata)
        self._persist()

    def search(self, vector, k=5):
        if self.index.ntotal == 0:
            return []

        vector = np.array(vector).astype("float32").reshape(1, -1)
        distances, indices = self.index.search(vector, k)

        results = []
        for idx in indices[0]:
            if idx != -1 and idx < len(self.meta):
                results.append(self.meta[idx])

        return results

    def _persist(self):
        try:
            faiss.write_index(self.index, self.index_path)
            with open(self.meta_path, "w") as f:
                json.dump(self.meta, f, indent=2)
            print(f"Persisted VectorStore to {self.index_path}")
        except Exception as e:
            print(f"Failed to persist VectorStore: {e}")
