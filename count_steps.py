import sys
import json

# Read the JSON from stdin
data = json.load(sys.stdin)

# Print the number of trace steps
print(f"Number of trace steps: {len(data['trace'])}")

# Show some example steps
print("\nFirst few steps:")
for i, step in enumerate(data['trace'][:3]):
    print(f"Step {i+1}: Line {step['line']}, Variables: {list(step['globals'].keys())}")
