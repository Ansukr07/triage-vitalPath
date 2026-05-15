import sys
sys.path.append('c:/medic/backend/scripts')
import clinical_bert_app

print("ENTITY_BLACKLIST CONTENT:")
for item in sorted(list(clinical_bert_app.ENTITY_BLACKLIST)):
    print(f"Item: {repr(item)}")

print("\nTESTING MEMBERSHIP:")
test_val = "date"
print(f"'{test_val}' in blacklist: {test_val in clinical_bert_app.ENTITY_BLACKLIST}")
