import json, base64, os, sys

# Read all chunk files and combine
chunks = []
i = 0
while True:
    chunk_path = os.path.join(os.path.dirname(__file__), f'chunk-{i:03d}.txt')
    if not os.path.exists(chunk_path):
        break
    with open(chunk_path, 'r') as f:
        chunks.append(f.read())
    i += 1

print(f'Read {i} chunks')
combined = ''.join(chunks)
data = json.loads(base64.b64decode(combined).decode('utf-8'))
print(f'Decoded {len(data)} files')

base_dir = os.path.dirname(__file__)
for rel_path, content in data.items():
    # Convert forward slashes to OS path
    full_path = os.path.join(base_dir, rel_path.replace('/', os.sep))
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)

print(f'Successfully wrote {len(data)} files')
