import zipfile
import re
import os
import shutil

def repair_pptx_xml(file_path):
    temp_path = file_path + ".temp"
    backup_path = file_path + ".bak"
    
    # Regex to find '&' not followed by amp;, lt;, gt;, quot;, apos; or numeric entities
    amp_regex = re.compile(r'&(?!(amp|lt|gt|quot|apos|#[0-9]+|#x[0-9a-fA-F]+);)')
    
    print(f"Reading {file_path} and repairing to {temp_path}...")
    
    repaired_count = 0
    with zipfile.ZipFile(file_path, 'r') as zin:
        with zipfile.ZipFile(temp_path, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                data = zin.read(item.filename)
                if item.filename.endswith('.xml') or item.filename.endswith('.rels'):
                    try:
                        text = data.decode('utf-8')
                        new_text, count = amp_regex.subn('&amp;', text)
                        if count > 0:
                            print(f"  Fixed {count} raw '&' in {item.filename}")
                            repaired_count += count
                        data = new_text.encode('utf-8')
                    except UnicodeDecodeError:
                        # If decoding fails, write the original binary data
                        pass
                zout.writestr(item, data)
                
    if repaired_count > 0 or not os.path.exists(backup_path):
        print(f"Repair complete. Total raw '&' fixed: {repaired_count}")
        # Create backup if not exists
        if not os.path.exists(backup_path):
            shutil.copy2(file_path, backup_path)
            print(f"Created backup at {backup_path}")
        # Replace original with temp
        os.remove(file_path)
        shutil.move(temp_path, file_path)
        print("Replaced original pptx with repaired version.")
    else:
        print("No repairs needed.")
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    file_path = r"c:\Github repos\projects\Test Nexus\Test Nexus Proposition.pptx"
    repair_pptx_xml(file_path)
