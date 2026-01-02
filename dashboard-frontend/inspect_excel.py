import pandas as pd
import os
import sys

file_path = 'Standard.xlsx'
output_file = 'inspection_result.txt'

if not os.path.exists(file_path):
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"File not found: {file_path}")
    exit(1)

try:
    with open(output_file, 'w', encoding='utf-8') as f:
        xls = pd.ExcelFile(file_path)
        f.write(f"Sheet names: {xls.sheet_names}\n")
        
        for sheet_name in xls.sheet_names:
            f.write(f"\n--- Sheet: {sheet_name} ---\n")
            df = pd.read_excel(xls, sheet_name=sheet_name)
            f.write(f"Columns: {list(df.columns)}\n")
            f.write(f"Shape: {df.shape}\n")
            f.write("First 5 rows:\n")
            f.write(df.head().to_string())
            f.write("\n" + "-" * 30 + "\n")
            
except Exception as e:
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"Error reading Excel file: {e}")
